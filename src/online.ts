import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_TOKEN, PROXY_URL } from './config';

const KEY = 'saathi_online_v1';

export type Turn = { role: 'user' | 'assistant'; content: string };

export async function isOnlineEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === 'yes';
  } catch {
    return false;
  }
}

export async function setOnlineEnabled(on: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY, on ? 'yes' : 'no');
}

export async function askOnline(history: Turn[], language: string): Promise<string> {
  if (APP_TOKEN.startsWith('PASTE')) {
    throw new Error('The token is not set yet. Open src/config.ts and paste it.');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-App-Token': APP_TOKEN },
      body: JSON.stringify({ messages: history, language }),
      signal: controller.signal,
    });
    const data: any = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(
        data && data.error ? data.error + ' (code ' + res.status + ')' : 'Server code ' + res.status + '.'
      );
    }
    const reply = String(data?.reply ?? '').trim();
    if (!reply) throw new Error('The server sent an empty answer.');
    return reply;
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error('The server took too long to answer.');
    if (String(e?.message).includes('Network request failed')) throw new Error('No internet connection.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}