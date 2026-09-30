import React, { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';
import { useProfile } from '../ProfileContext';
import { BigButton, Body, Card } from '../ui';
import { Contact, loadContacts, saveContacts } from '../contacts';

export default function Contacts() {
  const { fs } = useProfile();
  const [list, setList] = useState<Contact[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadContacts()
      .then(setList)
      .catch((e: any) => setStatus('Could not load: ' + (e?.message ?? String(e))));
  }, []);

  const persist = async (next: Contact[]) => {
    setList(next);
    try {
      await saveContacts(next);
      setStatus('');
    } catch (e: any) {
      setStatus('Could not save: ' + (e?.message ?? String(e)));
    }
  };

  const add = async () => {
    const n = name.trim();
    const p = phone.replace(/[^\d+]/g, '');
    if (!n || p.length < 6) {
      setStatus('Please enter a name and a phone number.');
      return;
    }
    await persist([...list, { id: String(Date.now()), name: n, phone: p }]);
    setName('');
    setPhone('');
  };

  const inputStyle = {
    minHeight: 64,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    fontSize: fs(19),
    color: colors.text,
    marginBottom: 10,
  } as const;

  return (
    <View>
      <Body>Emergency contacts</Body>
      <Text style={{ height: 8 }} />
      {list.length === 0 && <Body muted>No contacts yet.</Body>}
      {list.map((c) => (
        <Card key={c.id}>
          <Body>{c.name}</Body>
          <Body muted>{c.phone}</Body>
          <Pressable
            onPress={() => persist(list.filter((x) => x.id !== c.id))}
            accessibilityRole="button"
            accessibilityLabel={'Remove ' + c.name}
            style={{ minHeight: 64, justifyContent: 'center' }}
          >
            <Text style={{ fontSize: fs(18), color: colors.sos, fontWeight: 'bold' }}>
              Remove
            </Text>
          </Pressable>
        </Card>
      ))}
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Name"
        placeholderTextColor={colors.muted}
        accessibilityLabel="Contact name"
        style={inputStyle}
      />
      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="Phone number"
        placeholderTextColor={colors.muted}
        keyboardType="phone-pad"
        accessibilityLabel="Contact phone number"
        style={inputStyle}
      />
      <BigButton label="Add contact" onPress={add} />
      {status ? (
        <Text style={{ fontSize: fs(17), color: colors.sos, marginTop: 10 }}>{status}</Text>
      ) : null}
    </View>
  );
}