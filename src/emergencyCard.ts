import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadContacts } from './contacts';
import { loadMedicalId } from './medicalId';
import { loadUserProfile } from './userProfile';
import { setupNotifications } from './reminders';

// An "emergency card": a quiet notification that stays on the lock screen,
// so a helper can read it without unlocking the phone.

const ON_KEY = 'saathi_card_on_v1';
const HEALTH_KEY = 'saathi_card_health_v1';
const CARD_ID = 'saathi-emergency-card';
const CHANNEL = 'saathi-emergency-card';

type Listener = (on: boolean) => void;
const listeners = new Set<Listener>();

export function subscribeCard(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export async function isCardOn(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ON_KEY)) === 'yes';
  } catch {
    return false;
  }
}

// Health details are included unless the person turns them off.
export async function isCardHealthOn(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(HEALTH_KEY)) !== 'no';
  } catch {
    return true;
  }
}

export async function setCardHealth(on: boolean): Promise<void> {
  await AsyncStorage.setItem(HEALTH_KEY, on ? 'yes' : 'no');
  await refreshEmergencyCard();
}

export type CardResult = { ok: boolean; message: string };

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Emergency card',
    importance: Notifications.AndroidImportance.LOW,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: false,
    enableVibrate: false,
    sound: null,
  } as any);
}

async function removeCard(): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(CARD_ID);
  } catch {
    // Nothing shown.
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(CARD_ID);
  } catch {
    // Nothing scheduled.
  }
}

async function buildCard(): Promise<{ title: string; body: string } | null> {
  const [user, med, contacts, health] = await Promise.all([
    loadUserProfile(),
    loadMedicalId(),
    loadContacts(),
    isCardHealthOn(),
  ]);
  const name = (user.name || med.name).trim();
  const lines: string[] = [];
  if (health) {
    if (med.bloodGroup.trim()) lines.push('Blood group: ' + med.bloodGroup.trim());
    if (med.allergies.trim()) lines.push('Allergies: ' + med.allergies.trim());
    if (med.conditions.trim()) lines.push('Health conditions: ' + med.conditions.trim());
    if (med.medicines.trim()) lines.push('Medicines: ' + med.medicines.trim());
    if (med.note.trim()) lines.push(med.note.trim());
  }
  if (contacts.length) {
    lines.push('Call: ' + contacts.slice(0, 3).map((c) => c.name + ' ' + c.phone).join(', '));
  }
  if (!name && lines.length === 0) return null;
  return {
    title: name ? 'Emergency card: ' + name : 'Emergency card',
    body: lines.join('\n'),
  };
}

// Posts or updates the card. Never throws.
export async function refreshEmergencyCard(): Promise<CardResult> {
  try {
    if (!(await isCardOn())) {
      await removeCard();
      return { ok: true, message: '' };
    }
    const card = await buildCard();
    if (!card) {
      await removeCard();
      return { ok: false, message: 'Add your name, Medical ID or an emergency contact first.' };
    }
    await ensureChannel();
    await Notifications.scheduleNotificationAsync({
      identifier: CARD_ID,
      content: {
        title: card.title,
        body: card.body,
        sticky: true,
        autoDismiss: false,
        color: '#1D3F94',
        data: { type: 'emergency-card' },
      } as any,
      trigger: (Platform.OS === 'android' ? { channelId: CHANNEL } : null) as any,
    });
    return { ok: true, message: '' };
  } catch (e: any) {
    return { ok: false, message: 'Could not show the emergency card: ' + (e?.message ?? String(e)) };
  }
}

export async function enableEmergencyCard(): Promise<CardResult> {
  try {
    const problem = await setupNotifications();
    if (problem) return { ok: false, message: problem };
    await AsyncStorage.setItem(ON_KEY, 'yes');
    const r = await refreshEmergencyCard();
    if (!r.ok) {
      await AsyncStorage.setItem(ON_KEY, 'no');
      return r;
    }
    listeners.forEach((l) => l(true));
    return { ok: true, message: '' };
  } catch (e: any) {
    return { ok: false, message: 'Could not turn it on: ' + (e?.message ?? String(e)) };
  }
}

export async function disableEmergencyCard(): Promise<CardResult> {
  try {
    await AsyncStorage.setItem(ON_KEY, 'no');
    await removeCard();
    listeners.forEach((l) => l(false));
    return { ok: true, message: '' };
  } catch (e: any) {
    return { ok: false, message: 'Could not turn it off: ' + (e?.message ?? String(e)) };
  }
}