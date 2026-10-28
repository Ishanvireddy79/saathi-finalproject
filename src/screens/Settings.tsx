import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { colors, shadow } from '../theme';
import { useProfile } from '../ProfileContext';
import {
  Card,
  ChoiceRow,
  Glyph,
  Group,
  Row,
  ScreenHeader,
  SectionTitle,
  SheetModal,
  SwitchRow,
  TOP_PAD,
} from '../ui';
import { Lang, Need, TextSize } from '../storage';
import Contacts from './Contacts';
import SosGuide from './SosGuide';
import ProfileScreen from './ProfileScreen';
import { MedicalIdEditor } from './MedicalId';
import { EMPTY_USER, UserProfile, initial, loadUserProfile } from '../userProfile';
import {
  disableEmergencyCard,
  enableEmergencyCard,
  isCardHealthOn,
  isCardOn,
  setCardHealth,
  subscribeCard,
} from '../emergencyCard';

const LANGS: { id: Lang; label: string; native: string }[] = [
  { id: 'en', label: 'English', native: 'English' },
  { id: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { id: 'te', label: 'Telugu', native: 'తెలుగు' },
];

const SIZES: { id: TextSize; label: string; description: string }[] = [
  { id: 'normal', label: 'Normal', description: 'The standard size' },
  { id: 'large', label: 'Large', description: 'Easier to read' },
  { id: 'xlarge', label: 'Extra large', description: 'The biggest text' },
];

type Sheet = 'language' | 'size' | 'medical' | 'contacts' | 'sos' | 'privacy' | null;

export default function Settings() {
  const { profile, update, reset, fs } = useProfile();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<UserProfile>(EMPTY_USER);
  const [cardOn, setCardOn] = useState(false);
  const [cardHealth, setCardHealthState] = useState(true);

  const loadUser = useCallback(() => {
    loadUserProfile().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    loadUser();
    isCardOn().then(setCardOn);
    isCardHealthOn().then(setCardHealthState);
    return subscribeCard(setCardOn);
  }, [loadUser]);

  const toggleNeed = (n: Need) => {
    const cur = profile.needs;
    update({ needs: cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n] });
  };

  const toggleCard = async (next: boolean) => {
    const r = next ? await enableEmergencyCard() : await disableEmergencyCard();
    if (r.ok) setCardOn(next);
    else Alert.alert('Emergency card', r.message);
  };

  const toggleCardHealth = async (next: boolean) => {
    setCardHealthState(next);
    await setCardHealth(next);
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

  const lang = LANGS.find((l) => l.id === profile.language) ?? LANGS[0];
  const size = SIZES.find((s) => s.id === profile.textSize) ?? SIZES[0];
  const name = user.name.trim();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: TOP_PAD, paddingBottom: 60 }}
    >
      <ScreenHeader title="Settings" />

      {/* Profile card: tap to open the full profile */}
      <Pressable
        onPress={() => setProfileOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={
          'My profile. ' + (name || 'Add your name') + (user.phone ? ', ' + user.phone : '') + '. Opens your profile'
        }
        style={({ pressed }) => ({
          backgroundColor: colors.accent,
          borderRadius: 28,
          padding: 22,
          marginBottom: 22,
          opacity: pressed ? 0.92 : 1,
          ...shadow,
          shadowColor: colors.accent,
          shadowOpacity: 0.3,
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              width: 60,
              height: 60,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.18)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {initial(user.name) ? (
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF' }}>{initial(user.name)}</Text>
            ) : (
              <Glyph icon="person" color="#FFFFFF" size={30} />
            )}
          </View>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={{ fontSize: fs(22), fontWeight: '800', letterSpacing: -0.3, color: '#FFFFFF' }}>
              {name || 'Add your name'}
            </Text>
            <Text style={{ fontSize: fs(14), color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
              {user.phone || 'Tap to add your details'}
            </Text>
          </View>
          <Glyph icon="chevron-forward" color="#FFFFFF" size={22} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 }}>
          {[lang.native, size.label + ' text'].map((t) => (
            <View
              key={t}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.18)',
                marginRight: 8,
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: fs(13), fontWeight: '700', color: '#FFFFFF' }}>{t}</Text>
            </View>
          ))}
        </View>
      </Pressable>

      <SectionTitle>Preferences</SectionTitle>
      <Group>
        <Row icon="globe-outline" title="Language" value={lang.native} onPress={() => setSheet('language')} />
        <Row icon="text-outline" title="Text size" value={size.label} onPress={() => setSheet('size')} last />
      </Group>

      <SectionTitle>How Saathi helps me</SectionTitle>
      <Group>
        <SwitchRow
          icon="eye-outline"
          tone="sage"
          title="Blind or low vision"
          description="Camera that reads text aloud"
          value={profile.needs.includes('blind')}
          onChange={() => toggleNeed('blind')}
        />
        <SwitchRow
          icon="ear-outline"
          tone="amber"
          title="Deaf or hard of hearing"
          description="Live captions of speech"
          value={profile.needs.includes('deaf')}
          onChange={() => toggleNeed('deaf')}
        />
        <SwitchRow
          icon="chatbubble-ellipses-outline"
          tone="accent"
          title="Difficulty speaking"
          description="Phrases and pictures that speak for me"
          value={profile.needs.includes('speech')}
          onChange={() => toggleNeed('speech')}
          last
        />
      </Group>

      <SectionTitle>Safety</SectionTitle>
      <Group>
        <Row icon="medkit-outline" tone="sos" title="Medical ID" onPress={() => setSheet('medical')} />
        <Row icon="people-outline" tone="sage" title="Emergency contacts" onPress={() => setSheet('contacts')} />
        <SwitchRow
          icon="phone-portrait-outline"
          tone="sos"
          title="Emergency card on lock screen"
          description="A helper can read your name, medical details and contacts without unlocking your phone"
          value={cardOn}
          onChange={toggleCard}
          last={!cardOn}
        />
        {cardOn ? (
          <SwitchRow
            icon="medkit-outline"
            tone="sage"
            title="Include health details"
            description="Blood group, allergies, conditions and medicines. Turn off to show only your name and contacts."
            value={cardHealth}
            onChange={toggleCardHealth}
            last
          />
        ) : null}
        <Row
          icon="shield-checkmark-outline"
          tone="amber"
          title="Phone emergency feature"
          onPress={() => setSheet('sos')}
          last
        />
      </Group>

      <SectionTitle>About</SectionTitle>
      <Group>
        <Row icon="lock-closed-outline" title="Privacy and about" onPress={() => setSheet('privacy')} last />
      </Group>

      <Group>
        <Row icon="trash-outline" title="Reset app data" danger onPress={confirmReset} last />
      </Group>

      <Text style={{ fontSize: fs(13), color: colors.muted, textAlign: 'center', marginTop: 4 }}>
        Saathi 1.0.0
      </Text>

      <ProfileScreen
        visible={profileOpen}
        onClose={() => {
          setProfileOpen(false);
          loadUser();
        }}
        onChanged={loadUser}
      />

      <SheetModal visible={sheet === 'language'} title="Language" onClose={() => setSheet(null)}>
        <Group>
          {LANGS.map((l, i) => (
            <ChoiceRow
              key={l.id}
              title={l.native}
              description={l.id === 'en' ? undefined : l.label}
              selected={profile.language === l.id}
              last={i === LANGS.length - 1}
              onPress={() => {
                update({ language: l.id });
                setSheet(null);
              }}
            />
          ))}
        </Group>
        <Text style={{ fontSize: fs(14), color: colors.muted, lineHeight: fs(21) }}>
          This sets your voice and captions language. The app will speak your language fully in a later step.
        </Text>
      </SheetModal>

      <SheetModal visible={sheet === 'size'} title="Text size" onClose={() => setSheet(null)}>
        <Group>
          {SIZES.map((s, i) => (
            <ChoiceRow
              key={s.id}
              title={s.label}
              description={s.description}
              selected={profile.textSize === s.id}
              last={i === SIZES.length - 1}
              onPress={() => update({ textSize: s.id })}
            />
          ))}
        </Group>
        <Card>
          <Text style={{ fontSize: fs(14), color: colors.muted }}>Preview</Text>
          <Text style={{ fontSize: fs(20), color: colors.text, lineHeight: fs(28), marginTop: 6 }}>
            This is how your text will look.
          </Text>
        </Card>
      </SheetModal>

      <SheetModal visible={sheet === 'medical'} title="Medical ID" onClose={() => setSheet(null)}>
        <Card>
          <MedicalIdEditor />
        </Card>
      </SheetModal>

      <SheetModal visible={sheet === 'contacts'} title="Emergency contacts" onClose={() => setSheet(null)}>
        <Card>
          <Contacts />
        </Card>
      </SheetModal>

      <SheetModal visible={sheet === 'sos'} title="Phone emergency feature" onClose={() => setSheet(null)}>
        <SosGuide />
      </SheetModal>

      <SheetModal visible={sheet === 'privacy'} title="Privacy and about" onClose={() => setSheet(null)}>
        <Card>
          <Text style={{ fontSize: fs(16), color: colors.text, lineHeight: fs(25) }}>
            Everything you enter stays on this phone. The only exception is the words you type to the
            assistant when you turn Online help on. Those are sent to a free AI service to get an answer.
            Your medicines, appointments, contacts and location are never sent.
          </Text>
        </Card>
        <Card style={{ backgroundColor: colors.accentSoft }}>
          <Text style={{ fontSize: fs(16), color: colors.text, lineHeight: fs(25) }}>
            Saathi is an assistive aid. It does not replace a cane, a guide or a doctor.
          </Text>
        </Card>
      </SheetModal>
    </ScrollView>
  );
}