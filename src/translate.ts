import TranslateText, { TranslateLanguage } from '@react-native-ml-kit/translate-text';

export type Target = 'asis' | 'hi' | 'te';

export const TARGET_NAMES: Record<string, string> = {
  hi: 'Hindi',
  te: 'Telugu',
};

export async function translateEnglishTo(text: string, target: 'hi' | 'te'): Promise<string> {
  const TL: any = TranslateLanguage;
  try {
    const out: any = await TranslateText.translate({
      text,
      sourceLanguage: TL?.ENGLISH ?? 'en',
      targetLanguage: target === 'hi' ? TL?.HINDI ?? 'hi' : TL?.TELUGU ?? 'te',
      downloadModelIfNeeded: true,
    });
    const result = String(out ?? '').trim();
    if (!result) throw new Error('The translation came back empty.');
    return result;
  } catch (e: any) {
    throw new Error(
      (e?.message ?? String(e)) +
        ' (The first time, the ' +
        TARGET_NAMES[target] +
        ' language pack must be downloaded, so please turn on the internet once and try again.)'
    );
  }
}