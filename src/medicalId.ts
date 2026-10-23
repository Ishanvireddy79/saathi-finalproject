import AsyncStorage from '@react-native-async-storage/async-storage';

export type MedicalId = {
  name: string;
  bloodGroup: string;
  allergies: string;
  conditions: string;
  medicines: string;
  note: string;
};

export const EMPTY_MEDICAL_ID: MedicalId = {
  name: '',
  bloodGroup: '',
  allergies: '',
  conditions: '',
  medicines: '',
  note: '',
};

const KEY = 'saathi_medical_id_v1';

export async function loadMedicalId(): Promise<MedicalId> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return EMPTY_MEDICAL_ID;
  try {
    return { ...EMPTY_MEDICAL_ID, ...(JSON.parse(raw) as Partial<MedicalId>) };
  } catch {
    return EMPTY_MEDICAL_ID;
  }
}

export async function saveMedicalId(m: MedicalId): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(m));
}

export function isEmptyMedicalId(m: MedicalId): boolean {
  return Object.values(m).every((v) => !String(v).trim());
}

// Text used for reading the Medical ID aloud.
export function medicalIdToSpeech(m: MedicalId): string {
  const parts: string[] = [];
  if (m.name.trim()) parts.push('Name: ' + m.name.trim() + '.');
  if (m.bloodGroup.trim()) parts.push('Blood group: ' + m.bloodGroup.trim() + '.');
  if (m.allergies.trim()) parts.push('Allergies: ' + m.allergies.trim() + '.');
  if (m.conditions.trim()) parts.push('Health conditions: ' + m.conditions.trim() + '.');
  if (m.medicines.trim()) parts.push('Medicines: ' + m.medicines.trim() + '.');
  if (m.note.trim()) parts.push(m.note.trim());
  return parts.join(' ');
}