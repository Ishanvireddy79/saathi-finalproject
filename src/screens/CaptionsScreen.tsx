import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { colors } from '../theme';
import { useProfile } from '../ProfileContext';
import { ErrorBoundary } from '../ErrorBoundary';
import { BigButton, Body, Title } from '../ui';

const LANGS = [
  { id: 'en-IN', label: 'English' },
  { id: 'hi-IN', label: 'Hindi' },
  { id: 'te-IN', label: 'Telugu' },
];

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
  const scrollRef = useRef<ScrollView>(null);

  const wantRef = useRef(false);
  const langRef = useRef(lang);
  const onlineRef = useRef(allowOnline);
  langRef.current = lang;
  onlineRef.current = allowOnline;

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
            'Your phone cannot make captions offline. If you are happy for the sound to be sent to Google, turn on "Allow online captions".'
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
          ' is not ready for offline captions on this phone. Tap "Download offline pack" below. If that fails with error 12, your phone does not offer ' +
          langName +
          ' offline, so turn on "Allow online captions" to use it.'
      );
    } else if (code === 'network') {
      setStatus(
        'Captions need the internet, or the offline pack. Tap "Download offline pack" while online, then try again.'
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
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: 56 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Title>Live captions</Title>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 20 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {lines.length === 0 && !interim ? (
          <Body muted>
            Tap Start captions. Hold the phone near the person who is talking. Their words appear here.
          </Body>
        ) : null}
        {lines.map((l, i) => (
          <Text
            key={i}
            selectable
            style={{ fontSize: textSize, lineHeight: textSize * 1.35, color: colors.text, marginBottom: 12 }}
          >
            {l}
          </Text>
        ))}
        {interim ? (
          <Text
            style={{ fontSize: textSize, lineHeight: textSize * 1.35, color: colors.muted, marginBottom: 12 }}
          >
            {interim}
          </Text>
        ) : null}
      </ScrollView>

      {status ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{ fontSize: fs(16), color: colors.accent, paddingHorizontal: 20, paddingBottom: 6 }}
        >
          {status}
        </Text>
      ) : null}

      <ScrollView style={{ flexGrow: 0, maxHeight: 360 }} contentContainerStyle={{ padding: 20, paddingTop: 6 }}>
        <BigButton
          label={listening ? 'Stop captions' : 'Start captions'}
          onPress={listening ? stopListening : startListening}
        />

        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          {LANGS.map((l) => (
            <Pressable
              key={l.id}
              onPress={() => {
                if (listening) stopListening();
                setLang(l.id);
                setStatus('');
              }}
              accessibilityRole="radio"
              accessibilityLabel={'Captions in ' + l.label}
              accessibilityState={{ selected: lang === l.id }}
              style={{
                flex: 1,
                minHeight: 64,
                marginHorizontal: 3,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: lang === l.id ? colors.accent : colors.card,
                borderWidth: 1.5,
                borderColor: lang === l.id ? colors.accent : colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: fs(17),
                  fontWeight: 'bold',
                  color: lang === l.id ? colors.accentText : colors.text,
                }}
              >
                {l.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => {
            if (listening) stopListening();
            setAllowOnline(!allowOnline);
            setStatus('');
          }}
          accessibilityRole="switch"
          accessibilityLabel="Allow online captions"
          accessibilityState={{ checked: allowOnline }}
          style={{
            minHeight: 64,
            marginTop: 10,
            borderRadius: 16,
            justifyContent: 'center',
            paddingHorizontal: 16,
            backgroundColor: allowOnline ? colors.sage : colors.card,
            borderWidth: 1.5,
            borderColor: allowOnline ? colors.sage : colors.border,
          }}
        >
          <Text style={{ fontSize: fs(16), fontWeight: 'bold', color: allowOnline ? colors.accentText : colors.text }}>
            {allowOnline
              ? 'Online captions allowed. The sound is sent to Google. Tap to turn off.'
              : 'Offline only. The sound stays on this phone. Tap to allow online.'}
          </Text>
        </Pressable>

        <BigButton label="Download offline pack" onPress={downloadPack} />
        <BigButton label={big ? 'Smaller text' : 'Bigger text'} onPress={() => setBig(!big)} />
        <BigButton
          label="Clear"
          onPress={() => {
            setLines([]);
            setInterim('');
          }}
        />
        <Body muted>
          Captions can be wrong, especially in noise or far away, and in Telugu. They do not say who
          is talking.
        </Body>
        <BigButton
          label="Close"
          onPress={() => {
            stopListening();
            onClose();
          }}
        />
      </ScrollView>
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