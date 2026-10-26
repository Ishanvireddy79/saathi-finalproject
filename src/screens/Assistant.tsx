import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { colors, shadow } from '../theme';
import { useProfile } from '../ProfileContext';
import { Glyph, IconBadge, TOP_PAD } from '../ui';
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
      text: 'Hello, friend. I am Saathi. I can add your medicines and appointments, open the camera, and help in an emergency. You can type, or tap the microphone and speak. How can I help?',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [speakOn, setSpeakOn] = useState(true);
  const [online, setOnline] = useState(false);
  const [listening, setListening] = useState(false);
  const [micNote, setMicNote] = useState('');
  const [camOpen, setCamOpen] = useState(false);
  const [speakOpen, setSpeakOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);

  const lastHeard = useRef('');
  const sendRef = useRef<(t: string) => void>(() => {});

  useEffect(() => {
    isOnlineEnabled().then(setOnline);
    return () => {
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {
        // Nothing running.
      }
    };
  }, []);

  const nextId = () => 'm' + counter.current++;

  const add = (m: Omit<Msg, 'id'>) => setMsgs((cur) => [...cur, { id: nextId(), ...m }]);

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

  // Keep the latest send function available to the microphone callback.
  useEffect(() => {
    sendRef.current = send;
  });

  const speechLang =
    profile.language === 'hi' ? 'hi-IN' : profile.language === 'te' ? 'te-IN' : 'en-IN';

  const startMic = async () => {
    try {
      setMicNote('');
      try {
        Speech.stop();
      } catch {
        // Nothing to stop.
      }
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        setMicNote('The microphone permission was not given. Please allow it in your phone settings.');
        return;
      }
      const needsInternet = speechLang === 'te-IN';
      if (needsInternet && !online) {
        setMicNote(
          'Telugu voice needs the internet, because your phone has no offline Telugu pack. Turn on Online help, then try again. The sound goes to Google\'s speech service.'
        );
        return;
      }
      if (needsInternet) {
        setMicNote('Telugu voice is sent to Google\'s speech service.');
      }
      lastHeard.current = '';
      setInput('');
      setListening(true);
      ExpoSpeechRecognitionModule.start({
        lang: speechLang,
        interimResults: true,
        continuous: false,
        requiresOnDeviceRecognition: !needsInternet,
      });
    } catch (e: any) {
      setListening(false);
      setMicNote('Could not start the microphone: ' + (e?.message ?? String(e)));
    }
  };

  const stopMic = () => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      setListening(false);
    }
  };

  useSpeechRecognitionEvent('result', (event: any) => {
    const t = String(event?.results?.[0]?.transcript ?? '').trim();
    if (t) {
      lastHeard.current = t;
      setInput(t);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    const t = lastHeard.current.trim();
    lastHeard.current = '';
    if (t) sendRef.current(t);
  });

  useSpeechRecognitionEvent('error', (event: any) => {
    const code = String(event?.error ?? '');
    setListening(false);
    lastHeard.current = '';
    if (code === 'aborted') return;
    setInput('');
    if (code === 'no-speech' || code === 'speech-timeout') {
      setMicNote('I did not hear anything. Tap the microphone and try again.');
    } else if (code === 'language-not-supported' || code === 'network') {
      setMicNote(
        'The offline voice pack for this language is not ready. Open Captions and tap Download offline pack, or turn on Online help for Telugu.'
      );
    } else if (code === 'not-allowed' || code === 'service-not-allowed') {
      setMicNote('The microphone or speech permission is blocked. Please allow it in your phone settings.');
    } else if (code === 'audio-capture') {
      setMicNote('The microphone could not be used. Another app may be using it.');
    } else if (code === 'busy' || code === 'client') {
      setMicNote('The microphone is busy. Please try again in a moment.');
    } else {
      setMicNote('Voice input stopped: ' + code + (event?.message ? ' (' + event.message + ')' : ''));
    }
  });

  const openAction = (a: AgentAction) => {
    if (a === 'camera') setCamOpen(true);
    if (a === 'speak') setSpeakOpen(true);
    if (a === 'sos') setSosOpen(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: TOP_PAD,
          paddingBottom: 12,
        }}
      >
        <IconBadge icon="💬" tone="accent" size={48} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            accessibilityRole="header"
            style={{ fontSize: fs(26), fontWeight: '800', letterSpacing: -0.4, color: colors.text }}
          >
            Saathi
          </Text>
          <Text style={{ fontSize: fs(14), color: online ? colors.sage : colors.muted }}>
            {online ? 'Online help is on' : 'Offline mode. Works without internet'}
          </Text>
        </View>
        <Pressable
          onPress={toggleOnline}
          accessibilityRole="switch"
          accessibilityLabel="Online help"
          accessibilityState={{ checked: online }}
          style={{
            minHeight: 48,
            paddingHorizontal: 16,
            borderRadius: 24,
            justifyContent: 'center',
            backgroundColor: online ? colors.sage : colors.card,
            borderWidth: 1.5,
            borderColor: online ? colors.sage : colors.border,
          }}
        >
          <Text
            style={{
              fontSize: fs(15),
              fontWeight: '700',
              color: online ? colors.accentText : colors.text,
            }}
          >
            {online ? 'Online: ON' : 'Online: OFF'}
          </Text>
        </Pressable>
      </View>

      {/* Conversation */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {msgs.map((m) => {
          const mine = m.from === 'me';
          return (
            <View
              key={m.id}
              style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginBottom: 12 }}
            >
              <View
                style={{
                  maxWidth: '88%',
                  backgroundColor: mine ? colors.accent : colors.card,
                  borderRadius: 24,
                  borderBottomRightRadius: mine ? 6 : 24,
                  borderBottomLeftRadius: mine ? 24 : 6,
                  paddingHorizontal: 18,
                  paddingVertical: 14,
                  ...(mine ? {} : shadow),
                }}
              >
                <Text
                  selectable
                  style={{
                    fontSize: fs(18),
                    lineHeight: fs(26),
                    color: mine ? colors.accentText : colors.text,
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
                  style={({ pressed }) => ({
                    minHeight: 56,
                    marginTop: 8,
                    paddingHorizontal: 22,
                    borderRadius: 28,
                    justifyContent: 'center',
                    backgroundColor: m.action === 'sos' ? colors.sos : colors.sage,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ fontSize: fs(17), fontWeight: '700', color: '#FFFFFF' }}>
                    {ACTION_LABEL[m.action]}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
        {busy ? (
          <Text style={{ fontSize: fs(16), color: colors.muted, marginLeft: 6 }}>Thinking...</Text>
        ) : null}
      </ScrollView>

      {/* Suggestions */}
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
            style={({ pressed }) => ({
              minHeight: 48,
              marginHorizontal: 4,
              paddingHorizontal: 18,
              borderRadius: 24,
              justifyContent: 'center',
              backgroundColor: pressed ? colors.accentSoft : colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            })}
          >
            <Text style={{ fontSize: fs(15), fontWeight: '600', color: colors.accent }}>{s}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {micNote || listening ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{ fontSize: fs(15), color: colors.accent, paddingHorizontal: 20, paddingTop: 4 }}
        >
          {listening ? 'Listening... speak now. Tap the microphone again to stop.' : micNote}
        </Text>
      ) : null}

      {/* Composer */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 12,
          marginTop: 6,
          marginBottom: 6,
          padding: 6,
          backgroundColor: colors.card,
          borderRadius: 34,
          ...shadow,
        }}
      >
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
            minHeight: 56,
            paddingHorizontal: 16,
            fontSize: fs(19),
            color: colors.text,
          }}
        />
        <Pressable
          onPress={listening ? stopMic : startMic}
          accessibilityRole="button"
          accessibilityLabel={listening ? 'Stop listening' : 'Speak to Saathi'}
          accessibilityState={{ selected: listening }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: listening ? colors.sos : colors.sageSoft,
          }}
        >
          <Glyph icon={listening ? 'stop' : 'mic'} color={listening ? colors.sosText : colors.sage} size={26} />
        </Pressable>
        <Pressable
          onPress={() => send(input)}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          style={{
            width: 56,
            height: 56,
            marginLeft: 6,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.accent,
            opacity: busy ? 0.5 : 1,
          }}
        >
          <Glyph icon="arrow-up" color={colors.accentText} size={26} />
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
        style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 24 }}
      >
        <Text style={{ fontSize: fs(14), color: colors.muted }}>
          {speakOn ? '🔊 Replies are spoken aloud. Tap to turn off.' : '🔇 Replies are silent. Tap to turn on.'}
        </Text>
      </Pressable>

      <CameraScreen visible={camOpen} onClose={() => setCamOpen(false)} />
      <SpeakScreen visible={speakOpen} onClose={() => setSpeakOpen(false)} />
      <SosScreen visible={sosOpen} onClose={() => setSosOpen(false)} />
    </View>
  );
}