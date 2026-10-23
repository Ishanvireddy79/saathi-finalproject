import React, { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  FlatList,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { colors } from '../theme';
import { useProfile } from '../ProfileContext';
import { SIGN_LESSONS, Sign, SignCategory } from '../data/signLessons';
import SignQuiz from './SignQuiz';

const LEARNED_KEY = '@saathi/learned-signs';
const TEXT: string = (colors as any).text ?? '#1a1a1a';

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

export default function Learn() {
  const { fs } = useProfile();
  const [category, setCategory] = useState<SignCategory | null>(null);
  const [learned, setLearned] = useState<string[]>([]);
  const [quiz, setQuiz] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load saved progress once
  useEffect(() => {
    AsyncStorage.getItem(LEARNED_KEY)
      .then((v) => {
        if (v) setLearned(JSON.parse(v));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Save progress, but only after the saved value has been loaded
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(LEARNED_KEY, JSON.stringify(learned)).catch(() => {});
  }, [learned, loaded]);

  // Phone back button / gesture: go back one level inside Learn
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
    setLearned((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: (StatusBar.currentHeight ?? 0) + 16 }}
    >
      <Text style={{ fontSize: fs(24), fontWeight: 'bold', color: TEXT }}>
        Learn Signs
      </Text>
      <Text style={{ fontSize: fs(15), color: colors.muted, marginBottom: 16 }}>
        Simple sign language for emergencies. Tap a card to hear it spoken aloud.
      </Text>

      <Pressable
        onPress={() => setQuiz(true)}
        accessibilityRole="button"
        accessibilityLabel="Start practice quiz"
        style={{
          backgroundColor: colors.accent,
          borderRadius: 16,
          padding: 18,
          marginBottom: 16,
          alignItems: 'center',
          minHeight: 56,
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: colors.accentText, fontSize: fs(18), fontWeight: 'bold' }}>
          🧠 Practice quiz
        </Text>
      </Pressable>

      {SIGN_LESSONS.map((c) => {
        const done = c.signs.filter((s) => learned.includes(s.id)).length;
        return (
          <Pressable
            key={c.id}
            onPress={() => {
              Speech.speak(c.intro);
              setCategory(c);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${c.title}, ${done} of ${c.signs.length} learned`}
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 18,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: fs(18), fontWeight: 'bold', color: TEXT }}>
              {c.title}
            </Text>
            <Text style={{ fontSize: fs(14), color: colors.muted, marginTop: 4 }}>
              {done} of {c.signs.length} learned
            </Text>
          </Pressable>
        );
      })}

      <Pressable
        onPress={() =>
          Alert.alert('Reset progress?', 'This clears all signs you marked as learned.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reset', style: 'destructive', onPress: () => setLearned([]) },
          ])
        }
        accessibilityRole="button"
        accessibilityLabel="Reset learned signs"
        style={{ padding: 16, alignItems: 'center', minHeight: 48, justifyContent: 'center' }}
      >
        <Text style={{ fontSize: fs(15), color: colors.muted }}>Reset progress</Text>
      </Pressable>
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
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={8}
        style={{
          paddingHorizontal: 16,
          paddingBottom: 12,
          paddingTop: (StatusBar.currentHeight ?? 0) + 12,
          minHeight: 48,
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: fs(16), color: colors.accent }}>‹ Back</Text>
      </Pressable>

      <FlatList
        data={category.signs}
        keyExtractor={(s) => s.id}
        extraData={learned}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        renderItem={({ item }) => {
          const isLearned = learned.includes(item.id);
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              {/* Card: tap to hear the sign and see how to do it */}
              <Pressable
                onPress={() => {
                  setSign(item);
                  Speech.speak(item.say);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${item.word}. Tap to hear and see how to sign it`}
                style={{
                  flex: 1,
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 18,
                  borderWidth: 2,
                  borderColor: isLearned ? colors.accent : colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 72,
                }}
              >
                <Text style={{ fontSize: 36, marginRight: 14 }}>
                  {SIGN_EMOJI[item.id] ?? '✋'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fs(18), fontWeight: 'bold', color: TEXT }}>
                    {item.word}
                    {item.hindi ? `  ·  ${item.hindi}` : ''}
                  </Text>
                  <Text style={{ fontSize: fs(14), color: colors.muted, marginTop: 2 }}>
                    Tap to hear it spoken
                  </Text>
                </View>
              </Pressable>

              {/* Separate checkbox: mark as learned / not learned */}
              <Pressable
                onPress={() => onToggle(item.id)}
                hitSlop={8}
                accessibilityRole="checkbox"
                accessibilityLabel={`Mark ${item.word} as learned`}
                accessibilityState={{ checked: isLearned }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  borderWidth: 2,
                  borderColor: isLearned ? colors.accent : colors.border,
                  backgroundColor: isLearned ? colors.accent : colors.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 10,
                }}
              >
                {isLearned ? (
                  <Text style={{ color: colors.accentText, fontSize: 22 }}>✓</Text>
                ) : null}
              </Pressable>
            </View>
          );
        }}
      />

      {sign ? (
        <View
          style={{
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            padding: 20,
            paddingBottom: 36,
          }}
        >
          <Text style={{ fontSize: fs(18), fontWeight: 'bold', color: colors.accent }}>
            How to sign &quot;{sign.word}&quot;
          </Text>
          <Text
            style={{ fontSize: fs(15), color: TEXT, marginTop: 8, lineHeight: fs(22) }}
          >
            {sign.howTo}
          </Text>

          <Pressable
            onPress={() => Speech.speak(sign.say)}
            accessibilityRole="button"
            accessibilityLabel="Speak again"
            style={{
              marginTop: 14,
              backgroundColor: colors.accent,
              borderRadius: 12,
              padding: 14,
              alignItems: 'center',
              minHeight: 48,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.accentText, fontSize: fs(16), fontWeight: 'bold' }}>
              🔊 Speak again
            </Text>
          </Pressable>

          {sign.hindi ? (
            <Pressable
              onPress={() => Speech.speak(sign.hindi as string, { language: 'hi-IN' })}
              accessibilityRole="button"
              accessibilityLabel="Speak in Hindi"
              style={{
                marginTop: 10,
                borderWidth: 2,
                borderColor: colors.accent,
                borderRadius: 12,
                padding: 14,
                alignItems: 'center',
                minHeight: 48,
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.accent, fontSize: fs(16), fontWeight: 'bold' }}>
                🔊 हिंदी में सुनें
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}