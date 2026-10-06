import {
  Appointment,
  Medicine,
  apptTime,
  fmtDate,
  fmtTime,
  loadAppointments,
  loadMedicines,
  parseDate,
  saveAppointments,
  saveMedicines,
  scheduleAppointment,
  scheduleMedicine,
  setupNotifications,
} from './reminders';

export type AgentAction = 'camera' | 'speak' | 'sos';
export type AgentReply = { text: string; action?: AgentAction; needsOnline?: boolean };

export const SUGGESTIONS = [
  'What can you do?',
  'Remind me to take tablet at 8 pm',
  'My medicines',
  'My appointments',
  'Read text',
  'First aid for a burn',
  'Emergency',
];

type Clock = { hour: number; minute: number };

function removeSpan(input: string, matched: string): string {
  if (!matched) return input;
  const idx = input.toLowerCase().indexOf(matched.toLowerCase());
  if (idx < 0) return input;
  return input.slice(0, idx) + ' ' + input.slice(idx + matched.length);
}

function findClock(input: string): { clock: Clock | 'ask' | null; matched: string } {
  const lower = input.toLowerCase();
  const noDate = lower.replace(/\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4}\b/g, ' ');
  let m = noDate.match(/\bat\s+(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/);
  if (!m) m = noDate.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)/);
  if (!m) return { clock: null, matched: '' };

  const h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3] ? (m[3].startsWith('p') ? 'pm' : 'am') : '';
  if (min > 59) return { clock: null, matched: m[0] };

  if (ap) {
    if (h < 1 || h > 12) return { clock: null, matched: m[0] };
    return { clock: { hour: (h % 12) + (ap === 'pm' ? 12 : 0), minute: min }, matched: m[0] };
  }
  if (h > 23) return { clock: null, matched: m[0] };
  if (h >= 13 || h === 0) return { clock: { hour: h, minute: min }, matched: m[0] };
  if (/morning/.test(lower)) return { clock: { hour: h % 12, minute: min }, matched: m[0] };
  if (/(afternoon|evening|night)/.test(lower)) {
    const hour = /night/.test(lower) && h === 12 ? 0 : (h % 12) + 12;
    return { clock: { hour, minute: min }, matched: m[0] };
  }
  return { clock: 'ask', matched: m[0] };
}

function ymd(d: Date) {
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

function findDate(input: string): {
  date: { year: number; month: number; day: number } | null;
  matched: string;
  invalid: boolean;
} {
  const lower = input.toLowerCase();
  const m = lower.match(/\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4})\b/);
  if (m) {
    const d = parseDate(m[1]);
    return { date: d, matched: m[1], invalid: !d };
  }
  if (/\btomorrow\b/.test(lower)) {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return { date: ymd(t), matched: 'tomorrow', invalid: false };
  }
  if (/\btoday\b/.test(lower)) {
    return { date: ymd(new Date()), matched: 'today', invalid: false };
  }
  return { date: null, matched: '', invalid: false };
}

function tidy(s: string): string {
  const t = s
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.\-:]+|[\s,.\-:]+$/g, '')
    .replace(/\b(on|at|for|every day|everyday|daily|each day)\s*$/i, '')
    .replace(/^[\s,.\-:]+|[\s,.\-:]+$/g, '');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const LEAD_VERB =
  /^(please\s+)?(remind me( about| of| to)?|add|set|save|schedule|book|make)\s+(an?\s+|the\s+|my\s+)?(new\s+)?(reminder\s+)?(to\s+)?/i;

function medicineName(input: string, timeMatched: string): string {
  let s = removeSpan(input, timeMatched);
  s = s.replace(LEAD_VERB, '');
  s = s.replace(/^(take\s+|medicine\s+|medication\s+)/i, '');
  s = s.replace(/\b(every day|everyday|daily|each day)\b/gi, '');
  return tidy(s);
}

async function addMedicine(name: string, c: Clock): Promise<string> {
  try {
    const problem = await setupNotifications();
    if (problem) return problem;
    const notifId = await scheduleMedicine(name, '', c.hour, c.minute);
    const list = await loadMedicines();
    const item: Medicine = {
      id: String(Date.now()),
      name,
      dose: '',
      hour: c.hour,
      minute: c.minute,
      notifId,
    };
    await saveMedicines([...list, item]);
    return (
      'Done. I will remind you to take ' +
      name +
      ' every day at ' +
      fmtTime(c.hour, c.minute) +
      '. You can change it on the Home page.'
    );
  } catch (e: any) {
    return 'Sorry, I could not save that. ' + (e?.message ?? String(e));
  }
}

