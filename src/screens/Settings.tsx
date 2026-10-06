import React from 'react';
import { Alert, ScrollView } from 'react-native';
import { colors } from '../theme';
import { useProfile } from '../ProfileContext';
import { BigButton, Body, Card, Option, Title } from '../ui';
import { Lang, Need, TextSize } from '../storage';
import Contacts from './Contacts';
import SosGuide from './SosGuide';

const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिन्दी (Hindi)' },
  { id: 'te', label: 'తెలుగు (Telugu)' },
];

const NEEDS: { id: Need; label: string }[] = [
  { id: 'blind', label: 'Blind or low vision' },
  { id: 'deaf', label: 'Deaf or hard of hearing' },
  { id: 'speech', label: 'Difficulty speaking' },
];

const SIZES: { id: TextSize; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'large', label: 'Large' },
  { id: 'xlarge', label: 'Extra large' },
];

export default function Settings() {
  const { profile, update, reset } = useProfile();

  const toggleNeed = (n: Need) => {
    const cur = profile.needs;
    update({ needs: cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n] });
  };

  const confirmReset = () => {
    Alert.alert(
      'Reset Saathi?',
      'This removes everything saved on this phone, including your settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => reset() },
      ]
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 200 }}
      keyboardShouldPersistTaps="handled"
    >
      <Title>Settings</Title>

      <Body>Language</Body>
      {LANGS.map((l) => (
        <Option
          key={l.id}
          label={l.label}
          selected={profile.language === l.id}
          onPress={() => update({ language: l.id })}
        />
      ))}
      <Body muted>The app will speak your language fully in a later step.</Body>

      <Body>{' '}</Body>
      <Body>Text size</Body>
      {SIZES.map((s) => (
        <Option
          key={s.id}
          label={s.label}
          selected={profile.textSize === s.id}
          onPress={() => update({ textSize: s.id })}
        />
      ))}

      <Body>{' '}</Body>
      <Body>How can Saathi help?</Body>
      {NEEDS.map((n) => (
        <Option
          key={n.id}
          role="checkbox"
          label={n.label}
          selected={profile.needs.includes(n.id)}
          onPress={() => toggleNeed(n.id)}
        />
      ))}
            <Body>{' '}</Body>
      <Contacts />

      <Body>{' '}</Body>
      <SosGuide />

      <Body>{' '}</Body>
      <Card>       
         <Body>
          Privacy: everything you enter stays on this phone. The only exception is the words you type
          to the assistant when you turn Online help on. Those are sent to a free AI service to get an
          answer. Your medicines, appointments, contacts and location are never sent.
        </Body>
      </Card>
      <Card style={{ backgroundColor: colors.sageSoft }}>
        <Body>
          About: Saathi is an assistive aid. It does not replace a cane, a guide or a doctor.
        </Body>
      </Card>

      <BigButton label="Reset app data" onPress={confirmReset} />
    </ScrollView>
  );
}