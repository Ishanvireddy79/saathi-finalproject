import { Linking } from 'react-native';
import * as SMS from 'expo-sms';
import * as Location from 'expo-location';
import { Contact } from './contacts';

export async function callEmergency(): Promise<string> {
  try {
    await Linking.openURL('tel:112');
    return 'Dialer opened. Press the green call button to call 112.';
  } catch (e: any) {
    return 'Could not open the dialer: ' + (e?.message ?? String(e));
  }
}

async function getMapLink(): Promise<string> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return '';
    let pos = await Location.getLastKnownPositionAsync();
    if (!pos) {
      pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    }
    if (!pos) return '';
    const { latitude, longitude } = pos.coords;
    return 'https://maps.google.com/?q=' + latitude + ',' + longitude;
  } catch {
    return '';
  }
}

export async function sendEmergencySms(contacts: Contact[]): Promise<string> {
  try {
    if (contacts.length === 0) {
      return 'No emergency contacts yet. Add one in Settings.';
    }
    const available = await SMS.isAvailableAsync();
    if (!available) return 'This phone cannot send SMS.';

    const link = await getMapLink();
    const where = link
      ? 'My location: ' + link
      : 'My location could not be found.';
    const text = 'I need help. This is an emergency. ' + where;

    await SMS.sendSMSAsync(
      contacts.map((c) => c.phone),
      text
    );
    return 'Message is ready. Tap send in the messages app.';
  } catch (e: any) {
    return 'Could not open messages: ' + (e?.message ?? String(e));
  }
}