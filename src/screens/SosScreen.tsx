import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text } from 'react-native';
import { colors } from '../theme';
import { useProfile } from '../ProfileContext';
import { BigButton, Body, Title } from '../ui';
import { Contact, loadContacts } from '../contacts';
import { callEmergency, sendEmergencySms } from '../sos';

export default function SosScreen({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { fs } = useProfile();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (visible) {
      setStatus('');
      loadContacts()
        .then(setContacts)
        .catch((e: any) => setStatus('Could not load contacts: ' + (e?.message ?? String(e))));
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 24, paddingTop: 64, paddingBottom: 48 }}
      >
        <Title>Emergency help</Title>
        <Body>Stay calm. Choose what you need.</Body>
        <Text style={{ height: 16 }} />

        <BigButton
          label="Call 112"
          onPress={async () => setStatus(await callEmergency())}
        />
        <BigButton
          label="Send message to my contacts"
          onPress={async () => setStatus(await sendEmergencySms(contacts))}
        />
        <Text style={{ height: 8 }} />
        <Body muted>
          {contacts.length === 0
            ? 'You have no emergency contacts. Add them in Settings.'
            : 'Contacts: ' + contacts.map((c) => c.name).join(', ')}
        </Body>

        {status ? (
          <Text
            accessibilityLiveRegion="polite"
            style={{ fontSize: fs(18), color: colors.accent, marginTop: 16 }}
          >
            {status}
          </Text>
        ) : null}

        <Text style={{ height: 16 }} />
        <Body muted>
          The phone opens the dialer or messages for you. You must press call or send yourself.
        </Body>
        <BigButton label="Close" onPress={onClose} />
      </ScrollView>
    </Modal>
  );
}