import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as Speech from 'expo-speech';
import { colors } from '../theme';
import { useProfile } from '../ProfileContext';
import { ErrorBoundary } from '../ErrorBoundary';
import { BigButton, Body, Card, Title } from '../ui';
import { BOARD, Phrase, loadPhrases, savePhrases, voiceLanguage } from '../phrases';
import { hasVoiceFor, installHelp } from '../voices';
import { TARGET_NAMES, Target, translateEnglishTo } from '../translate';

type Mode = 'type' | 'phrases' | 'pictures';

const MODES: { id: Mode; label: string }[] = [
  { id: 'type', label: 'Type' },
  { id: 'phrases', label: 'Phrases' },
  { id: 'pictures', label: 'Pictures' },
];

const TARGETS: { id: Target; label: string }[] = [
  { id: 'asis', label: 'As typed' },
  { id: 'hi', label: 'Hindi' },
  { id: 'te', label: 'Telugu' },
];

function Inner({ onClose }: { onClose: () => void }) {
  const { fs } = useProfile();
  const [mode, setMode] = useState<Mode>('type');
  const [target, setTarget] = useState<Target>('asis');
  const [text, setText] = useState('');
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [newPhrase, setNewPhrase] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [status, setStatus] = useState('');
  const [translated, setTranslated] = useState('');

  useEffect(() => {
    loadPhrases()
      .then(setPhrases)
      .catch((e: any) => setStatus('Could not load phrases: ' + (e?.message ?? String(e))));
    return () => {
      try {
        Speech.stop();
      } catch {
        // Nothing to stop.
      }
    };
  }, []);

  const stop = () => {
    try {
      Speech.stop();
    } catch {
      // Nothing to stop.
    }
    setSpeaking(false);
  };

  const say = async (t: string) => {
    const msg = t.trim();
    if (!msg) {
      setStatus('Please type something first.');
      return;
    }
    let toSpeak = msg;
    let lang = voiceLanguage(msg);
    setTranslated('');

    if (target !== 'asis' && lang === 'en-IN') {
      try {
        setStatus('Translating to ' + TARGET_NAMES[target] + '...');
        toSpeak = await translateEnglishTo(msg, target);
        lang = target === 'hi' ? 'hi-IN' : 'te-IN';
        setTranslated(toSpeak);
      } catch (e: any) {
        setStatus('Could not translate: ' + (e?.message ?? String(e)));
        return;
      }
    }

    let note = '';
    if (lang !== 'en-IN' && !(await hasVoiceFor(lang))) {
      note = installHelp(lang);
    }
    try {
      Speech.stop();
      setSpeaking(true);
      setStatus(note);
      Speech.speak(toSpeak, {
        language: lang,
        rate: 0.9,
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: (e: any) => {
          setSpeaking(false);
          setStatus('Could not speak: ' + (e?.message ?? String(e)));
        },
      });
    } catch (e: any) {
      setSpeaking(false);
      setStatus('Could not speak: ' + (e?.message ?? String(e)));
    }
  };

  const persist = async (next: Phrase[]) => {
    setPhrases(next);
    try {
      await savePhrases(next);
    } catch (e: any) {
      setStatus('Could not save: ' + (e?.message ?? String(e)));
    }
  };

  const addPhrase = async (value: string) => {
    const t = value.trim();
    if (!t) {
      setStatus('Please type a phrase first.');
      return;
    }
    await persist([...phrases, { id: String(Date.now()), text: t }]);
    setStatus('Saved to your phrases.');
  };

  const inputStyle = {
    minHeight: 64,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: fs(22),
    color: colors.text,
    marginBottom: 10,
  } as const;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 240 }}
      keyboardShouldPersistTaps="handled"
    >
      <Title>Speak for me</Title>

      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        {MODES.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => setMode(m.id)}
            accessibilityRole="tab"
            accessibilityLabel={m.label}
            accessibilityState={{ selected: mode === m.id }}
            style={{
              flex: 1,
              minHeight: 64,
              borderRadius: 16,
              marginHorizontal: 3,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: mode === m.id ? colors.sage : colors.card,
              borderWidth: 1.5,
              borderColor: mode === m.id ? colors.sage : colors.border,
            }}
          >
            <Text
              style={{
                fontSize: fs(18),
                fontWeight: 'bold',
                color: mode === m.id ? colors.accentText : colors.text,
              }}
            >
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Body>Speak in</Body>
      <View style={{ flexDirection: 'row', marginTop: 6, marginBottom: 12 }}>
        {TARGETS.map((tg) => (
          <Pressable
            key={tg.id}
            onPress={() => {
              setTarget(tg.id);
              setTranslated('');
              setStatus('');
            }}
            accessibilityRole="radio"
            accessibilityLabel={'Speak in ' + tg.label}
            accessibilityState={{ selected: target === tg.id }}
            style={{
              flex: 1,
              minHeight: 64,
              borderRadius: 16,
              marginHorizontal: 3,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: target === tg.id ? colors.accent : colors.card,
              borderWidth: 1.5,
              borderColor: target === tg.id ? colors.accent : colors.border,
            }}
          >
            <Text
              style={{
                fontSize: fs(17),
                fontWeight: 'bold',
                color: target === tg.id ? colors.accentText : colors.text,
              }}
            >
              {tg.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {speaking ? <BigButton label="Stop speaking" onPress={stop} /> : null}

      {mode === 'type' && (
        <View>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type here"
            placeholderTextColor={colors.muted}
            multiline
            accessibilityLabel="Type what you want to say"
            style={[inputStyle, { minHeight: 150, textAlignVertical: 'top' }]}
          />
          <BigButton label="Speak" onPress={() => say(text)} />
          <BigButton label="Save as a quick phrase" onPress={() => addPhrase(text)} />
          <BigButton
            label="Clear"
            onPress={() => {
              setText('');
              setStatus('');
              setTranslated('');
            }}
          />
        </View>
      )}

      {mode === 'phrases' && (
        <View>
          <Body muted>Tap a phrase to hear it.</Body>
          <Text style={{ height: 8 }} />
          {phrases.length === 0 && <Body muted>No phrases yet. Add one below.</Body>}
          {phrases.map((p) => (
            <Card key={p.id}>
              <Pressable
                onPress={() => say(p.text)}
                accessibilityRole="button"
                accessibilityLabel={'Say: ' + p.text}
                style={{ minHeight: 64, justifyContent: 'center' }}
              >
                <Text style={{ fontSize: fs(21), color: colors.text }}>{p.text}</Text>
              </Pressable>
              <Pressable
                onPress={() => persist(phrases.filter((x) => x.id !== p.id))}
                accessibilityRole="button"
                accessibilityLabel={'Remove phrase: ' + p.text}
                style={{ minHeight: 64, justifyContent: 'center' }}
              >
                <Text style={{ fontSize: fs(17), color: colors.sos, fontWeight: 'bold' }}>
                  Remove
                </Text>
              </Pressable>
            </Card>
          ))}
          <TextInput
            value={newPhrase}
            onChangeText={setNewPhrase}
            placeholder="Add a new phrase"
            placeholderTextColor={colors.muted}
            accessibilityLabel="New phrase"
            style={inputStyle}
          />
          <BigButton
            label="Add phrase"
            onPress={async () => {
              await addPhrase(newPhrase);
              setNewPhrase('');
            }}
          />
        </View>
      )}

      {mode === 'pictures' && (
        <View>
          <Body muted>Tap a picture to hear it.</Body>
          <Text style={{ height: 8 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {BOARD.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => say(t.say)}
                accessibilityRole="button"
                accessibilityLabel={t.label + '. ' + t.say}
                style={{
                  width: '48%',
                  minHeight: 120,
                  marginBottom: 12,
                  borderRadius: 18,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 8,
                }}
              >
                <Text style={{ fontSize: 40 }}>{t.icon}</Text>
                <Text style={{ fontSize: fs(18), fontWeight: 'bold', color: colors.text, marginTop: 6 }}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {translated ? (
        <Card style={{ marginTop: 8 }}>
          <Body muted>{'In ' + TARGET_NAMES[target] + ':'}</Body>
          <Text selectable style={{ fontSize: fs(22), lineHeight: fs(30), color: colors.text }}>
            {translated}
          </Text>
          <Body muted>Machine translation by Google ML Kit. It can contain mistakes.</Body>
        </Card>
      ) : null}

      {status ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{ fontSize: fs(18), color: colors.accent, marginTop: 8 }}
        >
          {status}
        </Text>
      ) : null}

      <Text style={{ height: 12 }} />
      <Body muted>
        If you hear nothing, turn up the volume. Your phone must have a voice installed for the
        language you choose.
      </Body>
      <BigButton
        label="Close"
        onPress={() => {
          stop();
          onClose();
        }}
      />
    </ScrollView>
  );
}

export default function SpeakScreen({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {visible ? (
        <ErrorBoundary name="Speak for me">
          <Inner onClose={onClose} />
        </ErrorBoundary>
      ) : null}
    </Modal>
  );
}