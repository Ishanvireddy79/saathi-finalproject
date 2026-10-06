import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as Speech from 'expo-speech';
import { colors } from '../theme';
import { useProfile } from '../ProfileContext';
import { Title } from '../ui';
import { AgentAction, SUGGESTIONS, respond } from '../agent';
import { askOnline, isOnlineEnabled, setOnlineEnabled } from '../online';
import { voiceLanguage } from '../phrases';
import { hasVoiceFor, installHelp } from '../voices';
import CameraScreen from './CameraScreen';
import SpeakScreen from './SpeakScreen';
import SosScreen from './SosScreen';

type Msg = {
  id: string;
  from: 'me' | 'saathi';
  text: string;
  action?: AgentAction;
  online?: boolean;
};

const ACTION_LABEL: Record<AgentAction, string> = {
  camera: 'Open camera',
  speak: 'Open Speak for me',
  sos: 'Open emergency help',
};

const ONLINE_NOTICE =
  'Online help is on. The words you type here are sent to a free AI service so I can answer more questions. Your medicines, appointments, contacts and location are never sent. The answers can be wrong, so please check anything important.';

export default function Assistant() {
  const { fs, profile } = useProfile();
  const scrollRef = useRef<ScrollView>(null);
  const counter = useRef(1);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: 'm0',
      from: 'saathi',
      text: 'Hello, friend. I am Saathi. I can add your medicines and appointments, open the camera, and help in an emergency. How can I help?',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [speakOn, setSpeakOn] = useState(true);
  const [online, setOnline] = useState(false);
  const [camOpen, setCamOpen] = useState(false);
  const [speakOpen, setSpeakOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);

  useEffect(() => {
    isOnlineEnabled().then(setOnline);
  }, []);

  const nextId = () => 'm' + counter.current++;

  const add = (m: Omit<Msg, 'id'>) =>
    setMsgs((cur) => [...cur, { id: nextId(), ...m }]);

  const speak = async (t: string) => {
    try {
      Speech.stop();
      const lang = voiceLanguage(t);
      if (lang !== 'en-IN' && !(await hasVoiceFor(lang))) {
        add({ from: 'saathi', text: installHelp(lang) });
      }
      Speech.speak(t, { language: lang, rate: 0.9 });
    } catch {
      // Speaking is optional. The text is still on screen.
    }
  };

  const toggleOnline = async () => {
    const next = !online;
    setOnline(next);
    try {
      await setOnlineEnabled(next);
    } catch {
      // Not saving is fine. It just resets next time.
    }
    if (next) add({ from: 'saathi', text: ONLINE_NOTICE });
  };

  const send = async (raw: string) => {
    const t = raw.trim();
    if (!t || busy) return;
    try {
      Speech.stop();
    } catch {
      // Nothing to stop.
    }
    setInput('');
    add({ from: 'me', text: t });
    setBusy(true);
    try {
      const r = await respond(t);
      let text = r.text;
      let action = r.action;
      let wasOnline = false;

      if (r.needsOnline && online) {
        try {
          const history = [
            ...msgs.map((m) => ({
              role: m.from === 'me' ? ('user' as const) : ('assistant' as const),
              content: m.text,
            })),
            { role: 'user' as const, content: t },
          ].slice(-8);
          text = await askOnline(history, profile.language);
          action = undefined;
          wasOnline = true;
        } catch (e: any) {
          text =
            'I could not reach online help. ' +
            (e?.message ?? String(e)) +
            ' I can still help with reminders, the camera and emergencies.';
          action = undefined;
        }
      }

      add({ from: 'saathi', text, action, online: wasOnline });
      if (speakOn) speak(text);
    } finally {
      setBusy(false);
    }
  };

  const openAction = (a: AgentAction) => {
    if (a === 'camera') setCamOpen(true);
    if (a === 'speak') setSpeakOpen(true);
    if (a === 'sos') setSosOpen(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: 56 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Title>Assistant</Title>
        <Text style={{ fontSize: fs(15), color: colors.sage, marginTop: -6, marginBottom: 6 }}>
          {online
            ? 'Online help is on. Offline features still work.'
            : 'Offline mode. Works without internet.'}
        </Text>
        <Pressable
          onPress={toggleOnline}
          accessibilityRole="switch"
          accessibilityLabel="Online help"
          accessibilityState={{ checked: online }}
          style={{
            minHeight: 64,
            borderRadius: 16,
            justifyContent: 'center',
            paddingHorizontal: 16,
            marginBottom: 6,
            backgroundColor: online ? colors.sage : colors.card,
            borderWidth: 1.5,
            borderColor: online ? colors.sage : colors.border,
          }}
        >
          <Text
            style={{
              fontSize: fs(17),
              fontWeight: 'bold',
              color: online ? colors.accentText : colors.text,
            }}
          >
            {online ? 'Online help: ON. Tap to turn off.' : 'Online help: OFF. Tap to turn on.'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {msgs.map((m) => (
          <View
            key={m.id}
            style={{ alignItems: m.from === 'me' ? 'flex-end' : 'flex-start', marginBottom: 10 }}
          >
            <View
              style={{
                maxWidth: '88%',
                backgroundColor: m.from === 'me' ? colors.accent : colors.card,
                borderColor: colors.border,
                borderWidth: m.from === 'me' ? 0 : 1,
                borderRadius: 18,
                padding: 14,
              }}
            >
              <Text
                selectable
                style={{
                  fontSize: fs(18),
                  lineHeight: fs(26),
                  color: m.from === 'me' ? colors.accentText : colors.text,
                }}
              >
                {m.text}
              </Text>
              {m.online ? (
                <Text style={{ fontSize: fs(13), color: colors.muted, marginTop: 6 }}>
                  Online answer. It can contain mistakes.
                </Text>
              ) : null}
            </View>
            {m.action ? (
              <Pressable
                onPress={() => openAction(m.action as AgentAction)}
                accessibilityRole="button"
                accessibilityLabel={ACTION_LABEL[m.action]}
                style={{
                  minHeight: 64,
                  marginTop: 6,
                  paddingHorizontal: 20,
                  borderRadius: 16,
                  justifyContent: 'center',
                  backgroundColor: m.action === 'sos' ? colors.sos : colors.sage,
                }}
              >
                <Text style={{ fontSize: fs(18), fontWeight: 'bold', color: '#FFFFFF' }}>
                  {ACTION_LABEL[m.action]}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ))}
        {busy ? (
          <Text style={{ fontSize: fs(16), color: colors.muted, marginLeft: 6 }}>Thinking...</Text>
        ) : null}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 6 }}
        keyboardShouldPersistTaps="handled"
      >
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s}
            onPress={() => send(s)}
            accessibilityRole="button"
            accessibilityLabel={s}
            style={{
              minHeight: 64,
              marginHorizontal: 4,
              paddingHorizontal: 16,
              borderRadius: 16,
              justifyContent: 'center',
              backgroundColor: colors.sageSoft,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: fs(16), color: colors.text }}>{s}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8 }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send(input)}
          placeholder="Type to Saathi"
          placeholderTextColor={colors.muted}
          returnKeyType="send"
          accessibilityLabel="Type your message"
          style={{
            flex: 1,
            minHeight: 64,
            borderWidth: 1.5,
            borderColor: colors.border,
            borderRadius: 16,
            backgroundColor: colors.card,
            paddingHorizontal: 16,
            fontSize: fs(19),
            color: colors.text,
          }}
        />
        <Pressable
          onPress={() => send(input)}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          style={{
            minHeight: 64,
            minWidth: 84,
            marginLeft: 8,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.accent,
            opacity: busy ? 0.5 : 1,
          }}
        >
          <Text style={{ fontSize: fs(18), fontWeight: 'bold', color: colors.accentText }}>Send</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => {
          if (speakOn) {
            try {
              Speech.stop();
            } catch {
              // Nothing to stop.
            }
          }
          setSpeakOn(!speakOn);
        }}
        accessibilityRole="switch"
        accessibilityLabel="Speak replies aloud"
        accessibilityState={{ checked: speakOn }}
        style={{ minHeight: 64, justifyContent: 'center', paddingHorizontal: 20 }}
      >
        <Text style={{ fontSize: fs(16), color: colors.muted }}>
          {speakOn ? 'Replies are spoken aloud. Tap to turn off.' : 'Replies are silent. Tap to turn on.'}
        </Text>
      </Pressable>

      <CameraScreen visible={camOpen} onClose={() => setCamOpen(false)} />
      <SpeakScreen visible={speakOpen} onClose={() => setSpeakOpen(false)} />
      <SosScreen visible={sosOpen} onClose={() => setSosOpen(false)} />
    </View>
  );
}