import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';
import { useProfile } from '../ProfileContext';
import {
  Avatar,
  BigButton,
  Card,
  Chip,
  Group,
  IconBadge,
  Row,
  SectionTitle,
  SheetModal,
  TOP_PAD,
  TopBar,
} from '../ui';
import { Contact, loadContacts } from '../contacts';
import { Need } from '../storage';
import {
  EMPTY_USER,
  UserProfile,
  initial,
  loadUserProfile,
  saveUserProfile,
} from '../userProfile';
import Contacts from './Contacts';
import { MedicalIdEditor } from './MedicalId';

const LANG_NAME: Record<string, string> = { en: 'English', hi: 'हिन्दी', te: 'తెలుగు' };
const SIZE_NAME: Record<string, string> = { normal: 'Normal text', large: 'Large text', xlarge: 'Extra large text' };
const NEED_NAME: Record<Need, string> = {
  blind: 'Blind or low vision',
  deaf: 'Deaf or hard of hearing',
  speech: 'Difficulty speaking',
};

type FieldKey = keyof UserProfile;

const FIELDS: { key: FieldKey; label: string; icon: string; hint: string; keyboard?: 'phone-pad' | 'email-address' }[] = [
  { key: 'name', label: 'Full name', icon: 'person-outline', hint: 'Your name' },
  { key: 'phone', label: 'Phone number', icon: 'call-outline', hint: 'Your phone number', keyboard: 'phone-pad' },
  { key: 'email', label: 'Email', icon: 'mail-outline', hint: 'Your email (optional)', keyboard: 'email-address' },
  { key: 'address', label: 'Address', icon: 'home-outline', hint: 'Your home address (optional)' },
];

