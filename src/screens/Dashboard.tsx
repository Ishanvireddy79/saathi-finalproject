import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, shadow } from '../theme';
import { useProfile } from '../ProfileContext';
import {
  ActionRow,
  Avatar,
  Backdrop,
  BigButton,
  Card,
  Chip,
  Glyph,
  PillTabs,
  ProgressBar,
  RoundAction,
  SearchPill,
  SectionHeader,
  TOP_PAD,
} from '../ui';
import Reminders from './Reminders';
import CameraScreen from './CameraScreen';
import SpeakScreen from './SpeakScreen';
import CaptionsScreen from './CaptionsScreen';
import MedicalIdView from './MedicalId';
import SosScreen from './SosScreen';
import { Contact, loadContacts } from '../contacts';
import {
  Appointment,
  Medicine,
  apptTime,
  fmtDate,
  fmtTime,
  loadAppointments,
  loadMedicines,
} from '../reminders';

type HomeTab = 'help' | 'meds';
type Target = 'assistant' | 'learn' | 'settings';

function todayKey() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return 'saathi_taken_' + d.getFullYear() + '-' + mm + '-' + dd;
}

export default function Dashboard({ onNavigate }: { onNavigate?: (t: Target) => void }) {
  const { profile, fs } = useProfile();
  const { needs } = profile;
  const [tab, setTab] = useState<HomeTab>('help');
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [taken, setTaken] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [camOpen, setCamOpen] = useState(false);
  const [speakOpen, setSpeakOpen] = useState(false);
  const [capOpen, setCapOpen] = useState(false);
  const [medIdOpen, setMedIdOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [err, setErr] = useState('');

  const refresh = useCallback(() => {
    Promise.all([loadMedicines(), loadAppointments(), loadContacts(), AsyncStorage.getItem(todayKey())])
      .then(([m, a, c, t]) => {
        setMeds([...m].sort((x, y) => x.hour * 60 + x.minute - (y.hour * 60 + y.minute)));
        const now = Date.now();
        setAppts(
          a
            .filter((x) => apptTime(x) >= now)
            .sort((x, y) => apptTime(x) - apptTime(y))
            .slice(0, 4)
        );
        setContacts(c);
        try {
          setTaken(t ? (JSON.parse(t) as string[]) : []);
        } catch {
          setTaken([]);
        }
        setErr('');
      })
      .catch((e: any) => setErr('Could not load your data: ' + (e?.message ?? String(e))));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const closeReminders = () => {
    setOpen(false);
    refresh();
  };

  const toggleTaken = (id: string) => {
    const next = taken.includes(id) ? taken.filter((x) => x !== id) : [...taken, id];
    setTaken(next);
    AsyncStorage.setItem(todayKey(), JSON.stringify(next)).catch(() => {});
  };

  const callContact = (c: Contact) => {
    Linking.openURL('tel:' + c.phone).catch(() => setErr('Could not open the phone dialer.'));
  };

  const showAll = needs.length === 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const next = appts[0];
  const takenCount = meds.filter((m) => taken.includes(m.id)).length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: TOP_PAD, paddingBottom: 36 }}
    >
      <Backdrop />

      {/* Greeting row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <Avatar label="🙂" tone="accent" size={58} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ fontSize: fs(15), color: colors.muted }}>{greeting}</Text>
          <Text
            accessibilityRole="header"
            style={{ fontSize: fs(26), fontWeight: '800', letterSpacing: -0.4, color: colors.text }}
          >
            Hi, friend
          </Text>
        </View>
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="My schedule: medicines and appointments"
          style={({ pressed }) => ({
            width: 54,
            height: 54,
            borderRadius: 27,
            backgroundColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
            ...shadow,
          })}
        >
          <Glyph icon="notifications-outline" color={colors.accent} size={26} />
        </Pressable>
      </View>

      <SearchPill
        text="Ask Saathi anything..."
        label="Ask Saathi. Opens the assistant"
        onPress={() => onNavigate?.('assistant')}
      />

      <PillTabs
        label="Home sections"
        options={[
          { id: 'help' as HomeTab, label: 'Help me' },
          { id: 'meds' as HomeTab, label: 'Quick meds' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'help' ? (
        <View>
          <SectionHeader title="How can Saathi help you today?" action="Learn" onAction={() => onNavigate?.('learn')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 }}>
            {(showAll || needs.includes('speech')) && (
              <RoundAction icon="💬" tone="accent" label="Speak for me" onPress={() => setSpeakOpen(true)} />
            )}
            {(showAll || needs.includes('blind')) && (
              <RoundAction icon="👁️" tone="sage" label="Camera" onPress={() => setCamOpen(true)} />
            )}
            {(showAll || needs.includes('deaf')) && (
              <RoundAction icon="👂" tone="amber" label="Captions" onPress={() => setCapOpen(true)} />
            )}
            <RoundAction icon="🩺" tone="sos" label="Medical ID" onPress={() => setMedIdOpen(true)} />
          </View>

          <ActionRow
            solid
            icon="🆘"
            title="Emergency help"
            subtitle="Call 112 or message your contacts"
            onPress={() => setSosOpen(true)}
          />

          <SectionHeader title="Upcoming schedule" action="View all" onAction={() => setOpen(true)} />
          {next ? (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Avatar label="📅" tone="accent" size={60} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ fontSize: fs(19), fontWeight: '800', color: colors.text }}>{next.title}</Text>
                  <Text style={{ fontSize: fs(14), color: colors.muted, marginTop: 2 }}>Appointment</Text>
                </View>
                <Chip label="Next" tone="amber" />
              </View>
              <View style={{ flexDirection: 'row', marginTop: 14 }}>
                <Chip label={fmtDate(next)} tone="accent" />
                <View style={{ width: 8 }} />
                <Chip label={fmtTime(next.hour, next.minute)} tone="sage" />
              </View>
              <BigButton label="View detail" onPress={() => setOpen(true)} />
            </Card>
          ) : (
            <Card>
              <Text style={{ fontSize: fs(16), color: colors.muted, lineHeight: fs(24) }}>
                No appointments coming up. Tap View all to book one.
              </Text>
            </Card>
          )}

          <SectionHeader title="Your people" action="Manage" onAction={() => onNavigate?.('settings')} />
          {contacts.length === 0 ? (
            <Card>
              <Text style={{ fontSize: fs(16), color: colors.muted, lineHeight: fs(24) }}>
                Add people to call in an emergency. Tap Manage to add them.
              </Text>
            </Card>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -20 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
            >
              {contacts.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => callContact(c)}
                  accessibilityRole="button"
                  accessibilityLabel={'Call ' + c.name}
                  style={({ pressed }) => ({
                    width: 132,
                    marginRight: 12,
                    alignItems: 'center',
                    backgroundColor: colors.card,
                    borderRadius: 26,
                    paddingVertical: 18,
                    paddingHorizontal: 10,
                    opacity: pressed ? 0.9 : 1,
                    ...shadow,
                  })}
                >
                  <Avatar label={c.name.charAt(0).toUpperCase()} tone="sage" size={60} />
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: fs(16), fontWeight: '700', color: colors.text, marginTop: 10 }}
                  >
                    {c.name}
                  </Text>
                  <Text style={{ fontSize: fs(13), color: colors.sage, fontWeight: '700', marginTop: 2 }}>
                    📞 Call
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      ) : (
        <View>
          <SectionHeader title="Today's medicines" action="Edit" onAction={() => setOpen(true)} />
          <Card>
            <Text style={{ fontSize: fs(15), color: colors.muted }}>Taken today</Text>
            <Text style={{ fontSize: fs(28), fontWeight: '800', color: colors.text, marginVertical: 4 }}>
              {takenCount} of {meds.length}
            </Text>
            <ProgressBar value={takenCount} max={meds.length} tone="sage" />
          </Card>

          {meds.length === 0 ? (
            <Card>
              <Text style={{ fontSize: fs(16), color: colors.muted }}>No medicines yet. Tap Edit to add one.</Text>
            </Card>
          ) : (
            meds.map((m) => {
              const done = taken.includes(m.id);
              return (
                <Pressable
                  key={m.id}
                  onPress={() => toggleTaken(m.id)}
                  accessibilityRole="checkbox"
                  accessibilityLabel={
                    m.name + (m.dose ? ', ' + m.dose : '') + ', at ' + fmtTime(m.hour, m.minute) + '. Mark as taken'
                  }
                  accessibilityState={{ checked: done }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    minHeight: 84,
                    backgroundColor: colors.card,
                    borderRadius: 26,
                    padding: 16,
                    marginBottom: 12,
                    opacity: pressed ? 0.9 : 1,
                    ...shadow,
                  })}
                >
                  <Avatar label="💊" tone={done ? 'sage' : 'accent'} size={52} />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text
                      style={{
                        fontSize: fs(18),
                        fontWeight: '800',
                        color: colors.text,
                        textDecorationLine: done ? 'line-through' : 'none',
                      }}
                    >
                      {m.name}
                    </Text>
                    <Text style={{ fontSize: fs(14), color: colors.muted, marginTop: 2 }}>
                      {fmtTime(m.hour, m.minute) + (m.dose ? '  ·  ' + m.dose : '')}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      borderWidth: 2,
                      borderColor: done ? colors.sage : colors.border,
                      backgroundColor: done ? colors.sage : colors.card,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {done ? <Text style={{ color: colors.accentText, fontSize: 22 }}>✓</Text> : null}
                  </View>
                </Pressable>
              );
            })
          )}
          <BigButton label="Add or change medicines" variant="secondary" onPress={() => setOpen(true)} />
        </View>
      )}

      {err ? <Text style={{ fontSize: fs(15), color: colors.sos, marginTop: 12 }}>{err}</Text> : null}

      <Text
        style={{
          fontSize: fs(14),
          color: colors.muted,
          textAlign: 'center',
          lineHeight: fs(20),
          marginTop: 20,
        }}
      >
        Saathi is a helper. It does not replace a cane, a guide or a doctor.
      </Text>

      <Reminders visible={open} onClose={closeReminders} />
      <CameraScreen visible={camOpen} onClose={() => setCamOpen(false)} />
      <SpeakScreen visible={speakOpen} onClose={() => setSpeakOpen(false)} />
      <CaptionsScreen visible={capOpen} onClose={() => setCapOpen(false)} />
      <MedicalIdView visible={medIdOpen} onClose={() => setMedIdOpen(false)} />
      <SosScreen visible={sosOpen} onClose={() => setSosOpen(false)} />
    </ScrollView>
  );
}