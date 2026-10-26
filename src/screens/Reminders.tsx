import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { colors, shadow } from '../theme';
import { useProfile } from '../ProfileContext';
import {
  Avatar,
  BigButton,
  BottomCTA,
  Card,
  Chip,
  DateStrip,
  IconBadge,
  PillTabs,
  SectionHeader,
  Segmented,
  TOP_PAD,
  TimeChips,
  TopBar,
  TypeCard,
} from '../ui';
import {
  Appointment,
  Medicine,
  apptTime,
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

type ViewName = 'list' | 'detail' | 'form';
type Kind = 'appt' | 'med';
type Period = 'morning' | 'afternoon' | 'evening';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
];

// Hour (1 to 12) and AM or PM for each time button.
const SLOTS: Record<Period, { h: number; pm: boolean }[]> = {
  morning: [
    { h: 6, pm: false },
    { h: 7, pm: false },
    { h: 8, pm: false },
    { h: 9, pm: false },
    { h: 10, pm: false },
    { h: 11, pm: false },
  ],
  afternoon: [
    { h: 12, pm: true },
    { h: 1, pm: true },
    { h: 2, pm: true },
    { h: 3, pm: true },
    { h: 4, pm: true },
  ],
  evening: [
    { h: 5, pm: true },
    { h: 6, pm: true },
    { h: 7, pm: true },
    { h: 8, pm: true },
    { h: 9, pm: true },
    { h: 10, pm: true },
  ],
};

const TYPES = [
  { id: 'doctor', icon: '🩺', title: 'Doctor visit', subtitle: 'Check-up or consultation' },
  { id: 'test', icon: '🧪', title: 'Test or scan', subtitle: 'Blood test, X-ray or similar' },
  { id: 'other', icon: '📌', title: 'Something else', subtitle: 'Any other plan' },
];

function to12(hour: number, minute: number) {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const mm = minute < 10 ? '0' + minute : String(minute);
  return { text: h12 + ':' + mm, pm: hour >= 12 };
}

function buildDays(count: number) {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const out: { key: string; dow: string; num: number }[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    out.push({ key: dd + '/' + mm + '/' + d.getFullYear(), dow: names[d.getDay()], num: d.getDate() });
  }
  return out;
}

function slotKey(text: string, pm: boolean) {
  return text + (pm ? ' PM' : ' AM');
}

function LinkButton({
  label,
  text,
  color,
  onPress,
  size,
}: {
  label: string;
  text: string;
  color: string;
  onPress: () => void;
  size: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ minHeight: 52, paddingRight: 18, justifyContent: 'center' }}
    >
      <Text style={{ fontSize: size, color, fontWeight: '700' }}>{text}</Text>
    </Pressable>
  );
}

