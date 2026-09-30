import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from './theme';
import { useProfile } from './ProfileContext';

export function Title({ children }: { children: React.ReactNode }) {
  const { fs } = useProfile();
  return (
    <Text
      accessibilityRole="header"
      style={{ fontSize: fs(28), fontWeight: 'bold', color: colors.text, marginBottom: 12 }}
    >
      {children}
    </Text>
  );
}

export function Body({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  const { fs } = useProfile();
  return (
    <Text
      style={{
        fontSize: fs(18),
        lineHeight: fs(26),
        color: muted ? colors.muted : colors.text,
      }}
    >
      {children}
    </Text>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function BigButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { fs } = useProfile();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={[styles.bigButton, disabled && { opacity: 0.4 }]}
    >
      <Text style={{ color: colors.accentText, fontSize: fs(20), fontWeight: 'bold' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Option({
  label,
  selected,
  onPress,
  role = 'radio',
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  role?: 'radio' | 'checkbox';
}) {
  const { fs } = useProfile();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={role === 'radio' ? { selected } : { checked: selected }}
      style={[styles.option, selected && styles.optionOn]}
    >
      <Text
        style={{
          fontSize: fs(19),
          color: selected ? colors.accentText : colors.text,
          fontWeight: selected ? 'bold' : 'normal',
        }}
      >
        {(selected ? '✓  ' : '') + label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  bigButton: {
    minHeight: 64,
    backgroundColor: colors.accent,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 8,
  },
  option: {
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  optionOn: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
});