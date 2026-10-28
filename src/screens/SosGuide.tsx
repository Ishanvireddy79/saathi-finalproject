import React from 'react';
import { Platform, View } from 'react-native';
import { colors } from '../theme';
import { Body, Card } from '../ui';

function Gap() {
  return <View style={{ height: 12 }} />;
}

export default function SosGuide() {
  return (
    <View>
      <Card style={{ backgroundColor: colors.sageSoft }}>
        <Body>Emergency SOS on your phone</Body>
        <Body muted>
          Your phone has its own emergency feature that works even when Saathi is closed. Saathi cannot
          press your phone's buttons for you, so please turn it on in your phone's settings.
        </Body>
        <Gap />
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
        <Gap />
        <Body muted>Please test it once, so you know how it works before you need it.</Body>
      </Card>

      <Card>
        <Body>Help from a locked phone</Body>
        <Body muted>
          If you cannot unlock your phone, a helper can still read your emergency information from the
          lock screen.
        </Body>
        <Gap />
        {Platform.OS === 'ios' ? (
          <Body>
            iPhone: open the Health app, tap your picture, then Medical ID. Tap Edit, fill it in, and turn
            on Show When Locked and Emergency Call. A helper swipes up, taps Emergency, then Medical ID.
          </Body>
        ) : (
          <Body>
            Android: open Settings and search for "Medical information" or "Emergency information"
            (often under Safety and emergency). Add your name, blood type, allergies and contacts. A
            helper taps Emergency on the lock screen, then Emergency information.
          </Body>
        )}
        <Gap />
        <Body muted>
          Saathi can also keep an emergency card on your lock screen. Turn on "Emergency card on lock
          screen" in Settings. Anyone who picks up your phone can read it, so only include what you are
          happy to share.
        </Body>
      </Card>
    </View>
  );
}