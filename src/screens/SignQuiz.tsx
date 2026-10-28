import React, { useState } from 'react';
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import * as Speech from 'expo-speech';
import { colors } from '../theme';
import { SIGN_LESSONS, Sign } from '../data/signLessons';
import { BackButton, TOP_PAD } from '../ui';

const ALL: Sign[] = SIGN_LESSONS.flatMap((c) => c.signs);
const QUESTIONS = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Q = { answer: Sign; options: Sign[] };

function buildQuiz(): Q[] {
  return shuffle(ALL)
    .slice(0, QUESTIONS)
    .map((answer) => {
      const wrong = shuffle(ALL.filter((s) => s.id !== answer.id)).slice(0, 3);
      return { answer, options: shuffle([answer, ...wrong]) };
    });
}

export default function SignQuiz({
  fs,
  onCorrect,
  onBack,
}: {
  fs: (n: number) => number;
  onCorrect: (id: string) => void;
  onBack: () => void;
}) {
  const [quiz, setQuiz] = useState<Q[]>(buildQuiz);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const finished = index >= QUESTIONS;

  const restart = () => {
    setQuiz(buildQuiz());
    setIndex(0);
    setPicked(null);
    setScore(0);
  };

  const choose = (q: Q, s: Sign) => {
    if (picked !== null) return;
    setPicked(s.id);
    if (s.id === q.answer.id) {
      setScore((n) => n + 1);
      onCorrect(s.id);
      Speech.speak(q.answer.say);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 16, paddingTop: TOP_PAD, paddingBottom: 8 }}>
        <BackButton onPress={onBack} />
      </View>

      {finished ? (
        <View style={{ padding: 20 }}>
          <Text
            accessibilityLiveRegion="polite"
            style={{ fontSize: fs(26), fontWeight: 'bold', color: colors.text }}
          >
            You got {score} of {QUESTIONS}
          </Text>
          <Pressable
            onPress={restart}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            style={{
              marginTop: 20,
              backgroundColor: colors.accent,
              borderRadius: 16,
              minHeight: 64,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.accentText, fontSize: fs(20), fontWeight: 'bold' }}>
              Try again
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0 }}>
          <Text style={{ fontSize: fs(14), color: colors.muted }}>
            Question {index + 1} of {QUESTIONS}
          </Text>
          <Text
            style={{ fontSize: fs(18), color: colors.text, marginVertical: 12, lineHeight: fs(26) }}
          >
            Which sign is this?{'\n'}
            {quiz[index].answer.howTo}
          </Text>

          {quiz[index].options.map((s) => {
            const isAnswer = s.id === quiz[index].answer.id;
            const isPicked = picked === s.id;
            let border = colors.border;
            let bg = colors.card;
            if (picked !== null && isAnswer) {
              border = colors.sage;
              bg = colors.sageSoft;
            } else if (isPicked) {
              border = colors.sos;
            }
            return (
              <Pressable
                key={s.id}
                onPress={() => choose(quiz[index], s)}
                accessibilityRole="button"
                accessibilityLabel={s.word}
                accessibilityState={{ selected: isPicked }}
                style={{
                  minHeight: 64,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: border,
                  backgroundColor: bg,
                  justifyContent: 'center',
                  paddingHorizontal: 18,
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontSize: fs(18), color: colors.text, fontWeight: 'bold' }}>
                  {s.word}
                </Text>
              </Pressable>
            );
          })}

          {picked !== null ? (
            <>
              <Text
                accessibilityLiveRegion="polite"
                style={{
                  fontSize: fs(18),
                  fontWeight: 'bold',
                  color: picked === quiz[index].answer.id ? colors.sage : colors.sos,
                  marginBottom: 8,
                }}
              >
                {picked === quiz[index].answer.id
                  ? 'Correct.'
                  : 'Not quite. The answer is ' + quiz[index].answer.word + '.'}
              </Text>
              <Pressable
                onPress={() => {
                  setPicked(null);
                  setIndex((i) => i + 1);
                }}
                accessibilityRole="button"
                accessibilityLabel="Next"
                style={{
                  marginTop: 4,
                  backgroundColor: colors.accent,
                  borderRadius: 16,
                  minHeight: 56,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.accentText, fontSize: fs(18), fontWeight: 'bold' }}>
                  {index + 1 >= QUESTIONS ? 'See result' : 'Next'}
                </Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}