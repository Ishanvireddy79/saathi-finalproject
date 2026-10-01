import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';
import { useProfile } from '../ProfileContext';
import { BigButton, Body, Card, Option, Title } from '../ui';
import {
  Appointment,
  Medicine,
  cancelReminder,
  fmtDate,
  fmtTime,
  loadAppointments,
  loadMedicines,
  parseDate,
  parseTime,
  saveAppointments,
  saveMedicines,
  scheduleAppointment,
  scheduleMedicine,
  scheduleTest,
  setupNotifications,
} from '../reminders';

function to12(hour: number, minute: number) {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const mm = minute < 10 ? '0' + minute : String(minute);
  return { text: h12 + ':' + mm, pm: hour >= 12 };
}

export default function Reminders({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { fs } = useProfile();
  const scrollRef = useRef<ScrollView>(null);
  const medY = useRef(0);
  const apptY = useRef(0);

  const [meds, setMeds] = useState<Medicine[]>([]);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [status, setStatus] = useState('');

  const [editMedId, setEditMedId] = useState<string | null>(null);
  const [mName, setMName] = useState('');
  const [mDose, setMDose] = useState('');
  const [mTime, setMTime] = useState('');
  const [mPm, setMPm] = useState(false);

  const [editApptId, setEditApptId] = useState<string | null>(null);
  const [aTitle, setATitle] = useState('');
  const [aDate, setADate] = useState('');
  const [aTime, setATime] = useState('');
  const [aPm, setAPm] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setStatus('');
    Promise.all([loadMedicines(), loadAppointments()])
      .then(([m, a]) => {
        setMeds(m);
        setAppts(a);
      })
      .catch((e: any) => setStatus('Could not load: ' + (e?.message ?? String(e))));
  }, [visible]);

  const inputStyle = {
    minHeight: 64,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    fontSize: fs(19),
    color: colors.text,
    marginBottom: 10,
  } as const;

  const clearMedForm = () => {
    setEditMedId(null);
    setMName('');
    setMDose('');
    setMTime('');
    setMPm(false);
  };

  const clearApptForm = () => {
    setEditApptId(null);
    setATitle('');
    setADate('');
    setATime('');
    setAPm(true);
  };

  const startEditMed = (m: Medicine) => {
    const t = to12(m.hour, m.minute);
    setEditMedId(m.id);
    setMName(m.name);
    setMDose(m.dose);
    setMTime(t.text);
    setMPm(t.pm);
    setStatus('Editing ' + m.name + '. Change it below and tap Save changes.');
    scrollRef.current?.scrollTo({ y: medY.current, animated: true });
  };

  const startEditAppt = (a: Appointment) => {
    const t = to12(a.hour, a.minute);
    const dd = a.day < 10 ? '0' + a.day : String(a.day);
    const mo = a.month < 10 ? '0' + a.month : String(a.month);
    setEditApptId(a.id);
    setATitle(a.title);
    setADate(dd + '/' + mo + '/' + a.year);
    setATime(t.text);
    setAPm(t.pm);
    setStatus('Editing ' + a.title + '. Change it below and tap Save changes.');
    scrollRef.current?.scrollTo({ y: apptY.current, animated: true });
  };

  const saveMedicine = async () => {
    try {
      const name = mName.trim();
      const t = parseTime(mTime, mPm);
      if (!name) return setStatus('Please enter the medicine name.');
      if (!t) return setStatus('Please enter the time like 8:30, between 1:00 and 12:59.');
      const problem = await setupNotifications();
      if (problem) return setStatus(problem);
      const notifId = await scheduleMedicine(name, mDose.trim(), t.hour, t.minute);
      let next: Medicine[];
      if (editMedId) {
        const old = meds.find((x) => x.id === editMedId);
        if (old) await cancelReminder(old.notifId);
        next = meds.map((x) =>
          x.id === editMedId
            ? { id: x.id, name, dose: mDose.trim(), hour: t.hour, minute: t.minute, notifId }
            : x
        );
      } else {
        next = [
          ...meds,
          { id: String(Date.now()), name, dose: mDose.trim(), hour: t.hour, minute: t.minute, notifId },
        ];
      }
      setMeds(next);
      await saveMedicines(next);
      clearMedForm();
      setStatus('Saved. Saathi will remind you every day at ' + fmtTime(t.hour, t.minute) + '.');
    } catch (e: any) {
      setStatus('Could not save medicine: ' + (e?.message ?? String(e)));
    }
  };

  const removeMedicine = async (m: Medicine) => {
    try {
      await cancelReminder(m.notifId);
      const next = meds.filter((x) => x.id !== m.id);
      setMeds(next);
      await saveMedicines(next);
      if (editMedId === m.id) clearMedForm();
      setStatus('');
    } catch (e: any) {
      setStatus('Could not remove: ' + (e?.message ?? String(e)));
    }
  };

  const saveAppointment = async () => {
    try {
      const title = aTitle.trim();
      const d = parseDate(aDate);
      const t = parseTime(aTime, aPm);
      if (!title) return setStatus('Please enter what the appointment is for.');
      if (!d) return setStatus('Please enter the date like 25/12/2026.');
      if (!t) return setStatus('Please enter the time like 3:30, between 1:00 and 12:59.');
      const problem = await setupNotifications();
      if (problem) return setStatus(problem);
      const notifId = await scheduleAppointment({ title, ...d, hour: t.hour, minute: t.minute });
      let next: Appointment[];
      if (editApptId) {
        const old = appts.find((x) => x.id === editApptId);
        if (old) await cancelReminder(old.notifId);
        next = appts.map((x) =>
          x.id === editApptId
            ? { id: x.id, title, ...d, hour: t.hour, minute: t.minute, notifId }
            : x
        );
      } else {
        next = [...appts, { id: String(Date.now()), title, ...d, hour: t.hour, minute: t.minute, notifId }];
      }
      setAppts(next);
      await saveAppointments(next);
      clearApptForm();
      setStatus('Saved. Saathi will remind you one hour before.');
    } catch (e: any) {
      setStatus('Could not save appointment: ' + (e?.message ?? String(e)));
    }
  };

  const removeAppointment = async (a: Appointment) => {
    try {
      await cancelReminder(a.notifId);
      const next = appts.filter((x) => x.id !== a.id);
      setAppts(next);
      await saveAppointments(next);
      if (editApptId === a.id) clearApptForm();
      setStatus('');
    } catch (e: any) {
      setStatus('Could not remove: ' + (e?.message ?? String(e)));
    }
  };

  const runTest = async () => {
    try {
      const problem = await setupNotifications();
      if (problem) return setStatus(problem);
      await scheduleTest();
      setStatus('Test reminder set. Lock your phone and wait 10 seconds.');
    } catch (e: any) {
      setStatus('Could not set test: ' + (e?.message ?? String(e)));
    }
  };

  const LinkButton = ({
    label,
    text,
    color,
    onPress,
  }: {
    label: string;
    text: string;
    color: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ minHeight: 64, justifyContent: 'center' }}
    >
      <Text style={{ fontSize: fs(18), color, fontWeight: 'bold' }}>{text}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 240 }}
        keyboardShouldPersistTaps="handled"
      >
        <Title>Medicines and appointments</Title>
        <Body muted>Saathi only reminds you of what you enter. It does not give medical advice.</Body>

        {status ? (
          <Text
            accessibilityLiveRegion="polite"
            style={{ fontSize: fs(18), color: colors.accent, marginTop: 12 }}
          >
            {status}
          </Text>
        ) : null}

        <Text style={{ height: 20 }} />
        <Body>Medicines (every day)</Body>
        <Text style={{ height: 8 }} />
        {meds.length === 0 && <Body muted>No medicines yet.</Body>}
        {meds.map((m) => (
          <Card key={m.id}>
            <Body>{m.name}</Body>
            <Body muted>{(m.dose ? m.dose + ' · ' : '') + fmtTime(m.hour, m.minute)}</Body>
            <LinkButton
              label={'Edit ' + m.name}
              text="Edit"
              color={colors.accent}
              onPress={() => startEditMed(m)}
            />
            <LinkButton
              label={'Remove ' + m.name}
              text="Remove"
              color={colors.sos}
              onPress={() => removeMedicine(m)}
            />
          </Card>
        ))}

        <View onLayout={(e) => (medY.current = e.nativeEvent.layout.y)}>
          <Body>{editMedId ? 'Edit medicine' : 'Add a medicine'}</Body>
          <Text style={{ height: 8 }} />
          <TextInput
            value={mName}
            onChangeText={setMName}
            placeholder="Medicine name"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Medicine name"
            style={inputStyle}
          />
          <TextInput
            value={mDose}
            onChangeText={setMDose}
            placeholder="Dose, for example 1 tablet (optional)"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Dose, optional"
            style={inputStyle}
          />
          <TextInput
            value={mTime}
            onChangeText={setMTime}
            placeholder="Time, for example 8:30"
            placeholderTextColor={colors.muted}
            keyboardType="numbers-and-punctuation"
            accessibilityLabel="Medicine time"
            style={inputStyle}
          />
          <Option label="AM (morning)" selected={!mPm} onPress={() => setMPm(false)} />
          <Option label="PM (afternoon or night)" selected={mPm} onPress={() => setMPm(true)} />
          <BigButton label={editMedId ? 'Save changes' : 'Add medicine'} onPress={saveMedicine} />
          {editMedId ? (
            <LinkButton
              label="Cancel editing"
              text="Cancel editing"
              color={colors.muted}
              onPress={() => {
                clearMedForm();
                setStatus('');
              }}
            />
          ) : null}
        </View>

        <Text style={{ height: 28 }} />
        <Body>Appointments</Body>
        <Text style={{ height: 8 }} />
        {appts.length === 0 && <Body muted>No appointments yet.</Body>}
        {appts.map((a) => (
          <Card key={a.id}>
            <Body>{a.title}</Body>
            <Body muted>{fmtDate(a) + ' · ' + fmtTime(a.hour, a.minute)}</Body>
            <LinkButton
              label={'Edit ' + a.title}
              text="Edit"
              color={colors.accent}
              onPress={() => startEditAppt(a)}
            />
            <LinkButton
              label={'Remove ' + a.title}
              text="Remove"
              color={colors.sos}
              onPress={() => removeAppointment(a)}
            />
          </Card>
        ))}

        <View onLayout={(e) => (apptY.current = e.nativeEvent.layout.y)}>
          <Body>{editApptId ? 'Edit appointment' : 'Add an appointment'}</Body>
          <Text style={{ height: 8 }} />
          <TextInput
            value={aTitle}
            onChangeText={setATitle}
            placeholder="What is it for, for example Eye doctor"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Appointment title"
            style={inputStyle}
          />
          <TextInput
            value={aDate}
            onChangeText={setADate}
            placeholder="Date, for example 25/12/2026"
            placeholderTextColor={colors.muted}
            keyboardType="numbers-and-punctuation"
            accessibilityLabel="Appointment date"
            style={inputStyle}
          />
          <TextInput
            value={aTime}
            onChangeText={setATime}
            placeholder="Time, for example 3:30"
            placeholderTextColor={colors.muted}
            keyboardType="numbers-and-punctuation"
            accessibilityLabel="Appointment time"
            style={inputStyle}
          />
          <Option label="AM (morning)" selected={!aPm} onPress={() => setAPm(false)} />
          <Option label="PM (afternoon or night)" selected={aPm} onPress={() => setAPm(true)} />
          <BigButton
            label={editApptId ? 'Save changes' : 'Add appointment'}
            onPress={saveAppointment}
          />
          {editApptId ? (
            <LinkButton
              label="Cancel editing"
              text="Cancel editing"
              color={colors.muted}
              onPress={() => {
                clearApptForm();
                setStatus('');
              }}
            />
          ) : null}
        </View>

        <Text style={{ height: 28 }} />
        <Body>Check that reminders work</Body>
        <Body muted>Sets a reminder for 10 seconds from now. Lock your phone and wait.</Body>
        <BigButton label="Test reminder in 10 seconds" onPress={runTest} />

        <Text style={{ height: 20 }} />
        <BigButton label="Close" onPress={onClose} />
      </ScrollView>
    </Modal>
  );
}