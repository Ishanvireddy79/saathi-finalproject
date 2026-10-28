import React, { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as Speech from 'expo-speech';
import { colors, shadow } from '../theme';
import { useProfile } from '../ProfileContext';
import { Avatar, Backdrop, BackButton, BigButton, Body, Card, Chip, TOP_PAD } from '../ui';
import { Contact, loadContacts } from '../contacts';
import { voiceLanguage } from '../phrases';
import {
  EMPTY_MEDICAL_ID,
  MedicalId,
  isEmptyMedicalId,
  loadMedicalId,
  medicalIdToSpeech,
  saveMedicalId,
} from '../medicalId';

const FIELDS: { key: keyof MedicalId; label: string; hint: string; multiline?: boolean }[] = [
  { key: 'name', label: 'Full name', hint: 'Your name' },
  { key: 'bloodGroup', label: 'Blood group', hint: 'For example O positive' },
  { key: 'allergies', label: 'Allergies', hint: 'Medicines, food or anything else', multiline: true },
  { key: 'conditions', label: 'Health conditions', hint: 'Anything a doctor should know', multiline: true },
  { key: 'medicines', label: 'Medicines you take', hint: 'Names and doses', multiline: true },
  { key: 'note', label: 'Anything else people should know', hint: 'For example: I am deaf. Please write.', multiline: true },
];

// Form shown in Settings.
export function MedicalIdEditor() {
  const { fs } = useProfile();
  const [data, setData] = useState<MedicalId>(EMPTY_MEDICAL_ID);
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadMedicalId()
      .then(setData)
      .catch((e: any) => setStatus('Could not load: ' + (e?.message ?? String(e))));
  }, []);

  const save = async () => {
    try {
      await saveMedicalId(data);
      setStatus('Saved on this phone.');
    } catch (e: any) {
      setStatus('Could not save: ' + (e?.message ?? String(e)));
    }
  };

  return (
    <View>
      <Body>Medical ID</Body>
      <Body muted>
        Optional. It stays on this phone and is shown only when you open it from the Emergency screen
        or Home. Enter only what you are happy for a helper to see.
      </Body>
      <View style={{ height: 10 }} />
      {FIELDS.map((f) => (
        <View key={f.key}>
          <Text style={{ fontSize: fs(16), color: colors.muted, marginBottom: 4 }}>{f.label}</Text>
          <TextInput
            value={data[f.key]}
            onChangeText={(v) => setData((cur) => ({ ...cur, [f.key]: v }))}
            placeholder={f.hint}
            placeholderTextColor={colors.muted}
            multiline={f.multiline}
            accessibilityLabel={f.label}
            style={{
              minHeight: f.multiline ? 88 : 64,
              borderWidth: 1.5,
              borderColor: colors.border,
              borderRadius: 16,
              backgroundColor: colors.card,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: fs(19),
              color: colors.text,
              marginBottom: 10,
              textAlignVertical: f.multiline ? 'top' : 'center',
            }}
          />
        </View>
      ))}
      <BigButton label="Save Medical ID" onPress={save} />
      {status ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{ fontSize: fs(17), color: colors.accent, marginTop: 8 }}
        >
          {status}
        </Text>
      ) : null}
    </View>
  );
}

// Full-screen profile for a helper, with a read-aloud button.
export default function MedicalIdView({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { fs } = useProfile();
  const [data, setData] = useState<MedicalId>(EMPTY_MEDICAL_ID);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!visible) return;
    Promise.all([loadMedicalId(), loadContacts()])
      .then(([m, c]) => {
        setData(m);
        setContacts(c);
      })
      .catch((e: any) => setStatus('Could not load: ' + (e?.message ?? String(e))));
  }, [visible]);

  const close = () => {
    try {
      Speech.stop();
    } catch {
      // Nothing to stop.
    }
    setStatus('');
    onClose();
  };

  const readAloud = () => {
    let t = medicalIdToSpeech(data);
    if (contacts.length) t += ' Emergency contacts: ' + contacts.map((c) => c.name).join(', ') + '.';
    if (!t.trim()) return;
    try {
      Speech.stop();
      Speech.speak(t, { language: voiceLanguage(t), rate: 0.9 });
    } catch (e: any) {
      setStatus('Could not speak: ' + (e?.message ?? String(e)));
    }
  };

  const call = (c: Contact) => {
    Linking.openURL('tel:' + c.phone).catch(() => setStatus('Could not open the phone dialer.'));
  };

  const empty = isEmptyMedicalId(data);
  const name = data.name.trim();
  const sections = FIELDS.filter((f) => f.key !== 'name' && f.key !== 'bloodGroup' && data[f.key].trim());

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 20, paddingTop: TOP_PAD, paddingBottom: 60 }}
      >
        <Backdrop />

        <View style={{ marginBottom: 16 }}>
          <BackButton onPress={close} />
        </View>

        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          <Avatar label={name ? name.charAt(0).toUpperCase() : '🩺'} tone="sos" size={96} />
          <Text
            accessibilityRole="header"
            selectable
            style={{
              fontSize: fs(28),
              fontWeight: '800',
              letterSpacing: -0.4,
              color: colors.text,
              marginTop: 14,
              textAlign: 'center',
            }}
          >
            {name || 'Medical ID'}
          </Text>
          <Text style={{ fontSize: fs(15), color: colors.muted, marginTop: 2 }}>Medical ID</Text>
          {data.bloodGroup.trim() ? (
            <View style={{ marginTop: 12 }}>
              <Chip label={'Blood group ' + data.bloodGroup.trim()} tone="sos" />
            </View>
          ) : null}
        </Card>

        {empty ? (
          <Body muted>No Medical ID yet. You can add one in Settings.</Body>
        ) : (
          sections.map((f) => (
            <Card key={f.key}>
              <Text style={{ fontSize: fs(14), fontWeight: '800', color: colors.muted, letterSpacing: 0.5 }}>
                {f.label.toUpperCase()}
              </Text>
              <Text selectable style={{ fontSize: fs(22), lineHeight: fs(30), color: colors.text, marginTop: 6 }}>
                {data[f.key]}
              </Text>
            </Card>
          ))
        )}

        {contacts.length > 0 ? (
          <Card>
            <Text style={{ fontSize: fs(14), fontWeight: '800', color: colors.muted, letterSpacing: 0.5 }}>
              EMERGENCY CONTACTS
            </Text>
            {contacts.map((c) => (
              <View
                key={c.id}
                style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}
              >
                <View style={{ flex: 1 }}>
                  <Text selectable style={{ fontSize: fs(20), fontWeight: '700', color: colors.text }}>
                    {c.name}
                  </Text>
                  <Text selectable style={{ fontSize: fs(16), color: colors.muted }}>
                    {c.phone}
                  </Text>
                </View>
                <Pressable
                  onPress={() => call(c)}
                  accessibilityRole="button"
                  accessibilityLabel={'Call ' + c.name}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.sage,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 24 }}>📞</Text>
                </Pressable>
              </View>
            ))}
          </Card>
        ) : null}

        {!empty || contacts.length > 0 ? <BigButton label="Read aloud" onPress={readAloud} /> : null}
        {status ? (
          <Text accessibilityLiveRegion="polite" style={{ fontSize: fs(17), color: colors.accent, marginTop: 8 }}>
            {status}
          </Text>
        ) : null}
        <BigButton label="Close" onPress={close} />
      </ScrollView>
    </Modal>
  );
}