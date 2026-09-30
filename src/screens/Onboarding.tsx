import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { colors } from '../theme';
import { useProfile } from '../ProfileContext';
import { BigButton, Body, Option, Title } from '../ui';
import { Lang, Need, TextSize } from '../storage';

const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिन्दी (Hindi)' },
  { id: 'te', label: 'తెలుగు (Telugu)' },
];

const NEEDS: { id: Need; label: string }[] = [
  { id: 'blind', label: 'I am blind or have low vision' },
  { id: 'deaf', label: 'I am deaf or hard of hearing' },
  { id: 'speech', label: 'I have difficulty speaking' },
];

const SIZES: { id: TextSize; label: string }[] = [
  { id: 'normal', label: 'Normal text' },
  { id: 'large', label: 'Large text' },
  { id: 'xlarge', label: 'Extra large text' },
];

export default function Onboarding() {
  const { profile, update, fs } = useProfile();
  const [language, setLanguage] = useState<Lang>(profile.language);
  const [needs, setNeeds] = useState<Need[]>(profile.needs);
  const [textSize, setTextSize] = useState<TextSize>(profile.textSize);

  const toggleNeed = (n: Need) =>
    setNeeds((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 24, paddingTop: 64, paddingBottom: 48 }}
    >
      <Text
        accessibilityRole="header"
        style={{ fontSize: fs(38), fontWeight: 'bold', color: colors.accent, marginBottom: 6 }}
      >
        Welcome to Saathi
      </Text>
      <Body muted>Your companion. Let us set things up for you. It takes a minute.</Body>

      <Text style={{ height: 24 }} />
      <Title>Your language</Title>
      {LANGS.map((l) => (
        <Option
          key={l.id}
          label={l.label}
          selected={language === l.id}
          onPress={() => setLanguage(l.id)}
        />
      ))}

      <Text style={{ height: 16 }} />
      <Title>How can Saathi help?</Title>
      <Body muted>You can choose more than one.</Body>
      <Text style={{ height: 10 }} />
      {NEEDS.map((n) => (
        <Option
          key={n.id}
          role="checkbox"
          label={n.label}
          selected={needs.includes(n.id)}
          onPress={() => toggleNeed(n.id)}
        />
      ))}

      <Text style={{ height: 16 }} />
      <Title>Text size</Title>
      {SIZES.map((s) => (
        <Option
          key={s.id}
          label={s.label}
          selected={textSize === s.id}
          onPress={() => setTextSize(s.id)}
        />
      ))}

      <Text style={{ height: 16 }} />
      <Body muted>
        Saathi is a helper. It does not replace a cane, a guide or a doctor.
      </Body>
      <BigButton
        label="Continue"
        onPress={() => update({ language, needs, textSize, onboarded: true })}
      />
    </ScrollView>
  );
}