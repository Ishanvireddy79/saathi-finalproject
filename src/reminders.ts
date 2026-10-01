import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type Medicine = {
  id: string;
  name: string;
  dose: string;
  hour: number;
  minute: number;
  notifId: string;
};

export type Appointment = {
  id: string;
  title: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  notifId: string;
};

const MED_KEY = 'saathi_medicines_v1';
const APPT_KEY = 'saathi_appointments_v1';
const CHANNEL = 'reminders';

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  // Reminders are optional. The app still works.
}

export async function setupNotifications(): Promise<string> {
  try {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(CHANNEL, {
            name: 'Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 400, 200, 400],
          });
    }
    const cur = await Notifications.getPermissionsAsync();
    let status = cur.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') {
      return 'Notifications are turned off. Please turn them on for Saathi in your phone settings, so reminders can ring.';
    }
    return '';
  } catch (e: any) {
    return 'Could not set up reminders: ' + (e?.message ?? String(e));
  }
}

export function fmtTime(hour: number, minute: number): string {
  const pm = hour >= 12;
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const mm = minute < 10 ? '0' + minute : String(minute);
  return h12 + ':' + mm + (pm ? ' PM' : ' AM');
}

export function fmtDate(a: Appointment): string {
  const dd = a.day < 10 ? '0' + a.day : String(a.day);
  const mo = a.month < 10 ? '0' + a.month : String(a.month);
  return dd + '/' + mo + '/' + a.year;
}

export function parseTime(text: string, pm: boolean): { hour: number; minute: number } | null {
  const m = text.trim().match(/^(\d{1,2})(?:[:.](\d{2}))?$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  if (h < 1 || h > 12 || min > 59) return null;
  return { hour: (h % 12) + (pm ? 12 : 0), minute: min };
}

export function parseDate(text: string): { year: number; month: number; day: number } | null {
  const m = text.trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return { year, month, day };
}

export function apptTime(a: Appointment): number {
  return new Date(a.year, a.month - 1, a.day, a.hour, a.minute).getTime();
}

export async function loadMedicines(): Promise<Medicine[]> {
  const raw = await AsyncStorage.getItem(MED_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Medicine[];
  } catch {
    return [];
  }
}

export async function saveMedicines(list: Medicine[]): Promise<void> {
  await AsyncStorage.setItem(MED_KEY, JSON.stringify(list));
}

export async function loadAppointments(): Promise<Appointment[]> {
  const raw = await AsyncStorage.getItem(APPT_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Appointment[];
  } catch {
    return [];
  }
}

export async function saveAppointments(list: Appointment[]): Promise<void> {
  await AsyncStorage.setItem(APPT_KEY, JSON.stringify(list));
}

export async function scheduleMedicine(name: string, dose: string, hour: number, minute: number): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time for your medicine',
      body: dose ? name + ' (' + dose + ')' : name,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL,
    },
  });
}

export async function scheduleAppointment(a: Omit<Appointment, 'id' | 'notifId'>): Promise<string> {
  const when = new Date(a.year, a.month - 1, a.day, a.hour, a.minute).getTime();
  const now = Date.now();
  if (when <= now) throw new Error('That date and time has already passed.');
  // Remind one hour before. If that is already past, remind in a few seconds.
  let remindAt = when - 60 * 60 * 1000;
  if (remindAt <= now) remindAt = now + 5000;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Appointment reminder',
      body: a.title + ' at ' + fmtTime(a.hour, a.minute),
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(remindAt),
      channelId: CHANNEL,
    },
  });
}

export async function cancelReminder(notifId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notifId);
  } catch {
    // Already gone. Nothing to do.
  }
}
export async function scheduleTest(): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      content: {
        title: 'Saathi test',
        body: 'If you can see this, reminders work.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 10,
        channelId: CHANNEL,
      },
    });
  }
