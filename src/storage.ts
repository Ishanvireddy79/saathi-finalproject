import AsyncStorage from '@react-native-async-storage/async-storage';

export type Need = 'blind' | 'deaf' | 'speech';
export type TextSize = 'normal' | 'large' | 'xlarge';
export type Lang = 'en' | 'hi' | 'te';

export type Profile = {
  language: Lang;
  needs: Need[];
  textSize: TextSize;
  onboarded: boolean;
};

export const defaultProfile: Profile = {
  language: 'en',
  needs: [],
  textSize: 'normal',
  onboarded: false,
};

const KEY = 'saathi_profile_v1';

export async function loadProfile(): Promise<Profile> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return defaultProfile;
  return { ...defaultProfile, ...JSON.parse(raw) };
}

export async function saveProfile(p: Profile): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(p));
}

export async function resetAll(): Promise<void> {
  await AsyncStorage.clear();
}