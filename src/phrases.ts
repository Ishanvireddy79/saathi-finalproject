import AsyncStorage from '@react-native-async-storage/async-storage';

export type Phrase = { id: string; text: string };

const KEY = 'saathi_phrases_v1';

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