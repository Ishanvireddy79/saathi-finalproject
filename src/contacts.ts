import AsyncStorage from '@react-native-async-storage/async-storage';

export type Contact = { id: string; name: string; phone: string };

const KEY = 'saathi_contacts_v1';

export async function loadContacts(): Promise<Contact[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Contact[];
  } catch {
    return [];
  }
}

export async function saveContacts(list: Contact[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}