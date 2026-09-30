import React from 'react';
import { ScrollView } from 'react-native';
import { colors } from '../theme';
import { Body, Card, Title } from '../ui';

export default function Assistant() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: 56 }}
    >
      <Title>Assistant</Title>
      <Card>
        <Body>Your friendly helper will live here. You will be able to talk or type to it.</Body>
      </Card>
    </ScrollView>
  );
}