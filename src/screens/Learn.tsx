import React from 'react';
import { ScrollView } from 'react-native';
import { colors } from '../theme';
import { Body, Card, Title } from '../ui';

export default function Learn() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: 56 }}
    >
      <Title>Learn</Title>
      <Card>
        <Body>Simple guides for each feature and about sign language will be here.</Body>
      </Card>
    </ScrollView>
  );
}