export default function Reminders({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { fs } = useProfile();
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [status, setStatus] = useState('');

  const [view, setView] = useState<ViewName>('list');
  const [kind, setKind] = useState<Kind>('appt');
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [period, setPeriod] = useState<Period>('morning');

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
  const [aType, setAType] = useState('');

  useEffect(() => {
    if (!visible) return;
    Promise.all([loadMedicines(), loadAppointments()])
      .then(([m, a]) => {
        setMeds(m);
        setAppts(a);
      })
      .catch((e: any) => setStatus('Could not load: ' + (e?.message ?? String(e))));
  }, [visible]);

  const inputStyle = {
    minHeight: 60,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    fontSize: fs(18),
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
    setAType('');
  };

  const closeAll = () => {
    clearMedForm();
    clearApptForm();
    setView('list');
    setDetail(null);
    setStatus('');
    onClose();
  };

  const goBack = () => {
    if (view === 'form') {
      const back = editApptId && detail ? 'detail' : 'list';
      clearMedForm();
      clearApptForm();
      setStatus('');
      setView(back);
    } else if (view === 'detail') {
      setDetail(null);
      setStatus('');
      setView('list');
    } else {
      closeAll();
    }
  };

  const startNew = (k: Kind) => {
    clearMedForm();
    clearApptForm();
    setStatus('');
    setKind(k);
    setPeriod(k === 'med' ? 'morning' : 'morning');
    setView('form');
  };

  const startEditMed = (m: Medicine) => {
    const t = to12(m.hour, m.minute);
    clearApptForm();
    setKind('med');
    setEditMedId(m.id);
    setMName(m.name);
    setMDose(m.dose);
    setMTime(t.text);
    setMPm(t.pm);
    setStatus('');
    setView('form');
  };

  const startEditAppt = (a: Appointment) => {
    const t = to12(a.hour, a.minute);
    const dd = a.day < 10 ? '0' + a.day : String(a.day);
    const mo = a.month < 10 ? '0' + a.month : String(a.month);
    clearMedForm();
    setKind('appt');
    setEditApptId(a.id);
    setATitle(a.title);
    setADate(dd + '/' + mo + '/' + a.year);
    setATime(t.text);
    setAPm(t.pm);
    setStatus('');
    setView('form');
  };

  const pickSlot = (h: number, pm: boolean) => {
    if (kind === 'med') {
      setMTime(h + ':00');
      setMPm(pm);
    } else {
      setATime(h + ':00');
      setAPm(pm);
    }
  };

  const pickType = (id: string) => {
    setAType(id);
    const t = TYPES.find((x) => x.id === id);
    const known = TYPES.some((x) => x.title === aTitle.trim());
    if (t && (!aTitle.trim() || known)) setATitle(t.title);
  };

  const saveMedicine = async () => {
    try {
      const name = mName.trim();
      const t = parseTime(mTime, mPm);
      if (!name) return setStatus('Please enter the medicine name.');
      if (!t) return setStatus('Please choose a time, or type it like 8:30.');
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
      setView('list');
      setKind('med');
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
      if (!title) return setStatus('Please say what the appointment is for.');
      if (!d) return setStatus('Please choose a day.');
      if (!t) return setStatus('Please choose a time, or type it like 3:30.');
      const problem = await setupNotifications();
      if (problem) return setStatus(problem);
      const notifId = await scheduleAppointment({ title, ...d, hour: t.hour, minute: t.minute });
      let next: Appointment[];
      let savedId = String(Date.now());
      if (editApptId) {
        savedId = editApptId;
        const old = appts.find((x) => x.id === editApptId);
        if (old) await cancelReminder(old.notifId);
        next = appts.map((x) =>
          x.id === editApptId
            ? { id: x.id, title, ...d, hour: t.hour, minute: t.minute, notifId }
            : x
        );
      } else {
        next = [...appts, { id: savedId, title, ...d, hour: t.hour, minute: t.minute, notifId }];
      }
      setAppts(next);
      await saveAppointments(next);
      const saved = next.find((x) => x.id === savedId) ?? null;
      const wasEditing = !!editApptId;
      clearApptForm();
      setKind('appt');
      if (wasEditing && saved) {
        setDetail(saved);
        setView('detail');
      } else {
        setDetail(null);
        setView('list');
      }
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
      setDetail(null);
      setView('list');
      setStatus('Appointment removed.');
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

  const statusLine = status ? (
    <Text accessibilityLiveRegion="polite" style={{ fontSize: fs(17), color: colors.accent, marginVertical: 8 }}>
      {status}
    </Text>
  ) : null;

  const sortedAppts = [...appts].sort((x, y) => apptTime(x) - apptTime(y));
  const sortedMeds = [...meds].sort((x, y) => x.hour * 60 + x.minute - (y.hour * 60 + y.minute));
  const days = buildDays(14);
  const parsedDate = parseDate(aDate);
  const monthLabel = (parsedDate ? new Date(parsedDate.year, parsedDate.month - 1, parsedDate.day) : new Date())
    .toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const curTime = kind === 'med' ? mTime : aTime;
  const curPm = kind === 'med' ? mPm : aPm;
  const slotItems = SLOTS[period].map((s) => ({
    key: slotKey(s.h + ':00', s.pm),
    label: s.h + ':00 ' + (s.pm ? 'PM' : 'AM'),
  }));

  /* ---------- Views ---------- */

  const listView = (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingTop: TOP_PAD, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <TopBar title="My schedule" onBack={closeAll} />
        <PillTabs
          label="Schedule type"
          options={[
            { id: 'appt' as Kind, label: 'Appointments' },
            { id: 'med' as Kind, label: 'Medicines' },
          ]}
          value={kind}
          onChange={setKind}
        />
        {statusLine}

        {kind === 'appt' ? (
          <View>
            <SectionHeader title="Appointments" />
            {sortedAppts.length === 0 ? (
              <Card>
                <Text style={{ fontSize: fs(16), color: colors.muted }}>No appointments yet.</Text>
              </Card>
            ) : (
              sortedAppts.map((a) => {
                const upcoming = apptTime(a) >= Date.now();
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => {
                      setDetail(a);
                      setStatus('');
                      setView('detail');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={a.title + ', ' + fmtDate(a) + ' at ' + fmtTime(a.hour, a.minute) + '. Open details'}
                    style={({ pressed }) => ({
                      backgroundColor: colors.card,
                      borderRadius: 26,
                      padding: 16,
                      marginBottom: 12,
                      opacity: pressed ? 0.9 : 1,
                      ...shadow,
                    })}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Avatar label="📅" tone={upcoming ? 'accent' : 'sage'} size={56} />
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={{ fontSize: fs(18), fontWeight: '800', color: colors.text }}>{a.title}</Text>
                        <Text style={{ fontSize: fs(14), color: colors.muted, marginTop: 2 }}>
                          {fmtDate(a) + '  ' + fmtTime(a.hour, a.minute)}
                        </Text>
                      </View>
                      <Chip label={upcoming ? 'Upcoming' : 'Past'} tone={upcoming ? 'amber' : 'sage'} />
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        ) : (
          <View>
            <SectionHeader title="Medicines every day" />
            {sortedMeds.length === 0 ? (
              <Card>
                <Text style={{ fontSize: fs(16), color: colors.muted }}>No medicines yet.</Text>
              </Card>
            ) : (
              sortedMeds.map((m) => (
                <Card key={m.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <IconBadge icon="💊" tone="accent" />
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={{ fontSize: fs(18), fontWeight: '800', color: colors.text }}>{m.name}</Text>
                      {m.dose ? (
                        <Text style={{ fontSize: fs(14), color: colors.muted, marginTop: 2 }}>{m.dose}</Text>
                      ) : null}
                    </View>
                    <Chip label={fmtTime(m.hour, m.minute)} tone="sage" />
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    <LinkButton
                      label={'Edit ' + m.name}
                      text="Edit"
                      color={colors.accent}
                      size={fs(17)}
                      onPress={() => startEditMed(m)}
                    />
                    <LinkButton
                      label={'Remove ' + m.name}
                      text="Remove"
                      color={colors.sos}
                      size={fs(17)}
                      onPress={() => removeMedicine(m)}
                    />
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        <Card style={{ marginTop: 12 }}>
          <Text style={{ fontSize: fs(17), fontWeight: '700', color: colors.text }}>Check that reminders work</Text>
          <Text style={{ fontSize: fs(14), color: colors.muted, marginTop: 4, lineHeight: fs(20) }}>
            Sets a reminder for 10 seconds from now. Lock your phone and wait.
          </Text>
          <BigButton label="Test reminder in 10 seconds" variant="secondary" onPress={runTest} />
        </Card>
        <Text style={{ fontSize: fs(14), color: colors.muted, lineHeight: fs(20) }}>
          Saathi only reminds you of what you enter. It does not give medical advice.
        </Text>
      </ScrollView>
      <BottomCTA
        label={kind === 'appt' ? 'Book an appointment' : 'Add a medicine'}
        onPress={() => startNew(kind)}
      />
    </>
  );

  const detailView = detail ? (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingTop: TOP_PAD, paddingBottom: 24 }}
      >
        <TopBar title="Details" onBack={goBack} />
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          <Avatar label="📅" tone="accent" size={92} />
          <Text
            accessibilityRole="header"
            style={{
              fontSize: fs(26),
              fontWeight: '800',
              letterSpacing: -0.4,
              color: colors.text,
              marginTop: 14,
              textAlign: 'center',
            }}
          >
            {detail.title}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            <Chip label={fmtDate(detail)} tone="accent" />
            <View style={{ width: 8 }} />
            <Chip label={fmtTime(detail.hour, detail.minute)} tone="sage" />
          </View>
        </Card>

        <SectionHeader title="About" />
        <Card>
          <Text style={{ fontSize: fs(17), color: colors.text, lineHeight: fs(26) }}>
            Saathi will remind you one hour before this appointment, so you have time to get ready.
          </Text>
        </Card>

        <SectionHeader title="When" />
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <IconBadge icon="📆" tone="accent" size={44} />
            <Text style={{ fontSize: fs(18), color: colors.text, marginLeft: 12, flex: 1 }}>{fmtDate(detail)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconBadge icon="⏰" tone="sage" size={44} />
            <Text style={{ fontSize: fs(18), color: colors.text, marginLeft: 12, flex: 1 }}>
              {fmtTime(detail.hour, detail.minute)}
            </Text>
          </View>
        </Card>
        {statusLine}
        <BigButton label="Remove appointment" variant="danger" onPress={() => removeAppointment(detail)} />
      </ScrollView>
      <BottomCTA label="Edit appointment" onPress={() => startEditAppt(detail)} />
    </>
  ) : null;

  const formView = (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingTop: TOP_PAD, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <TopBar
          title={
            kind === 'appt'
              ? editApptId
                ? 'Edit appointment'
                : 'Book appointment'
              : editMedId
              ? 'Edit medicine'
              : 'Add medicine'
          }
          onBack={goBack}
        />

        {kind === 'appt' ? (
          <View>
            <SectionHeader title="Appointment type" />
            {TYPES.map((t) => (
              <TypeCard
                key={t.id}
                icon={t.icon}
                title={t.title}
                subtitle={t.subtitle}
                selected={aType === t.id}
                onPress={() => pickType(t.id)}
              />
            ))}
            <TextInput
              value={aTitle}
              onChangeText={setATitle}
              placeholder="What is it for, for example Eye doctor"
              placeholderTextColor={colors.muted}
              accessibilityLabel="Appointment title"
              style={inputStyle}
            />

            <SectionHeader title={monthLabel} />
            <DateStrip days={days} selected={aDate} onSelect={setADate} />
            <Text style={{ fontSize: fs(14), color: colors.muted, marginTop: 6, marginBottom: 8 }}>
              {parsedDate ? 'Chosen day: ' + aDate : 'Choose a day above.'}
            </Text>
          </View>
        ) : (
          <View>
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
            <Text style={{ fontSize: fs(14), color: colors.muted, marginBottom: 8 }}>
              Saathi reminds you every day at the time you choose.
            </Text>
          </View>
        )}

        <SectionHeader title="Available time" />
        <PillTabs label="Part of the day" options={PERIODS} value={period} onChange={setPeriod} />
        <TimeChips
          slots={slotItems}
          selected={slotKey(curTime, curPm)}
          onSelect={(k) => {
            const found = SLOTS[period].find((s) => slotKey(s.h + ':00', s.pm) === k);
            if (found) pickSlot(found.h, found.pm);
          }}
        />

        <Text style={{ fontSize: fs(15), fontWeight: '700', color: colors.text, marginTop: 6, marginBottom: 8 }}>
          Or type another time
        </Text>
        <TextInput
          value={curTime}
          onChangeText={kind === 'med' ? setMTime : setATime}
          placeholder="For example 3:30"
          placeholderTextColor={colors.muted}
          keyboardType="numbers-and-punctuation"
          accessibilityLabel="Time"
          style={inputStyle}
        />
        <Segmented
          label="AM or PM"
          options={[
            { id: 'am', label: 'AM (morning)' },
            { id: 'pm', label: 'PM (afternoon, night)' },
          ]}
          value={curPm ? 'pm' : 'am'}
          onChange={(v) => (kind === 'med' ? setMPm(v === 'pm') : setAPm(v === 'pm'))}
        />
        {statusLine}
      </ScrollView>
      <BottomCTA
        label={
          kind === 'appt'
            ? editApptId
              ? 'Save changes'
              : 'Schedule an appointment'
            : editMedId
            ? 'Save changes'
            : 'Add medicine'
        }
        onPress={kind === 'appt' ? saveAppointment : saveMedicine}
      />
    </>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={goBack}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {view === 'list' ? listView : view === 'detail' ? detailView : formView}
      </View>
    </Modal>
  );
}