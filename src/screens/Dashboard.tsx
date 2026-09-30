import React from 'react';
import { ScrollView } from 'react-native';
import { colors } from '../theme';
import { useProfile } from '../ProfileContext';
import { Body, Card, Title } from '../ui';

export default function Dashboard() {
  const { profile } = useProfile();
  const { needs } = profile;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: 56 }}
    >
      <Title>Hello, friend</Title>
      <Body muted>Here is your home. More will appear here soon.</Body>
      <Body>{' '}</Body>

      <Card>
        <Body>🆘 Emergency help will be connected in the next step. The red button below is always there.</Body>
      </Card>

      {needs.includes('blind') && (
        <Card>
          <Body>👁️ See around me and read text. Coming soon.</Body>
        </Card>
      )}
      {needs.includes('deaf') && (
        <Card>
          <Body>👂 Live captions and sound alerts. Coming soon.</Body>
        </Card>
      )}
      {needs.includes('speech') && (
        <Card>
          <Body>💬 Type to speak and quick phrases. Coming soon.</Body>
        </Card>
      )}

      <Card>
        <Body>💊 Your medicines and appointments. Coming soon.</Body>
      </Card>

      <Card style={{ backgroundColor: colors.sageSoft }}>
        <Body>
          Saathi is a helper. It does not replace a cane, a guide or a doctor.
        </Body>
      </Card>
    </ScrollView>
  );
}