import AsyncStorage from '@react-native-async-storage/async-storage';

export type Phrase = { id: string; text: string };

const KEY = 'saathi_phrases_v1';
const FAV_KEY = 'saathi_phrase_favs_v1';

const DEFAULTS = [
  'Hello.',
  'Thank you.',
  'Please wait. I will type my answer.',
  'I cannot speak. Please read my phone.',
  'Please speak slowly.',
  'Can you help me, please?',
  'Please call 112.',
];

export async function loadPhrases(): Promise<Phrase[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return DEFAULTS.map((t, i) => ({ id: 'd' + i, text: t }));
  try {
    return JSON.parse(raw) as Phrase[];
  } catch {
    return DEFAULTS.map((t, i) => ({ id: 'd' + i, text: t }));
  }
}

export async function savePhrases(list: Phrase[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

// Favorites are stored as a list of phrase ids.
export async function loadFavs(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(FAV_KEY);
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}

export async function saveFavs(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(FAV_KEY, JSON.stringify(ids));
}

// Ready-made phrases the user can speak straight away or add to their own list.
// They are English; the "Speak in" setting translates them to Hindi or Telugu.
export type SuggestedGroup = { id: string; title: string; items: string[] };

export const SUGGESTED: SuggestedGroup[] = [
  {
    id: 'emergency',
    title: 'Emergency',
    items: [
      'I need help.',
      'Please call an ambulance.',
      'Please call the police.',
      'There is a fire.',
      'I cannot speak. Please read my screen.',
      'I am deaf. Please write or type.',
      'I am blind. Please guide me.',
    ],
  },
  {
    id: 'medical',
    title: 'Medical',
    items: [
      'I need a doctor.',
      'I cannot breathe well.',
      'I have an allergy. Please ask me before giving medicine.',
      'Please call my family.',
    ],
  },
  {
    id: 'daily',
    title: 'Daily needs',
    items: [
      'Where is the toilet?',
      'Please say that again, slowly.',
      'Please wait a moment.',
      'How much does this cost?',
      'Please help me cross the road.',
      'Which bus goes to this place?',
    ],
  },
];

export type Tile = { id: string; icon: string; label: string; say: string };

export const BOARD: Tile[] = [
  { id: 'help', icon: '🆘', label: 'Help', say: 'Please help me.' },
  { id: 'water', icon: '💧', label: 'Water', say: 'I would like some water, please.' },
  { id: 'food', icon: '🍽️', label: 'Food', say: 'I am hungry. I would like some food, please.' },
  { id: 'toilet', icon: '🚻', label: 'Toilet', say: 'I need to use the toilet.' },
  { id: 'pain', icon: '🤕', label: 'Pain', say: 'I am in pain.' },
  { id: 'medicine', icon: '💊', label: 'Medicine', say: 'I need my medicine.' },
  { id: 'yes', icon: '✅', label: 'Yes', say: 'Yes.' },
  { id: 'no', icon: '❌', label: 'No', say: 'No.' },
  { id: 'thanks', icon: '🙏', label: 'Thank you', say: 'Thank you.' },
  { id: 'tired', icon: '😴', label: 'Tired', say: 'I am tired. I need to rest.' },
  { id: 'hot', icon: '🥵', label: 'Too hot', say: 'I am too hot.' },
  { id: 'cold', icon: '🥶', label: 'Too cold', say: 'I am too cold.' },
  { id: 'family', icon: '📞', label: 'Call family', say: 'Please call my family.' },
  { id: 'repeat', icon: '🔁', label: 'Say again', say: 'Could you say that again, please?' },
];

// Picks a voice language from the letters typed.
export function voiceLanguage(text: string): string {
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN';
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';
  return 'en-IN';
}