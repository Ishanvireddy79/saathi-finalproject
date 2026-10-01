import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File, Paths } from 'expo-file-system';
import { decode } from 'jpeg-js';
import { loadTensorflowModel } from 'react-native-fast-tflite';

const SIZE = 320;
const MIN_SCORE = 0.4;
// If the names come out shifted (for example a cup is called a fork),
// change this number to 1 or -1.
const LABEL_OFFSET = 0;

const LABELS = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
  'traffic light', 'fire hydrant', '???', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
  'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', '???', 'backpack',
  'umbrella', '???', '???', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard',
  'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard',
  'tennis racket', 'bottle', '???', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl',
  'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut',
  'cake', 'chair', 'couch', 'potted plant', 'bed', '???', 'dining table', '???', '???', 'toilet',
  '???', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven',
  'toaster', 'sink', 'refrigerator', '???', 'book', 'clock', 'vase', 'scissors', 'teddy bear',
  'hair drier', 'toothbrush',
];

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const LOOKUP = new Uint8Array(256);
for (let i = 0; i < CHARS.length; i++) LOOKUP[CHARS.charCodeAt(i)] = i;

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = clean.length;
  const outLen = Math.floor((len * 3) / 4);
  const out = new Uint8Array(outLen);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const a = LOOKUP[clean.charCodeAt(i)];
    const b = LOOKUP[clean.charCodeAt(i + 1)];
    const c = i + 2 < len ? LOOKUP[clean.charCodeAt(i + 2)] : 0;
    const d = i + 3 < len ? LOOKUP[clean.charCodeAt(i + 3)] : 0;
    if (p < outLen) out[p++] = (a << 2) | (b >> 4);
    if (p < outLen) out[p++] = ((b & 15) << 4) | (c >> 2);
    if (p < outLen) out[p++] = ((c & 3) << 6) | d;
  }
  return out;
}

// The model library can only open a real file. So the first time, we unpack
// the model from the app into the phone's private storage, then reuse it.
function ensureModelFile(): string {
  const data = require('./modelData.json') as { size: number; b64: string };
  const file = new File(Paths.document, 'efficientdet_lite0.tflite');
  let ok = false;
  try {
    ok = file.exists && file.size === data.size;
  } catch {
    ok = false;
  }
  if (!ok) {
    const bytes = base64ToBytes(data.b64);
    file.create({ overwrite: true });
    file.write(bytes);
  }
  return file.uri;
}

let modelPromise: Promise<any> | null = null;
function getModel(): Promise<any> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const uri = ensureModelFile();
      return loadTensorflowModel({ url: uri }, []);
    })().catch((e: any) => {
      modelPromise = null;
      throw e;
    });
  }
  return modelPromise;
}

async function prepareInput(uri: string): Promise<Uint8Array> {
  const base = await ImageManipulator.manipulate(uri).renderAsync();
  const w = base.width;
  const h = base.height;
  const side = Math.min(w, h);
  const originX = Math.floor((w - side) / 2);
  const originY = Math.floor((h - side) / 2);

  const ctx = ImageManipulator.manipulate(base);
  ctx.crop({ originX, originY, width: side, height: side });
  ctx.resize({ width: SIZE, height: SIZE });
  const rendered = await ctx.renderAsync();
  const saved = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: 1,
    base64: true,
  });
  if (!saved.base64) throw new Error('No image data came back from the resizer.');

  const bytes = base64ToBytes(saved.base64);
  const img: any = decode(bytes as any, { useTArray: true, formatAsRGBA: false });
  if (img.width !== SIZE || img.height !== SIZE) {
    throw new Error('Resized image is ' + img.width + 'x' + img.height + ', expected 320x320.');
  }
  const pixels = SIZE * SIZE;
  if (img.data.length === pixels * 3) return img.data as Uint8Array;
  if (img.data.length === pixels * 4) {
    const rgb = new Uint8Array(pixels * 3);
    for (let i = 0, j = 0; i < pixels; i++) {
      rgb[j++] = img.data[i * 4];
      rgb[j++] = img.data[i * 4 + 1];
      rgb[j++] = img.data[i * 4 + 2];
    }
    return rgb;
  }
  throw new Error('Unexpected pixel data size: ' + img.data.length);
}

function toF32(o: any): Float32Array {
  if (o instanceof Float32Array) return o;
  if (o instanceof ArrayBuffer) return new Float32Array(o);
  if (o && o.buffer) return new Float32Array(o.buffer, o.byteOffset ?? 0, o.length);
  throw new Error('Unexpected model output type.');
}

function isIntegerLike(a: Float32Array, n: number): boolean {
  for (let i = 0; i < n; i++) {
    if (Math.abs(a[i] - Math.round(a[i])) > 1e-4) return false;
  }
  return true;
}

function where(xCenter: number): string {
  if (xCenter < 0.33) return 'on your left';
  if (xCenter > 0.66) return 'on your right';
  return 'ahead';
}

export type DetectResult = { sentence: string; debug: string };

export async function describeSurroundings(
  photoUri: string,
  onStage: (s: string) => void
): Promise<DetectResult> {
  onStage('Step 1 of 3: preparing the picture...');
  const input = await prepareInput(photoUri);

  onStage('Step 2 of 3: loading the model (the first time takes longer)...');
  const model = await getModel();

  onStage('Step 3 of 3: looking for objects...');
  const raw: any[] = await model.run([input.buffer as ArrayBuffer]);
  if (!raw || raw.length < 4) {
    throw new Error('Model gave ' + (raw ? raw.length : 0) + ' outputs, expected 4.');
  }

  const boxes = toF32(raw[0]);
  const a = toF32(raw[1]);
  const b = toF32(raw[2]);
  const count = Math.min(25, Math.max(0, Math.round(toF32(raw[3])[0])));

  let classes = a;
  let scores = b;
  const aInt = isIntegerLike(a, count);
  const bInt = isIntegerLike(b, count);
  if (bInt && !aInt) {
    classes = b;
    scores = a;
  }

  const found: { label: string; score: number; cls: number; x: number }[] = [];
  for (let i = 0; i < count; i++) {
    if (scores[i] < MIN_SCORE) continue;
    const cls = Math.round(classes[i]);
    const name = LABELS[cls + LABEL_OFFSET];
    const xmin = boxes[i * 4 + 1];
    const xmax = boxes[i * 4 + 3];
    found.push({
      label: name && name !== '???' ? name : 'something',
      score: scores[i],
      cls,
      x: (xmin + xmax) / 2,
    });
  }
  found.sort((p, q) => q.score - p.score);

  const debug =
    'count ' +
    count +
    ' | ' +
    found
      .slice(0, 5)
      .map((f) => 'id ' + f.cls + ' ' + f.label + ' ' + Math.round(f.score * 100) + '%')
      .join(', ');

  if (found.length === 0) {
    return {
      sentence: 'I could not clearly see anything I know. Try again with more light.',
      debug,
    };
  }

  const groups: Record<string, number> = {};
  const order: string[] = [];
  for (const f of found.slice(0, 8)) {
    const key = f.label + '|' + where(f.x);
    if (groups[key] === undefined) {
      groups[key] = 0;
      order.push(key);
    }
    groups[key] += 1;
  }
  const parts = order.slice(0, 5).map((key) => {
    const [label, pos] = key.split('|');
    return (groups[key] > 1 ? label + ' (' + groups[key] + ')' : label) + ', ' + pos;
  });
  return { sentence: 'I can see: ' + parts.join('. ') + '.', debug };
}