import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserProfile = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

export const EMPTY_USER: UserProfile = {
  name: '',
  phone: '',
  email: '',
  address: '',
};

const KEY = 'saathi_user_profile_v1';

export async function loadUserProfile(): Promise<UserProfile> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return EMPTY_USER;
  try {
    return { ...EMPTY_USER, ...(JSON.parse(raw) as Partial<UserProfile>) };
  } catch {
    return EMPTY_USER;
  }
}

export async function saveUserProfile(user: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(user));
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || '';
}

export function initial(name: string): string {
  const ch = name.trim().charAt(0);
  return ch ? ch.toUpperCase() : '';
}
