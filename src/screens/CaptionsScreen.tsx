import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { colors, shadow } from '../theme';
import { useProfile } from '../ProfileContext';
import { ErrorBoundary } from '../ErrorBoundary';
import {
  BigButton,
  Chip,
  Glyph,
  Group,
  IconBadge,
  Segmented,
  SheetModal,
  SwitchRow,
  TOP_PAD,
  TopBar,
} from '../ui';

const LANGS = [
  { id: 'en-IN', label: 'English' },
  { id: 'hi-IN', label: 'हिन्दी' },
  { id: 'te-IN', label: 'తెలుగు' },
];

function RoundButton({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: 64,
        height: 64,
        marginLeft: 10,
        marginTop: 10,
        borderRadius: 22,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
        ...shadow,
      })}
    >
      <Glyph icon={icon} color={colors.accent} size={26} />
    </Pressable>
  );
}

function Inner({ onClose }: { onClose: () => void }) {
  const { fs, profile } = useProfile();
  const [lang, setLang] = useState(
    profile.language === 'hi' ? 'hi-IN' : profile.language === 'te' ? 'te-IN' : 'en-IN'
  );
  const [lines, setLines] = useState<string[]>([]);
  const [interim, setInterim] = useState('');
  const [listening, setListening] = useState(false);
  const [allowOnline, setAllowOnline] = useState(false);
  const [big, setBig] = useState(true);
  const [status, setStatus] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const wantRef = useRef(false);
  const langRef = useRef(lang);
  const onlineRef = useRef(allowOnline);
  useEffect(() => {
    langRef.current = lang;
    onlineRef.current = allowOnline;
  });

  const langName = LANGS.find((l) => l.id === lang)?.label ?? lang;

  const begin = () => {
    try {
      ExpoSpeechRecognitionModule.start({
        lang: langRef.current,
        interimResults: true,
        continuous: true,
        requiresOnDeviceRecognition: !onlineRef.current,
        addsPunctuation: true,
      });
    } catch (e: any) {
      wantRef.current = false;
      setListening(false);
      setStatus('Could not start captions: ' + (e?.message ?? String(e)));
    }
  };

  const startListening = async () => {
    try {
      setStatus('');
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        setStatus('The microphone permission was not given. Please allow it in your phone settings.');
        return;
      }
      if (!onlineRef.current) {
        let ok = true;
        try {
          ok = ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
        } catch {
          ok = true;
        }
        if (!ok) {
          setStatus(
            'Your phone cannot make captions offline. If you are happy for the sound to be sent to Google, open More options and turn on "Allow online captions".'
          );
          return;
        }
      }
      wantRef.current = true;
      setListening(true);
      begin();
    } catch (e: any) {
      wantRef.current = false;
      setListening(false);
      setStatus('Could not start captions: ' + (e?.message ?? String(e)));
    }
  };

  const stopListening = () => {
    wantRef.current = false;
    setListening(false);
    setInterim('');
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // Already stopped.
    }
  };

  useEffect(() => {
    return () => {
      wantRef.current = false;
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {
        // Nothing running.
      }
    };
  }, []);

  useSpeechRecognitionEvent('result', (event: any) => {
    const t = String(event?.results?.[0]?.transcript ?? '').trim();
    if (event?.isFinal) {
      if (t) setLines((cur) => [...cur, t].slice(-40));
      setInterim('');
    } else {
      setInterim(t);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setInterim('');
    if (wantRef.current) {
      setTimeout(() => {
        if (wantRef.current) begin();
      }, 300);
    }
  });

  useSpeechRecognitionEvent('error', (event: any) => {
    const code = String(event?.error ?? '');
    if (code === 'no-speech' || code === 'speech-timeout' || code === 'aborted') return;
    if (code === 'busy' || code === 'client') return;
    wantRef.current = false;
    setListening(false);
    setInterim('');
    if (code === 'language-not-supported') {
      setStatus(
        langName +
          ' is not ready for offline captions on this phone. Open More options and tap "Download offline pack". If that fails with error 12, your phone does not offer ' +
          langName +
          ' offline, so turn on "Allow online captions" to use it.'
      );
    } else if (code === 'network') {
      setStatus(
        'Captions need the internet, or the offline pack. Open More options and tap "Download offline pack" while online, then try again.'
      );
    } else if (code === 'not-allowed' || code === 'service-not-allowed') {
      setStatus('The microphone or speech permission is blocked. Please allow it in your phone settings.');
    } else if (code === 'audio-capture') {
      setStatus('The microphone could not be used. Another app may be using it.');
    } else {
      setStatus('Captions stopped: ' + code + (event?.message ? ' (' + event.message + ')' : ''));
    }
  });

  const downloadPack = async () => {
    try {
      setStatus('Asking your phone to get the ' + langName + ' offline pack. Please stay online...');
      const r: any = await (ExpoSpeechRecognitionModule as any).androidTriggerOfflineModelDownload({
        locale: lang,
      });
      setStatus(
        'The phone answered: ' +
          String(r?.status ?? 'done') +
          '. If a download started, wait for it to finish, then tap Start captions.'
      );
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.includes('12')) {
        setStatus(
          'Your phone does not offer an offline ' +
            langName +
            ' pack (error 12). ' +
            langName +
            ' captions need the internet. If you are happy for the sound to be sent to Google, turn on "Allow online captions".'
        );
      } else {
        setStatus('Could not start the download: ' + msg);
      }
    }
  };

  const textSize = big ? fs(32) : fs(22);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, paddingTop: TOP_PAD, paddingBottom: 20 }}>
      <TopBar
        title="Live captions"
        onBack={() => {
          stopListening();
          onClose();
        }}
      />

      <Segmented
        label="Captions language"
        options={LANGS}
        value={lang}
        onChange={(v) => {
          if (listening) stopListening();
          setLang(v);
          setStatus('');
        }}
      />

      {/* Caption area */}
      <View
        style={{
          flex: 1,
          marginTop: 14,
          backgroundColor: colors.card,
          borderRadius: 28,
          overflow: 'hidden',
          ...shadow,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 14 }}>
          <Chip label={listening ? 'Listening' : 'Ready'} tone={listening ? 'sos' : 'sage'} />
          <Text style={{ fontSize: fs(13), color: colors.muted, marginLeft: 10 }}>{langName}</Text>
        </View>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 18, paddingBottom: 24, flexGrow: 1 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {lines.length === 0 && !interim ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 30 }}>
              <IconBadge icon="ear-outline" tone="amber" size={72} />
              <Text
                style={{
                  fontSize: fs(17),
                  color: colors.muted,
                  textAlign: 'center',
                  lineHeight: fs(25),
                  marginTop: 16,
                }}
              >
                Tap Start captions and hold the phone near the person who is talking. Their words appear here.
              </Text>
            </View>
          ) : null}
          {lines.map((l, i) => (
            <Text
              key={i}
              selectable
              style={{ fontSize: textSize, lineHeight: textSize * 1.35, color: colors.text, marginBottom: 14 }}
            >
              {l}
            </Text>
          ))}
          {interim ? (
            <Text style={{ fontSize: textSize, lineHeight: textSize * 1.35, color: colors.muted, marginBottom: 14 }}>
              {interim}
            </Text>
          ) : null}
        </ScrollView>
      </View>

      {status ? (
        <View
          style={{
            backgroundColor: colors.accentSoft,
            borderRadius: 18,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginTop: 12,
          }}
        >
          <Text accessibilityLiveRegion="polite" style={{ fontSize: fs(15), color: colors.accent, fontWeight: '600' }}>
            {status}
          </Text>
        </View>
      ) : null}

      {/* Controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <BigButton
            label={listening ? 'Stop captions' : 'Start captions'}
            onPress={listening ? stopListening : startListening}
          />
        </View>
        <RoundButton icon="text-outline" label={big ? 'Smaller text' : 'Bigger text'} onPress={() => setBig(!big)} />
        <RoundButton
          icon="trash-outline"
          label="Clear captions"
          onPress={() => {
            setLines([]);
            setInterim('');
          }}
        />
        <RoundButton icon="options-outline" label="More options" onPress={() => setMoreOpen(true)} />
      </View>

      <SheetModal visible={moreOpen} title="Caption options" onClose={() => setMoreOpen(false)}>
        <Group>
          <SwitchRow
            icon="cloud-outline"
            tone="amber"
            title="Allow online captions"
            description={
              allowOnline
                ? 'The sound is sent to Google to make captions.'
                : 'Offline only. The sound stays on this phone.'
            }
            value={allowOnline}
            onChange={(v) => {
              if (listening) stopListening();
              setAllowOnline(v);
              setStatus('');
            }}
            last
          />
        </Group>
        <BigButton label="Download offline pack" variant="secondary" onPress={downloadPack} />
        <Text style={{ fontSize: fs(14), color: colors.muted, lineHeight: fs(21), marginTop: 16 }}>
          Captions can be wrong, especially in noise or far away, and in Telugu. They do not say who is
          talking.
        </Text>
        {status ? (
          <Text accessibilityLiveRegion="polite" style={{ fontSize: fs(15), color: colors.accent, marginTop: 12 }}>
            {status}
          </Text>
        ) : null}
      </SheetModal>
    </View>
  );
}

export default function CaptionsScreen({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {visible ? (
        <ErrorBoundary name="Captions">
          <Inner onClose={onClose} />
        </ErrorBoundary>
      ) : null}
    </Modal>
  );
}