function InfoRow({
  icon,
  label,
  value,
  last,
  fs,
}: {
  icon: string;
  label: string;
  value: string;
  last?: boolean;
  fs: (n: number) => number;
}) {
  return (
    <View
      accessible
      accessibilityLabel={label + ': ' + (value || 'not added')}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        minHeight: 72,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.track,
      }}
    >
      <IconBadge icon={icon} tone="accent" size={42} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ fontSize: fs(13), color: colors.muted, fontWeight: '600' }}>{label}</Text>
        <Text
          selectable
          style={{
            fontSize: fs(18),
            marginTop: 2,
            color: value ? colors.text : colors.muted,
            fontWeight: value ? '600' : '400',
          }}
        >
          {value || 'Not added'}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen({
  visible,
  onClose,
  onChanged,
}: {
  visible: boolean;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const { profile, fs } = useProfile();
  const [user, setUser] = useState<UserProfile>(EMPTY_USER);
  const [draft, setDraft] = useState<UserProfile>(EMPTY_USER);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState('');
  const [sheet, setSheet] = useState<'medical' | 'contacts' | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (!visible) return;
    Promise.all([loadUserProfile(), loadContacts()])
      .then(([u, c]) => {
        setUser(u);
        setContacts(c);
      })
      .catch((e: any) => setStatus('Could not load: ' + (e?.message ?? String(e))));
  }, [visible]);

  const goBack = () => {
    if (sheet) {
      setSheet(null);
    } else if (editing) {
      setEditing(false);
      setStatus('');
    } else {
      onClose();
    }
  };

  const startEdit = () => {
    setDraft(user);
    setEditing(true);
    setStatus('');
  };

  const save = async () => {
    const d: UserProfile = {
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      address: draft.address.trim(),
    };
    if (d.phone && d.phone.replace(/\D/g, '').length < 6) {
      setStatus('Please enter a full phone number, or leave it empty.');
      return;
    }
    if (d.email && !/^\S+@\S+\.\S+$/.test(d.email)) {
      setStatus('That email does not look right. Please check it, or leave it empty.');
      return;
    }
    try {
      await saveUserProfile(d);
      setUser(d);
      setEditing(false);
      setStatus('Saved on this phone.');
      onChanged?.();
    } catch (e: any) {
      setStatus('Could not save: ' + (e?.message ?? String(e)));
    }
  };

  const statusLine = status ? (
    <Text accessibilityLiveRegion="polite" style={{ fontSize: fs(16), color: colors.accent, marginBottom: 12 }}>
      {status}
    </Text>
  ) : null;

  const inputStyle = {
    minHeight: 60,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    fontSize: fs(18),
    color: colors.text,
    marginBottom: 12,
  } as const;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={goBack}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingTop: TOP_PAD, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          <TopBar title={editing ? 'Edit profile' : 'My profile'} onBack={goBack} />

          {editing ? (
            <View>
              {FIELDS.map((f) => (
                <View key={f.key}>
                  <Text style={{ fontSize: fs(14), fontWeight: '700', color: colors.muted, marginBottom: 6 }}>
                    {f.label}
                  </Text>
                  <TextInput
                    value={draft[f.key]}
                    onChangeText={(v) => setDraft((cur) => ({ ...cur, [f.key]: v }))}
                    placeholder={f.hint}
                    placeholderTextColor={colors.muted}
                    keyboardType={f.keyboard}
                    autoCapitalize={f.key === 'email' ? 'none' : 'words'}
                    accessibilityLabel={f.label}
                    style={inputStyle}
                  />
                </View>
              ))}
              {statusLine}
              <BigButton label="Save changes" onPress={save} />
              <BigButton
                label="Cancel"
                onPress={() => {
                  setEditing(false);
                  setStatus('');
                }}
              />
            </View>
          ) : (
            <View>
              <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
                <Avatar label={initial(user.name) || '🙂'} tone="accent" size={96} />
                <Text
                  accessibilityRole="header"
                  selectable
                  style={{
                    fontSize: fs(26),
                    fontWeight: '800',
                    letterSpacing: -0.4,
                    color: colors.text,
                    marginTop: 14,
                    textAlign: 'center',
                  }}
                >
                  {user.name || 'Add your name'}
                </Text>
                {user.phone ? (
                  <Text selectable style={{ fontSize: fs(17), color: colors.muted, marginTop: 4 }}>
                    {user.phone}
                  </Text>
                ) : null}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 14 }}>
                  <View style={{ marginRight: 8, marginBottom: 6 }}>
                    <Chip label={LANG_NAME[profile.language] ?? 'English'} tone="accent" />
                  </View>
                  <View style={{ marginBottom: 6 }}>
                    <Chip label={SIZE_NAME[profile.textSize] ?? 'Normal text'} tone="sage" />
                  </View>
                </View>
              </Card>

              {statusLine}
              <BigButton label="Edit profile" onPress={startEdit} />

              <SectionTitle>My details</SectionTitle>
              <Group>
                {FIELDS.map((f, i) => (
                  <InfoRow
                    key={f.key}
                    fs={fs}
                    icon={f.icon}
                    label={f.label}
                    value={user[f.key]}
                    last={i === FIELDS.length - 1}
                  />
                ))}
              </Group>

              <SectionTitle>How Saathi helps me</SectionTitle>
              <Card>
                {profile.needs.length === 0 ? (
                  <Text style={{ fontSize: fs(16), color: colors.muted }}>
                    No choices yet. You can pick them in Settings.
                  </Text>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {profile.needs.map((n) => (
                      <View key={n} style={{ marginRight: 8, marginBottom: 8 }}>
                        <Chip label={NEED_NAME[n]} tone="sage" />
                      </View>
                    ))}
                  </View>
                )}
              </Card>

              <SectionTitle>Safety and privacy</SectionTitle>
              <Group>
                <Row icon="medkit-outline" tone="sos" title="Medical ID" onPress={() => setSheet('medical')} />
                <Row
                  icon="people-outline"
                  tone="sage"
                  title="Emergency contacts"
                  value={contacts.length === 0 ? 'None' : String(contacts.length)}
                  onPress={() => setSheet('contacts')}
                  last
                />
              </Group>
              <Text style={{ fontSize: fs(13), color: colors.muted, lineHeight: fs(20) }}>
                Everything here stays on this phone. You can show an emergency card on your lock screen from
                Settings.
              </Text>
            </View>
          )}
        </ScrollView>

        <SheetModal visible={sheet === 'medical'} title="Medical ID" onClose={() => setSheet(null)}>
          <Card>
            <MedicalIdEditor />
          </Card>
        </SheetModal>
        <SheetModal
          visible={sheet === 'contacts'}
          title="Emergency contacts"
          onClose={() => {
            setSheet(null);
            loadContacts().then(setContacts).catch(() => {});
          }}
        >
          <Card>
            <Contacts />
          </Card>
        </SheetModal>
      </View>
    </Modal>
  );
}