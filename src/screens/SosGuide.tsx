import React from 'react';
import { Platform } from 'react-native';
import { colors } from '../theme';
import { Body, Card } from '../ui';

export default function SosGuide() {
  return (
    <Card style={{ backgroundColor: colors.sageSoft }}>
      <Body>Emergency SOS on your phone</Body>
      <Body muted>
        Your phone has its own emergency feature that works even when Saathi is closed. Saathi cannot
        press your phone's buttons for you, so please turn it on in your phone's settings.
      </Body>
      <Body>{' '}</Body>
      {Platform.OS === 'ios' ? (
        <Body>
          iPhone: open Settings, then Emergency SOS. Turn on the side button option. Then press the side
          button 5 times quickly to call for help.
        </Body>
      ) : (
        <Body>
          Android: open your phone's Settings and search for "Emergency SOS" or "Safety and emergency".
          Turn it on. On most phones you then press the power button 5 times quickly to call for help.
          The steps and the number of presses can differ by phone brand.
        </Body>
      )}
      <Body>{' '}</Body>
      <Body muted>Please test it once, so you know how it works before you need it.</Body>
    </Card>
  );
}