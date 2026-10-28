import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text } from 'react-native';
import { colors } from '../theme';
import { useProfile } from '../ProfileContext';
import { ActionRow, BigButton, ScreenHeader, TOP_PAD } from '../ui';
import { Contact, loadContacts } from '../contacts';
import { callEmergency, sendEmergencySms } from '../sos';
import MedicalIdView from './MedicalId';

export default function SosScreen({
  visible,
  onClose,
  hideMedicalId,
}: {
  visible: boolean;
  onClose: () => void;
  hideMedicalId?: boolean;
}) {
  const { fs } = useProfile();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [status, setStatus] = useState('');
  const [medOpen, setMedOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    loadContacts()
      .then(setContacts)
      .catch((e: any) => setStatus('Could not load contacts: ' + (e?.message ?? String(e))));
  }, [visible]);

  const close = () => {
    setStatus('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 20, paddingTop: TOP_PAD, paddingBottom: 48 }}
      >
        <ScreenHeader title="Emergency help" subtitle="Stay calm. Choose what you need." />

        <ActionRow
          solid
          icon="📞"
          title="Call 112"
          subtitle="Opens the phone dialer"
          onPress={async () => setStatus(await callEmergency())}
        />
        <ActionRow
          icon="💬"
          tone="accent"
          title="Message my contacts"
          subtitle={
            contacts.length === 0
              ? 'No contacts yet. Add them in Settings.'
              : contacts.map((c) => c.name).join(', ')
          }
          onPress={async () => setStatus(await sendEmergencySms(contacts))}
        />
        {hideMedicalId ? null : (
          <ActionRow
            icon="🩺"
            tone="sos"
            title="Show my Medical ID"
            subtitle="For a helper to read"
            onPress={() => setMedOpen(true)}
          />
        )}

        {status ? (
          <Text
            accessibilityLiveRegion="polite"
            style={{ fontSize: fs(18), color: colors.accent, marginTop: 8 }}
          >
            {status}
          </Text>
        ) : null}

        <Text style={{ fontSize: fs(15), color: colors.muted, lineHeight: fs(22), marginTop: 12 }}>
          The phone opens the dialer or messages for you. You must press call or send yourself.
        </Text>
        <BigButton label="Close" onPress={close} />
      </ScrollView>
      <MedicalIdView visible={medOpen} onClose={() => setMedOpen(false)} />
    </Modal>
  );
}