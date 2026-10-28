import React, { useEffect, useState } from 'react';
import { Alert, BackHandler, FlatList, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { colors, shadow } from '../theme';
import { useProfile } from '../ProfileContext';
import {
  ActionRow,
  BackButton,
  BigButton,
  Card,
  IconBadge,
  ProgressBar,
  ScreenHeader,
  SectionTitle,
  TOP_PAD,
  Tone,
} from '../ui';
import { SIGN_LESSONS, Sign, SignCategory } from '../data/signLessons';
import SignQuiz from './SignQuiz';

const LEARNED_KEY = '@saathi/learned-signs';

const SIGN_EMOJI: Record<string, string> = {
  help: '🆘',
  danger: '⚠️',
  doctor: '🧑‍⚕️',
  hospital: '🏥',
  ambulance: '🚑',
  police: '👮',
  pain: '😣',
  fall: '⬇️',
  bleeding: '🩸',
  breathe: '😮‍💨',
  chest: '🫀',
  head: '🤕',
  yes: '✅',
  no: '❌',
  name: '🪪',
  water: '💧',
  call: '📞',
  where: '❓',
};

const CATEGORY_LOOK: Record<string, { icon: string; tone: Tone }> = {
  emergency: { icon: '🚨', tone: 'sos' },
  'what-happened': { icon: '🩹', tone: 'amber' },
  talk: { icon: '💬', tone: 'sage' },
};

// Opens a video search for the official ISLRTC sign for a word.
function openOfficial(word: string) {
  const q = encodeURIComponent('ISLRTC Indian Sign Language ' + word);
  Linking.openURL('https://www.youtube.com/results?search_query=' + q).catch(() => {});
}

const NOTICE =
  'These sign descriptions are still being checked against the official ISLRTC dictionary. Please watch the official sign before you rely on one.';

export default function Learn() {
  const { fs } = useProfile();
  const [category, setCategory] = useState<SignCategory | null>(null);
  const [learned, setLearned] = useState<string[]>([]);
  const [quiz, setQuiz] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LEARNED_KEY)
      .then((v) => {
        if (v) setLearned(JSON.parse(v));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(LEARNED_KEY, JSON.stringify(learned)).catch(() => {});
  }, [learned, loaded]);

  // Phone back button or gesture goes back one level inside Learn.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (quiz) {
        setQuiz(false);
        return true;
      }
      if (category) {
        setCategory(null);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [quiz, category]);

  const toggleLearned = (id: string) =>
    setLearned((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const markLearned = (id: string) =>
    setLearned((prev) => (prev.includes(id) ? prev : [...prev, id]));

  if (quiz) {
    return <SignQuiz fs={fs} onBack={() => setQuiz(false)} onCorrect={markLearned} />;
  }

  if (category) {
    return (
      <SignList
        category={category}
        fs={fs}
        learned={learned}
        onToggle={toggleLearned}
        onBack={() => setCategory(null)}
      />
    );
  }

  const total = SIGN_LESSONS.reduce((n, c) => n + c.signs.length, 0);
  const doneAll = SIGN_LESSONS.reduce(
    (n, c) => n + c.signs.filter((s) => learned.includes(s.id)).length,
    0
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: TOP_PAD, paddingBottom: 32 }}
    >
      <ScreenHeader title="Learn signs" subtitle="Simple sign language for emergencies." />

      <Card>
        <Text style={{ fontSize: fs(15), color: colors.muted }}>Your progress</Text>
        <Text style={{ fontSize: fs(30), fontWeight: '800', color: colors.text, marginVertical: 4 }}>
          {doneAll} of {total} learned
        </Text>
        <ProgressBar value={doneAll} max={total} tone="sage" />
      </Card>

      <Card style={{ backgroundColor: colors.amberSoft }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <IconBadge icon="information-circle-outline" tone="amber" size={40} />
          <Text style={{ flex: 1, marginLeft: 12, fontSize: fs(14), lineHeight: fs(21), color: colors.text }}>
            {NOTICE}
          </Text>
        </View>
      </Card>

      <ActionRow
        icon="🧠"
        tone="accent"
        title="Practice quiz"
        subtitle="Test what you have learned"
        onPress={() => setQuiz(true)}
      />

      <SectionTitle>Lessons</SectionTitle>
      {SIGN_LESSONS.map((c) => {
        const done = c.signs.filter((s) => learned.includes(s.id)).length;
        const look = CATEGORY_LOOK[c.id] ?? { icon: '✋', tone: 'accent' as Tone };
        return (
          <Pressable
            key={c.id}
            onPress={() => {
              Speech.speak(c.intro);
              setCategory(c);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${c.title}, ${done} of ${c.signs.length} learned`}
            style={({ pressed }) => ({
              backgroundColor: colors.card,
              borderRadius: 26,
              padding: 18,
              marginBottom: 12,
              opacity: pressed ? 0.9 : 1,
              ...shadow,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconBadge icon={look.icon} tone={look.tone} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ fontSize: fs(19), fontWeight: '700', color: colors.text }}>{c.title}</Text>
                <Text style={{ fontSize: fs(14), color: colors.muted, marginTop: 2 }}>
                  {done} of {c.signs.length} learned
                </Text>
              </View>
              <Text style={{ fontSize: 28, color: colors.muted }}>›</Text>
            </View>
            <View style={{ marginTop: 14 }}>
              <ProgressBar value={done} max={c.signs.length} tone={look.tone} />
            </View>
          </Pressable>
        );
      })}

      <BigButton
        label="Reset progress"
        variant="secondary"
        onPress={() =>
          Alert.alert('Reset progress?', 'This clears all signs you marked as learned.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reset', style: 'destructive', onPress: () => setLearned([]) },
          ])
        }
      />
    </ScrollView>
  );
}

function SignList({
  category,
  fs,
  learned,
  onToggle,
  onBack,
}: {
  category: SignCategory;
  fs: (n: number) => number;
  learned: string[];
  onToggle: (id: string) => void;
  onBack: () => void;
}) {
  const [sign, setSign] = useState<Sign | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: TOP_PAD, paddingBottom: 8 }}>
        <BackButton onPress={onBack} />
        <Text
          accessibilityRole="header"
          style={{ fontSize: fs(28), fontWeight: '800', letterSpacing: -0.4, color: colors.text, marginTop: 14 }}
        >
          {category.title}
        </Text>
        <Text style={{ fontSize: fs(15), color: colors.muted, marginTop: 2 }}>{category.intro}</Text>
        <Text style={{ fontSize: fs(13), color: colors.amber, marginTop: 6, lineHeight: fs(19) }}>
          Being checked against ISLRTC. Watch the official sign before you rely on it.
        </Text>
      </View>

      <FlatList
        data={category.signs}
        keyExtractor={(s) => s.id}
        extraData={learned}
        contentContainerStyle={{ padding: 20, paddingTop: 12 }}
        renderItem={({ item }) => {
          const isLearned = learned.includes(item.id);
          const selected = sign?.id === item.id;
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Pressable
                onPress={() => {
                  setSign(item);
                  Speech.speak(item.say);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${item.word}. Tap to hear and see how to sign it`}
                style={({ pressed }) => ({
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 80,
                  backgroundColor: colors.card,
                  borderRadius: 24,
                  padding: 14,
                  borderWidth: 2,
                  borderColor: selected ? colors.accent : 'transparent',
                  opacity: pressed ? 0.9 : 1,
                  ...shadow,
                })}
              >
                <IconBadge icon={SIGN_EMOJI[item.id] ?? '✋'} tone={isLearned ? 'sage' : 'accent'} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ fontSize: fs(18), fontWeight: '700', color: colors.text }}>
                    {item.word}
                  </Text>
                  {item.hindi ? (
                    <Text style={{ fontSize: fs(15), color: colors.muted, marginTop: 2 }}>{item.hindi}</Text>
                  ) : null}
                </View>
              </Pressable>

              <Pressable
                onPress={() => onToggle(item.id)}
                hitSlop={8}
                accessibilityRole="checkbox"
                accessibilityLabel={`Mark ${item.word} as learned`}
                accessibilityState={{ checked: isLearned }}
                style={{
                  width: 52,
                  height: 52,
                  marginLeft: 10,
                  borderRadius: 26,
                  borderWidth: 2,
                  borderColor: isLearned ? colors.sage : colors.border,
                  backgroundColor: isLearned ? colors.sage : colors.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isLearned ? <Text style={{ color: colors.accentText, fontSize: 24 }}>✓</Text> : null}
              </Pressable>
            </View>
          );
        }}
      />

      {sign ? (
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 22,
            paddingBottom: 36,
            ...shadow,
            shadowOffset: { width: 0, height: -4 },
            elevation: 12,
          }}
        >
          <Text style={{ fontSize: fs(20), fontWeight: '800', color: colors.accent }}>
            How to sign &quot;{sign.word}&quot;
          </Text>
          <Text style={{ fontSize: fs(16), color: colors.text, marginTop: 8, lineHeight: fs(24) }}>
            {sign.howTo}
          </Text>
          <BigButton label="Watch the official sign" onPress={() => openOfficial(sign.word)} />
          <BigButton label="🔊 Speak again" variant="secondary" onPress={() => Speech.speak(sign.say)} />
          {sign.hindi ? (
            <BigButton
              label="🔊 हिंदी में सुनें"
              variant="secondary"
              onPress={() => Speech.speak(sign.hindi as string, { language: 'hi-IN' })}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}