async function addAppointment(
  input: string,
  date: { year: number; month: number; day: number },
  dateMatched: string,
  c: Clock,
  timeMatched: string
): Promise<string> {
  try {
    let s = removeSpan(input, timeMatched);
    s = removeSpan(s, dateMatched);
    s = s.replace(LEAD_VERB, '');
    s = s.replace(/\b(i have|i've got)\b/gi, '');
    let title = tidy(s);
    if (title.length < 3) title = 'Appointment';

    const problem = await setupNotifications();
    if (problem) return problem;
    const notifId = await scheduleAppointment({ title, ...date, hour: c.hour, minute: c.minute });
    const list = await loadAppointments();
    const item: Appointment = {
      id: String(Date.now()),
      title,
      ...date,
      hour: c.hour,
      minute: c.minute,
      notifId,
    };
    await saveAppointments([...list, item]);
    return (
      'Done. I saved "' +
      title +
      '" for ' +
      fmtDate(item) +
      ' at ' +
      fmtTime(c.hour, c.minute) +
      '. I will remind you one hour before.'
    );
  } catch (e: any) {
    return 'Sorry, I could not save that. ' + (e?.message ?? String(e));
  }
}

const FIRST_AID: Record<string, string> = {
  bleeding:
    'For bleeding: press firmly on the wound with a clean cloth. Keep pressing. Do not lift it to look. If the bleeding is heavy or does not stop, call 112 now. This is general first aid. It does not replace a doctor.',
  burn:
    'For a burn: cool it with clean running water for 20 minutes. Do not use ice, butter or toothpaste. For a large or deep burn, or a burn on the face, call 112. This is general first aid. It does not replace a doctor.',
  choking:
    'If someone is choking and can cough, tell them to keep coughing. If they cannot breathe, cough or speak, call 112 right now. If you are trained, give 5 back blows, then 5 belly thrusts, and repeat until help comes. This is general first aid. It does not replace a doctor.',
};

const CAPABILITIES =
  'I can help you without internet. Try these. Say "remind me to take tablet at 8 pm". Say "appointment eye doctor on 25/12/2026 at 3:30 pm". Ask "my medicines" or "my appointments". Say "read text" for the camera, or "speak for me". Say "emergency" for help. I cannot give medical advice.';

export async function respond(input: string): Promise<AgentReply> {
  try {
    return await respondInner(input);
  } catch (e: any) {
    return { text: 'Sorry, something went wrong. ' + (e?.message ?? String(e)) };
  }
}

async function respondInner(input: string): Promise<AgentReply> {
  const text = input.trim();
  const lower = text.toLowerCase();

  // 1. Emergency always comes first.
  if (
    /\b(emergency|sos|ambulance|police|in danger|heart attack|can'?t breathe)\b/.test(lower) ||
    /^(please\s+)?help( me)?[.!?\s]*$/.test(lower)
  ) {
    return {
      text: 'If you are in danger, call 112 now. Tap the button below. It opens the emergency help screen.',
      action: 'sos',
    };
  }
    // 1b. Medical advice questions are always refused, before anything else.
    const MEDICAL_ADVICE =
    /(medicine|medication|tablet|pill|drug|syrup|ointment|cream)s?\s+(for|to cure|to treat)\b|\b(should|can|could|may) i (take|use|have|eat)\b|\bwhat (should|can) i (take|do|use)\b|\bdosage\b|\bdose\b|diagnos|\bwhat do i have\b|\bwhat('?s| is) wrong with me\b|\bis it serious\b/;
  if (MEDICAL_ADVICE.test(lower) && !/(remind|add|set|save|schedule)/.test(lower)) {
    return {
      text: 'I cannot give medical advice or say what is wrong. Please ask a doctor or a pharmacist. If it is an emergency, call 112.',
    };
  }

  // 2. Adding an appointment.
  if (/(appointment|check-?up|doctor visit|hospital visit)/.test(lower)) {
    const d = findDate(text);
    const t = findClock(text);
    const addVerb = /(remind|add|set|save|book|schedule|have)/.test(lower);
    const asking = /\b(show|list|what|which|next|any|when|do i have)\b/.test(lower);
    if ((addVerb && !asking) || d.date || d.invalid) {
      if (d.invalid) {
        return { text: 'That date does not look right. Please use a day, month and year like 25/12/2026.' };
      }
      if (!d.date) return { text: 'What date? For example, say "tomorrow" or "25/12/2026".' };
      if (t.clock === 'ask') return { text: 'Is that AM or PM? Please say the time again, for example "3:30 pm".' };
      if (!t.clock) return { text: 'What time? For example, "at 3:30 pm".' };
      return { text: await addAppointment(text, d.date, d.matched, t.clock, t.matched) };
    }
  }

  // 3. Adding a medicine.
  const wantsMed =
    /(medicine|medication|tablet|pill|capsule|syrup|inhaler|drops|\btake\b)/.test(lower) &&
    /(remind|add|set|save|schedule)/.test(lower);
  if (wantsMed) {
    const t = findClock(text);
    if (t.clock === 'ask') return { text: 'Is that AM or PM? Please say it again, for example "at 8 pm".' };
    if (!t.clock) return { text: 'What time? For example, "remind me to take tablet at 8 pm".' };
    const name = medicineName(text, t.matched);
    if (name.length < 2) {
      return { text: 'What is the medicine called? For example, "remind me to take paracetamol at 8 pm".' };
    }
    return { text: await addMedicine(name, t.clock) };
  }

  // 4. Lists.
  if (/(appointments?)/.test(lower) && /(my|show|list|what|which|next|any)/.test(lower)) {
    const all = await loadAppointments();
    const now = Date.now();
    const next = all
      .filter((a) => apptTime(a) >= now)
      .sort((a, b) => apptTime(a) - apptTime(b))
      .slice(0, 5);
    if (next.length === 0) return { text: 'You have no appointments coming up.' };
    return {
      text:
        'Your next appointments. ' +
        next.map((a) => a.title + ' on ' + fmtDate(a) + ' at ' + fmtTime(a.hour, a.minute)).join('. ') +
        '.',
    };
  }
  if (/(medicines?|tablets?|pills?)/.test(lower) && /(my|show|list|what|which|when)/.test(lower)) {
    const all = await loadMedicines();
    if (all.length === 0) return { text: 'You have no medicine reminders yet.' };
    const sorted = [...all].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
    return {
      text:
        'Your medicine reminders. ' +
        sorted.map((m) => fmtTime(m.hour, m.minute) + ', ' + m.name).join('. ') +
        '.',
    };
  }

  // 5. Features.
  if (/(read (the )?text|read this|around me|what do you see|describe|camera|look around)/.test(lower)) {
    return {
      text: 'Okay. Tap the button below to open the camera. Take a photo, then choose Read text or What is around me.',
      action: 'camera',
    };
  }
  if (/(speak for me|type to speak|say something for me|talk for me|quick phrase|phrases)/.test(lower)) {
    return {
      text: 'Okay. Tap the button below. You can type, tap a phrase, or tap a picture, and your phone will say it aloud.',
      action: 'speak',
    };
  }
  if (/(caption|subtitle|sound alert|doorbell)/.test(lower)) {
    return { text: 'Live captions and sound alerts are coming in a later update. They are not ready yet.' };
  }

  // 6. Time and date work offline from the phone clock.
  if (/what('?s| is) the time|what time is it|time now/.test(lower)) {
    const d = new Date();
    return { text: 'It is ' + fmtTime(d.getHours(), d.getMinutes()) + '.' };
  }
  if (/what('?s| is) (the )?(date|day)|today'?s date|what day is it/.test(lower)) {
    return {
      text:
        'Today is ' +
        new Date().toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }) +
        '.',
    };
  }

  // 7. First aid.
  if (/\b(bleed|bleeding|blood)\b/.test(lower)) return { text: FIRST_AID.bleeding, action: 'sos' };
  if (/\bburn(s|t|ed)?\b/.test(lower)) return { text: FIRST_AID.burn, action: 'sos' };
  if (/\bchok(e|es|ed|ing)\b/.test(lower)) return { text: FIRST_AID.choking, action: 'sos' };
  if (/first aid/.test(lower)) {
    return { text: 'I have short first aid notes for bleeding, burns and choking. Ask, for example, "first aid for a burn".' };
  }

  // 8. No medical advice.
  if (
    /(diagnos|what medicine|which medicine|which tablet|should i take|do i have|is it serious|dosage|\bdose\b|symptom|fever|headache|\bpain\b|infection)/.test(
      lower
    )
  ) {
    return {
      text: 'I cannot give medical advice or say what is wrong. Please ask a doctor or a pharmacist. If it is an emergency, call 112.',
    };
  }

  // 9. Needs internet.
  if (/(weather|news|score|price|who is|capital of|translate|search|google|youtube)/.test(lower)) {
    return {
      text: 'I can only answer that with the internet. Turn on Online help at the top of this page, then ask me again.',
      needsOnline: true,
    };
  }

  // 10. Small talk.
  if (/^(hi|hello|hey|namaste|namaskaram|good (morning|afternoon|evening))\b/.test(lower)) {
    return { text: 'Hello, friend. How can I help you today?' };
  }
  if (/(thank|thanks)/.test(lower)) return { text: 'You are welcome. I am here if you need me.' };
  if (/(what can you do|who are you|^help\b|how do i use)/.test(lower)) return { text: CAPABILITIES };

  return {
    text: 'I did not understand that. I work with simple phrases right now. ' + CAPABILITIES,
    needsOnline: true,
  };
}