import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { colors } from '../theme';
import { useProfile } from '../ProfileContext';
import { BigButton, Body, Card, Title } from '../ui';
import Reminders from './Reminders';
import CameraScreen from './CameraScreen';
import {
  Appointment,
  Medicine,
  apptTime,
  fmtDate,
  fmtTime,
  loadAppointments,
  loadMedicines,
} from '../reminders';

export default function Dashboard() {
  const { profile, fs } = useProfile();
  const { needs } = profile;
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [open, setOpen] = useState(false);
  const [camOpen, setCamOpen] = useState(false);
  const [err, setErr] = useState('');

  const refresh = useCallback(() => {
    Promise.all([loadMedicines(), loadAppointments()])
      .then(([m, a]) => {
        setMeds([...m].sort((x, y) => x.hour * 60 + x.minute - (y.hour * 60 + y.minute)));
        const now = Date.now();
        setAppts(
          a
            .filter((x) => apptTime(x) >= now)
            .sort((x, y) => apptTime(x) - apptTime(y))
            .slice(0, 3)
        );
        setErr('');
      })
      .catch((e: any) => setErr('Could not load reminders: ' + (e?.message ?? String(e))));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const closeReminders = () => {
    setOpen(false);
    refresh();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: 56 }}
    >
      <Title>Hello, friend</Title>
      <Body muted>Here is your home.</Body>
      <Body>{' '}</Body>

      <Card>
        <Body>🆘 In an emergency, tap the red SOS button at the bottom.</Body>
      </Card>

      <Card>
        <Body>💊 Your medicines</Body>
        {meds.length === 0 ? (
          <Body muted>None yet.</Body>
        ) : (
          meds.map((m) => (
            <Body key={m.id} muted>
              {fmtTime(m.hour, m.minute) + '  ' + m.name + (m.dose ? ' (' + m.dose + ')' : '')}
            </Body>
          ))
        )}
        <Text style={{ height: 8 }} />
        <Body>📅 Next appointments</Body>
        {appts.length === 0 ? (
          <Body muted>None yet.</Body>
        ) : (
          appts.map((a) => (
            <Body key={a.id} muted>
              {fmtDate(a) + '  ' + fmtTime(a.hour, a.minute) + '  ' + a.title}
            </Body>
          ))
        )}
        {err ? (
          <Text style={{ fontSize: fs(16), color: colors.sos, marginTop: 8 }}>{err}</Text>
        ) : null}
        <BigButton label="Add or change" onPress={() => setOpen(true)} />
      </Card>

      {needs.includes('blind') && (
        <Card>
          <Body>👁️ See around me and read text.</Body>
          <Body muted>Works without internet. Camera test for now. Reading and describing come next.</Body>
          <BigButton label="Open camera" onPress={() => setCamOpen(true)} />
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

      <Card style={{ backgroundColor: colors.sageSoft }}>
        <Body>Saathi is a helper. It does not replace a cane, a guide or a doctor.</Body>
      </Card>

      <Reminders visible={open} onClose={closeReminders} />
      <CameraScreen visible={camOpen} onClose={() => setCamOpen(false)} />
    </ScrollView>
  );
}