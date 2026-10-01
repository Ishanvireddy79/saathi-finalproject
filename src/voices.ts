import * as Speech from 'expo-speech';

const NAMES: Record<string, string> = {
  'hi-IN': 'Hindi',
  'te-IN': 'Telugu',
  'en-IN': 'English',
};

// Returns true if the phone has a voice for this language.
// If we cannot check, we say true and let the phone try.
export async function hasVoiceFor(lang: string): Promise<boolean> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    if (!voices || voices.length === 0) return true;
    const prefix = lang.split('-')[0].toLowerCase();
    return voices.some((v: any) =>
      String(v.language || '')
        .toLowerCase()
        .replace('_', '-')
        .startsWith(prefix)
    );
  } catch {
    return true;
  }
}

export function installHelp(lang: string): string {
  const name = NAMES[lang] ?? 'this language';
  return (
    'Your phone may not have a ' +
    name +
    ' voice yet. To add it: open phone Settings, search for "Text-to-speech output", tap the gear next to Speech Services by Google, then Install voice data, and choose ' +
    name +
    '.'
  );
}