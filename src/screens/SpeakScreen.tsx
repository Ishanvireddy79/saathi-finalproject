import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Speech from 'expo-speech';
import { colors, shadow } from '../theme';
import { useProfile } from '../ProfileContext';
import { ErrorBoundary } from '../ErrorBoundary';
import { BigButton, Card, Glyph, Group, IconBadge, PillTabs, Segmented, TOP_PAD, TopBar } from '../ui';
import {
  BOARD,
  Phrase,
  SUGGESTED,
  loadFavs,
  loadPhrases,
  saveFavs,
  savePhrases,
  voiceLanguage,
} from '../phrases';
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

function CardAction({
  icon,
  text,
  color,
  label,
  onPress,
  checked,
  fs,
}: {
  icon: string;
  text: string;
  color: string;
  label: string;
  onPress: () => void;
  checked?: boolean;
  fs: (n: number) => number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={checked === undefined ? 'button' : 'checkbox'}
      accessibilityLabel={label}
      accessibilityState={checked === undefined ? undefined : { checked }}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? colors.bg : 'transparent',
      })}
    >
      <Glyph icon={icon} color={color} size={20} />
      <Text style={{ fontSize: fs(15), fontWeight: '700', color, marginLeft: 6 }}>{text}</Text>
    </Pressable>
  );
}

function Inner({ onClose }: { onClose: () => void }) {
  const { fs } = useProfile();
  const [mode, setMode] = useState<Mode>('type');
  const [target, setTarget] = useState<Target>('asis');
  const [text, setText] = useState('');
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [newPhrase, setNewPhrase] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [status, setStatus] = useState('');
  const [translated, setTranslated] = useState('');

  useEffect(() => {
    loadPhrases()
      .then(setPhrases)
      .catch((e: any) => setStatus('Could not load phrases: ' + (e?.message ?? String(e))));
    loadFavs()
      .then(setFavs)
      .catch(() => {
        // Favorites are optional.
      });
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

  const persistFavs = async (next: string[]) => {
    setFavs(next);
    try {
      await saveFavs(next);
    } catch (e: any) {
      setStatus('Could not save favorites: ' + (e?.message ?? String(e)));
    }
  };

  const toggleFav = (id: string) =>
    persistFavs(favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id]);

  const addPhrase = async (value: string) => {
    const t = value.trim();
    if (!t) {
      setStatus('Please type a phrase first.');
      return;
    }
    await persist([...phrases, { id: String(Date.now()), text: t }]);
    setStatus('Saved to your phrases.');
  };

  // Phrases tab: adds a new phrase, or saves changes to one being edited.
  const submitPhrase = async () => {
    const t = newPhrase.trim();
    if (!t) {
      setStatus('Please type a phrase first.');
      return;
    }
    if (editingId) {
      await persist(phrases.map((p) => (p.id === editingId ? { ...p, text: t } : p)));
      setStatus('Changes saved.');
    } else {
      await addPhrase(t);
    }
    setNewPhrase('');
    setEditingId(null);
  };

  const startEdit = (p: Phrase) => {
    setNewPhrase(p.text);
    setEditingId(p.id);
    setStatus('Editing. Change the text below, then tap Save changes.');
  };

  const cancelEdit = () => {
    setNewPhrase('');
    setEditingId(null);
    setStatus('');
  };

  const removePhrase = async (p: Phrase) => {
    await persist(phrases.filter((x) => x.id !== p.id));
    if (favs.includes(p.id)) await persistFavs(favs.filter((x) => x !== p.id));
    if (editingId === p.id) cancelEdit();
  };

  const orderedPhrases = [
    ...phrases.filter((p) => favs.includes(p.id)),
    ...phrases.filter((p) => !favs.includes(p.id)),
  ];

  const inputStyle = {
    minHeight: 60,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: fs(19),
    color: colors.text,
    marginBottom: 10,
  } as const;

  const smallTitle = (t: string) => (
    <Text
      accessibilityRole="header"
      style={{
        fontSize: fs(13),
        fontWeight: '800',
        letterSpacing: 1,
        color: colors.muted,
        textTransform: 'uppercase',
        marginTop: 16,
        marginBottom: 10,
      }}
    >
      {t}
    </Text>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: TOP_PAD, paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
    >
      <TopBar
        title="Speak for me"
        onBack={() => {
          stop();
          onClose();
        }}
      />

      <PillTabs label="Speak for me mode" options={MODES} value={mode} onChange={setMode} />

      <Text style={{ fontSize: fs(14), fontWeight: '700', color: colors.muted, marginBottom: 8 }}>Speak in</Text>
      <Segmented label="Speak in" options={TARGETS} value={target} onChange={(v) => {
        setTarget(v);
        setTranslated('');
        setStatus('');
      }} />

      {speaking ? (
        <View style={{ marginTop: 6 }}>
          <BigButton label="Stop speaking" onPress={stop} />
        </View>
      ) : null}

      <View style={{ height: 18 }} />

      {mode === 'type' && (
        <View>
          <View style={{ backgroundColor: colors.card, borderRadius: 26, padding: 6, ...shadow }}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type what you want to say"
              placeholderTextColor={colors.muted}
              multiline
              accessibilityLabel="Type what you want to say"
              style={{
                minHeight: 160,
                padding: 16,
                fontSize: fs(22),
                lineHeight: fs(30),
                color: colors.text,
                textAlignVertical: 'top',
              }}
            />
          </View>
          <BigButton label="Speak" onPress={() => say(text)} />
          <BigButton label="Save as a quick phrase" variant="secondary" onPress={() => addPhrase(text)} />
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
          <Text style={{ fontSize: fs(15), color: colors.muted, lineHeight: fs(22), marginBottom: 14 }}>
            Tap a phrase to hear it. Favorites stay at the top.
          </Text>
          {phrases.length === 0 && (
            <Card>
              <Text style={{ fontSize: fs(16), color: colors.muted }}>No phrases yet. Add one below.</Text>
            </Card>
          )}
          {orderedPhrases.map((p) => {
            const isFav = favs.includes(p.id);
            return (
              <View
                key={p.id}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 24,
                  marginBottom: 12,
                  borderWidth: isFav ? 2 : 0,
                  borderColor: colors.accent,
                  overflow: 'hidden',
                  ...shadow,
                }}
              >
                <Pressable
                  onPress={() => say(p.text)}
                  accessibilityRole="button"
                  accessibilityLabel={'Say: ' + p.text}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    minHeight: 72,
                    backgroundColor: pressed ? colors.bg : colors.card,
                  })}
                >
                  <IconBadge icon="volume-high-outline" tone="accent" size={44} />
                  <Text style={{ flex: 1, marginLeft: 14, fontSize: fs(19), lineHeight: fs(26), color: colors.text }}>
                    {p.text}
                  </Text>
                </Pressable>
                <View style={{ flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
                  <CardAction
                    fs={fs}
                    icon={isFav ? 'star' : 'star-outline'}
                    text="Favorite"
                    color={colors.accent}
                    label={'Favorite: ' + p.text}
                    checked={isFav}
                    onPress={() => toggleFav(p.id)}
                  />
                  <CardAction
                    fs={fs}
                    icon="create-outline"
                    text="Edit"
                    color={colors.sage}
                    label={'Edit phrase: ' + p.text}
                    onPress={() => startEdit(p)}
                  />
                  <CardAction
                    fs={fs}
                    icon="trash-outline"
                    text="Remove"
                    color={colors.sos}
                    label={'Remove phrase: ' + p.text}
                    onPress={() => removePhrase(p)}
                  />
                </View>
              </View>
            );
          })}

          {smallTitle(editingId ? 'Edit phrase' : 'Add a phrase')}
          <TextInput
            value={newPhrase}
            onChangeText={setNewPhrase}
            placeholder={editingId ? 'Change the phrase' : 'Type a new phrase'}
            placeholderTextColor={colors.muted}
            accessibilityLabel={editingId ? 'Edit phrase' : 'New phrase'}
            style={inputStyle}
          />
          <BigButton label={editingId ? 'Save changes' : 'Add phrase'} onPress={submitPhrase} />
          {editingId ? <BigButton label="Cancel editing" onPress={cancelEdit} /> : null}

          <Text
            accessibilityRole="header"
            style={{ fontSize: fs(22), fontWeight: '800', letterSpacing: -0.3, color: colors.text, marginTop: 28 }}
          >
            Suggested phrases
          </Text>
          <Text style={{ fontSize: fs(14), color: colors.muted, marginTop: 4 }}>
            Tap to hear one, or add it to your own phrases.
          </Text>
          {SUGGESTED.map((g) => (
            <View key={g.id}>
              {smallTitle(g.title)}
              <Group>
                {g.items.map((item, i) => {
                  const added = phrases.some((p) => p.text === item);
                  return (
                    <View
                      key={g.id + item}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderBottomWidth: i === g.items.length - 1 ? 0 : StyleSheet.hairlineWidth,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <Pressable
                        onPress={() => say(item)}
                        accessibilityRole="button"
                        accessibilityLabel={'Say: ' + item}
                        style={{ flex: 1, minHeight: 64, paddingVertical: 10, paddingHorizontal: 16, justifyContent: 'center' }}
                      >
                        <Text style={{ fontSize: fs(17), lineHeight: fs(24), color: colors.text }}>{item}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => (added ? undefined : addPhrase(item))}
                        disabled={added}
                        accessibilityRole="button"
                        accessibilityLabel={added ? 'Already in your phrases: ' + item : 'Add to my phrases: ' + item}
                        accessibilityState={{ disabled: added }}
                        style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Glyph
                          icon={added ? 'checkmark-circle' : 'add-circle-outline'}
                          color={added ? colors.sage : colors.accent}
                          size={28}
                        />
                      </Pressable>
                    </View>
                  );
                })}
              </Group>
            </View>
          ))}
        </View>
      )}

      {mode === 'pictures' && (
        <View>
          <Text style={{ fontSize: fs(15), color: colors.muted, marginBottom: 14 }}>Tap a picture to hear it.</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {BOARD.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => say(t.say)}
                accessibilityRole="button"
                accessibilityLabel={t.label + '. ' + t.say}
                style={({ pressed }) => ({
                  width: '48%',
                  minHeight: 140,
                  marginBottom: 14,
                  borderRadius: 26,
                  backgroundColor: colors.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 12,
                  opacity: pressed ? 0.88 : 1,
                  ...shadow,
                })}
              >
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: colors.accentSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 38 }}>{t.icon}</Text>
                </View>
                <Text style={{ fontSize: fs(17), fontWeight: '700', color: colors.text, marginTop: 10, textAlign: 'center' }}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {translated ? (
        <Card style={{ marginTop: 8 }}>
          <Text style={{ fontSize: fs(14), color: colors.muted }}>{'In ' + TARGET_NAMES[target]}</Text>
          <Text selectable style={{ fontSize: fs(22), lineHeight: fs(30), color: colors.text, marginTop: 4 }}>
            {translated}
          </Text>
          <Text style={{ fontSize: fs(13), color: colors.muted, marginTop: 8 }}>
            Machine translation by Google ML Kit. It can contain mistakes.
          </Text>
        </Card>
      ) : null}

      {status ? (
        <View style={{ backgroundColor: colors.accentSoft, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, marginTop: 8 }}>
          <Text accessibilityLiveRegion="polite" style={{ fontSize: fs(16), color: colors.accent, fontWeight: '600' }}>
            {status}
          </Text>
        </View>
      ) : null}

      <Text style={{ fontSize: fs(13), color: colors.muted, lineHeight: fs(20), marginTop: 20 }}>
        If you hear nothing, turn up the volume. Your phone must have a voice installed for the language you
        choose.
      </Text>
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