import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, shadow } from './theme';
import { useProfile } from './ProfileContext';
import { Ionicons } from '@expo/vector-icons';

// Space at the top of a screen, clear of the status bar.
export const TOP_PAD = Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 24) + 16;

export type Tone = 'accent' | 'sage' | 'sos' | 'amber';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  accent: { bg: colors.accentSoft, fg: colors.accent },
  sage: { bg: colors.sageSoft, fg: colors.sage },
  sos: { bg: colors.sosSoft, fg: colors.sos },
  amber: { bg: colors.amberSoft, fg: colors.amber },
};

// Maps the emoji used across the app to clean line icons.
// Icon names (like "globe-outline") also work directly.
const RAW_ICONS: Record<string, string> = {
  '💬': 'chatbubble-ellipses',
  '👁': 'eye',
  '👂': 'ear',
  '🩺': 'medkit',
  '🆘': 'alert-circle',
  '📞': 'call',
  '🧠': 'bulb',
  '🚨': 'warning',
  '🩹': 'bandage',
  '✋': 'hand-left',
  '📅': 'calendar',
  '💊': 'medical',
  '🔔': 'notifications',
  '📆': 'calendar-outline',
  '⏰': 'alarm',
  '🧪': 'flask',
  '📌': 'pin',
  '🙂': 'person',
  '⚠': 'warning',
  '🏥': 'business',
  '🚑': 'car',
  '👮': 'shield',
  '😣': 'sad',
  '⬇': 'arrow-down-circle',
  '🩸': 'water',
  '😮‍💨': 'cloud',
  '🫀': 'heart',
  '🤕': 'bandage',
  '✅': 'checkmark-circle',
  '❌': 'close-circle',
  '🪪': 'id-card',
  '💧': 'water',
  '❓': 'help-circle',
  '🧑‍⚕️': 'medkit',
};
const ICONS: Record<string, string> = {};
for (const k of Object.keys(RAW_ICONS)) ICONS[k.replace(/\uFE0F/g, '')] = RAW_ICONS[k];

export function Glyph({ icon, color, size }: { icon: string; color: string; size: number }) {
  const clean = icon.replace(/\uFE0F/g, '');
  const name = ICONS[clean] ?? (/^[a-z][a-z0-9-]*$/.test(icon) ? icon : undefined);
  if (name) return <Ionicons name={name as any} size={size} color={color} />;
  return <Text style={{ fontSize: size, fontWeight: '800', color }}>{icon}</Text>;
}

/* ---------- Text ---------- */

export function Title({ children }: { children: React.ReactNode }) {
  const { fs } = useProfile();
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontSize: fs(30),
        fontWeight: '800',
        letterSpacing: -0.4,
        color: colors.text,
        marginBottom: 12,
      }}
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
        lineHeight: fs(27),
        color: muted ? colors.muted : colors.text,
      }}
    >
      {children}
    </Text>
  );
}

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { fs } = useProfile();
  return (
    <View style={{ marginBottom: 20 }}>
      <Text
        accessibilityRole="header"
        style={{ fontSize: fs(34), fontWeight: '800', letterSpacing: -0.6, color: colors.text }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ fontSize: fs(17), color: colors.muted, marginTop: 4, lineHeight: fs(24) }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  const { fs } = useProfile();
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontSize: fs(13),
        fontWeight: '800',
        letterSpacing: 1,
        color: colors.muted,
        textTransform: 'uppercase',
        marginTop: 12,
        marginBottom: 10,
      }}
    >
      {children}
    </Text>
  );
}

/* ---------- Containers ---------- */

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function IconBadge({ icon, tone = 'accent', size = 52 }: { icon: string; tone?: Tone; size?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.34,
        backgroundColor: TONES[tone].bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Glyph icon={icon} color={TONES[tone].fg} size={size * 0.5} />
    </View>
  );
}

export function TileGrid({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>{children}</View>;
}

// A square-ish button with an icon, for feature shortcuts.
export function Tile({
  icon,
  title,
  subtitle,
  onPress,
  tone = 'accent',
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  tone?: Tone;
}) {
  const { fs } = useProfile();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? title + '. ' + subtitle : title}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <IconBadge icon={icon} tone={tone} />
      <Text style={{ fontSize: fs(18), fontWeight: '700', color: colors.text, marginTop: 14 }}>{title}</Text>
      {subtitle ? (
        <Text style={{ fontSize: fs(14), color: colors.muted, marginTop: 2, lineHeight: fs(20) }}>{subtitle}</Text>
      ) : null}
    </Pressable>
  );
}

// A full-width button row with an icon. "solid" makes it a red emergency button.
export function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
  tone = 'accent',
  solid,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  tone?: Tone;
  solid?: boolean;
}) {
  const { fs } = useProfile();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? title + '. ' + subtitle : title}
      style={({ pressed }) => [
        styles.actionRow,
        solid && { backgroundColor: colors.sos, borderColor: colors.sos },
        pressed && styles.pressed,
      ]}
    >
      {solid ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            width: 52,
            height: 52,
            borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Glyph icon={icon} color={colors.sosText} size={26} />
        </View>
      ) : (
        <IconBadge icon={icon} tone={tone} />
      )}
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ fontSize: fs(19), fontWeight: '700', color: solid ? colors.sosText : colors.text }}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontSize: fs(14),
              marginTop: 2,
              lineHeight: fs(20),
              color: solid ? 'rgba(255,255,255,0.92)' : colors.muted,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={22} color={solid ? colors.sosText : colors.muted} />
    </Pressable>
  );
}

export function ProgressBar({ value, max, tone = 'accent' }: { value: number; max: number; tone?: Tone }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ height: 10, borderRadius: 5, backgroundColor: colors.track, overflow: 'hidden' }}
    >
      <View
        style={{
          width: (pct + '%') as `${number}%`,
          height: 10,
          borderRadius: 5,
          backgroundColor: TONES[tone].fg,
        }}
      />
    </View>
  );
}

/* ---------- Controls ---------- */

type Variant = 'primary' | 'secondary' | 'danger';

// Picks a button style from its label so every screen gets a clear hierarchy.
function inferVariant(label: string): Variant {
  if (/^(call 112|stop|reset app)/i.test(label)) return 'danger';
  if (/^(close|clear|cancel|back|take another)/i.test(label)) return 'secondary';
  return 'primary';
}

export function BigButton({
  label,
  onPress,
  disabled,
  variant,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: Variant;
}) {
  const { fs } = useProfile();
  const v = variant ?? inferVariant(label);
  const textColor = v === 'secondary' ? colors.accent : v === 'danger' ? colors.sosText : colors.accentText;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.bigButton,
        v === 'primary' && { backgroundColor: colors.accent },
        v === 'danger' && { backgroundColor: colors.sos },
        v === 'secondary' && styles.secondary,
        pressed && styles.pressed,
        disabled && { opacity: 0.4 },
      ]}
    >
      <Text style={{ color: textColor, fontSize: fs(20), fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

// Choose one of a few short options, shown as a single rounded strip.
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { fs } = useProfile();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={{ flexDirection: 'row', backgroundColor: colors.track, borderRadius: 20, padding: 4 }}
    >
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="radio"
            accessibilityLabel={o.label}
            accessibilityState={{ selected: on }}
            style={[
              {
                flex: 1,
                minHeight: 56,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4,
              },
              on && { backgroundColor: colors.card, ...shadow },
            ]}
          >
            <Text
              style={{
                fontSize: fs(16),
                fontWeight: on ? '800' : '500',
                color: on ? colors.accent : colors.muted,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// A row with a label, an optional description and an on/off switch.
export function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { fs } = useProfile();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={description ? label + '. ' + description : label}
      accessibilityState={{ checked: value }}
      style={({ pressed }) => [
        { flexDirection: 'row', alignItems: 'center', minHeight: 72, paddingVertical: 8 },
        pressed && { opacity: 0.8 },
      ]}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ fontSize: fs(18), fontWeight: '700', color: colors.text }}>{label}</Text>
        {description ? (
          <Text style={{ fontSize: fs(14), color: colors.muted, marginTop: 2, lineHeight: fs(20) }}>
            {description}
          </Text>
        ) : null}
      </View>
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Switch
          value={value}
          onValueChange={() => {}}
          trackColor={{ false: '#CBD5E1', true: colors.sage }}
          thumbColor="#FFFFFF"
        />
      </View>
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
      style={({ pressed }) => [styles.option, selected && styles.optionOn, pressed && styles.pressed]}
    >
      <Text
        style={{
          fontSize: fs(19),
          color: selected ? colors.accentText : colors.text,
          fontWeight: selected ? '700' : '400',
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
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 16,
    ...shadow,
  },
  tile: {
    width: '48%',
    minHeight: 150,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 14,
    ...shadow,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 84,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    ...shadow,
  },
  bigButton: {
    minHeight: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 10,
    ...shadow,
  },
  secondary: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.accent,
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  option: {
    minHeight: 64,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  optionOn: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
});

/* ---------- Style components ---------- */

// Soft pastel shapes behind the top of a screen.
export function Backdrop() {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360, overflow: 'hidden' }}
    >
      <View
        style={{
          position: 'absolute',
          top: -90,
          right: -70,
          width: 270,
          height: 270,
          borderRadius: 135,
          backgroundColor: colors.lavender,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 70,
          left: -110,
          width: 250,
          height: 250,
          borderRadius: 125,
          backgroundColor: colors.peach,
          opacity: 0.45,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: -50,
          left: 90,
          width: 170,
          height: 170,
          borderRadius: 85,
          backgroundColor: colors.skySoft,
          opacity: 0.55,
        }}
      />
    </View>
  );
}

export function Avatar({ label, tone = 'accent', size = 56 }: { label: string; tone?: Tone; size?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: TONES[tone].bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: colors.card,
        ...shadow,
      }}
    >
      <Glyph icon={label} color={TONES[tone].fg} size={size * 0.42} />
    </View>
  );
}

export function Chip({ label, tone = 'accent' }: { label: string; tone?: Tone }) {
  const { fs } = useProfile();
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: TONES[tone].bg,
      }}
    >
      <Text style={{ fontSize: fs(13), fontWeight: '700', color: TONES[tone].fg }}>{label}</Text>
    </View>
  );
}

// A search-bar look-alike button.
export function SearchPill({ text, label, onPress }: { text: string; label: string; onPress: () => void }) {
  const { fs } = useProfile();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 56,
          borderRadius: 28,
          paddingHorizontal: 20,
          backgroundColor: colors.card,
          marginBottom: 16,
          ...shadow,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={{ marginRight: 10 }}>
        <Ionicons name="search" size={22} color={colors.muted} />
      </View>
      <Text style={{ fontSize: fs(17), color: colors.muted, flex: 1 }}>{text}</Text>
    </Pressable>
  );
}

// Two or three pill tabs. The chosen one is filled.
export function PillTabs<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { fs } = useProfile();
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={{ flexDirection: 'row', marginBottom: 18 }}>
      {options.map((o, i) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="tab"
            accessibilityLabel={o.label}
            accessibilityState={{ selected: on }}
            style={[
              {
                flex: 1,
                minHeight: 52,
                borderRadius: 26,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: i < options.length - 1 ? 10 : 0,
                backgroundColor: on ? colors.accent : colors.card,
                borderWidth: on ? 0 : 1.5,
                borderColor: colors.border,
              },
              on && shadow,
            ]}
          >
            <Text style={{ fontSize: fs(16), fontWeight: '700', color: on ? colors.accentText : colors.text }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// A round icon shortcut with a label underneath.
export function RoundAction({
  icon,
  label,
  tone = 'accent',
  onPress,
}: {
  icon: string;
  label: string;
  tone?: Tone;
  onPress: () => void;
}) {
  const { fs } = useProfile();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [{ width: '25%', alignItems: 'center', paddingVertical: 6 }, pressed && styles.pressed]}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          width: 68,
          height: 68,
          borderRadius: 34,
          backgroundColor: TONES[tone].bg,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadow,
        }}
      >
        <Glyph icon={icon} color={TONES[tone].fg} size={30} />
      </View>
      <Text
        style={{
          fontSize: fs(14),
          fontWeight: '700',
          color: colors.text,
          marginTop: 8,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ---------- Screen furniture (top bar, date strip, time chips, bottom button) ---------- */

export function TopBar({
  title,
  onBack,
  rightIcon,
  rightLabel,
  onRight,
}: {
  title: string;
  onBack: () => void;
  rightIcon?: string;
  rightLabel?: string;
  onRight?: () => void;
}) {
  const { fs } = useProfile();
  const circle = {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  } as const;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={circle}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>
      <Text accessibilityRole="header" style={{ fontSize: fs(20), fontWeight: '800', color: colors.text }}>
        {title}
      </Text>
      {rightIcon && onRight ? (
        <Pressable onPress={onRight} accessibilityRole="button" accessibilityLabel={rightLabel ?? 'Action'} style={circle}>
          <Glyph icon={rightIcon} color={colors.text} size={22} />
        </Pressable>
      ) : (
        <View style={{ width: 48 }} />
      )}
    </View>
  );
}

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const { fs } = useProfile();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <Text
        accessibilityRole="header"
        style={{ fontSize: fs(20), fontWeight: '800', letterSpacing: -0.2, color: colors.text, flex: 1 }}
      >
        {title}
      </Text>
      {action && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={action + ': ' + title}
          style={{ minHeight: 44, justifyContent: 'center', paddingLeft: 12 }}
        >
          <Text style={{ fontSize: fs(15), fontWeight: '700', color: colors.accent }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export type DayItem = { key: string; dow: string; num: number };

// A row of days to pick from, like a calendar strip.
export function DateStrip({
  days,
  selected,
  onSelect,
}: {
  days: DayItem[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  const { fs } = useProfile();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -20 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 6 }}
    >
      {days.map((d) => {
        const on = d.key === selected;
        return (
          <Pressable
            key={d.key}
            onPress={() => onSelect(d.key)}
            accessibilityRole="button"
            accessibilityLabel={d.dow + ' ' + d.num}
            accessibilityState={{ selected: on }}
            style={[
              {
                width: 64,
                height: 88,
                marginRight: 10,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? colors.accent : colors.card,
                borderWidth: on ? 0 : 1,
                borderColor: colors.border,
              },
              on && shadow,
            ]}
          >
            <Text style={{ fontSize: fs(14), fontWeight: '600', color: on ? colors.accentText : colors.muted }}>
              {d.dow}
            </Text>
            <Text style={{ fontSize: fs(24), fontWeight: '800', marginTop: 4, color: on ? colors.accentText : colors.text }}>
              {d.num}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export type SlotItem = { key: string; label: string };

// A grid of time buttons.
export function TimeChips({
  slots,
  selected,
  onSelect,
}: {
  slots: SlotItem[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  const { fs } = useProfile();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
      {slots.map((s) => {
        const on = s.key === selected;
        return (
          <Pressable
            key={s.key}
            onPress={() => onSelect(s.key)}
            accessibilityRole="button"
            accessibilityLabel={s.label}
            accessibilityState={{ selected: on }}
            style={{
              width: '31.5%',
              minHeight: 52,
              marginBottom: 10,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? colors.accent : colors.card,
              borderWidth: on ? 0 : 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: fs(15), fontWeight: '700', color: on ? colors.accentText : colors.text }}>
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// A choice card with an icon, like the appointment type cards.
export function TypeCard({
  icon,
  title,
  subtitle,
  selected,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { fs } = useProfile();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={subtitle ? title + '. ' + subtitle : title}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 80,
          backgroundColor: colors.card,
          borderRadius: 24,
          padding: 14,
          marginBottom: 12,
          borderWidth: 2,
          borderColor: selected ? colors.accent : 'transparent',
          ...shadow,
        },
        pressed && styles.pressed,
      ]}
    >
      <IconBadge icon={icon} tone={selected ? 'accent' : 'sage'} size={48} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ fontSize: fs(17), fontWeight: '700', color: colors.text }}>{title}</Text>
        {subtitle ? (
          <Text style={{ fontSize: fs(14), color: colors.muted, marginTop: 2 }}>{subtitle}</Text>
        ) : null}
      </View>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          borderWidth: 2,
          borderColor: selected ? colors.accent : colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent }} /> : null}
      </View>
    </Pressable>
  );
}

// The big button fixed at the bottom of a screen.
export function BottomCTA({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 22,
        backgroundColor: colors.card,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        ...shadow,
        shadowOffset: { width: 0, height: -4 },
        elevation: 12,
      }}
    >
      <BigButton label={label} onPress={onPress} disabled={disabled} variant="primary" />
    </View>
  );
}

/* ---------- Settings-style grouped lists ---------- */

// A white rounded block that holds a few rows.
export function Group({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 18,
        ...shadow,
      }}
    >
      {children}
    </View>
  );
}

// A tappable row with an icon, a title, an optional value and an arrow.
export function Row({
  icon,
  tone = 'accent',
  title,
  value,
  onPress,
  danger,
  last,
}: {
  icon: string;
  tone?: Tone;
  title: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  const { fs } = useProfile();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? title + ', ' + value : title}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 68,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        pressed && { backgroundColor: colors.bg },
      ]}
    >
      <IconBadge icon={icon} tone={danger ? 'sos' : tone} size={42} />
      <Text
        style={{
          flex: 1,
          marginLeft: 14,
          fontSize: fs(17),
          fontWeight: '600',
          color: danger ? colors.sos : colors.text,
        }}
      >
        {title}
      </Text>
      {value ? (
        <Text style={{ fontSize: fs(15), color: colors.muted, marginRight: 6 }}>{value}</Text>
      ) : null}
      {danger ? null : <Ionicons name="chevron-forward" size={20} color={colors.muted} />}
    </Pressable>
  );
}

// A row with an icon, a title, a short description and an on/off switch.
export function SwitchRow({
  icon,
  tone = 'accent',
  title,
  description,
  value,
  onChange,
  last,
}: {
  icon: string;
  tone?: Tone;
  title: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  const { fs } = useProfile();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={description ? title + '. ' + description : title}
      accessibilityState={{ checked: value }}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 76,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        pressed && { backgroundColor: colors.bg },
      ]}
    >
      <IconBadge icon={icon} tone={tone} size={42} />
      <View style={{ flex: 1, marginLeft: 14, paddingRight: 10 }}>
        <Text style={{ fontSize: fs(17), fontWeight: '600', color: colors.text }}>{title}</Text>
        {description ? (
          <Text style={{ fontSize: fs(13), color: colors.muted, marginTop: 2, lineHeight: fs(19) }}>
            {description}
          </Text>
        ) : null}
      </View>
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Switch
          value={value}
          onValueChange={() => {}}
          trackColor={{ false: '#CBD5E1', true: colors.accent }}
          thumbColor="#FFFFFF"
        />
      </View>
    </Pressable>
  );
}

// A row used in a list of choices; the chosen one shows a tick.
export function ChoiceRow({
  title,
  description,
  selected,
  onPress,
  last,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  last?: boolean;
}) {
  const { fs } = useProfile();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={description ? title + '. ' + description : title}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 68,
          paddingHorizontal: 18,
          paddingVertical: 10,
          borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        pressed && { backgroundColor: colors.bg },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: fs(18), fontWeight: selected ? '700' : '500', color: colors.text }}>{title}</Text>
        {description ? (
          <Text style={{ fontSize: fs(14), color: colors.muted, marginTop: 2 }}>{description}</Text>
        ) : null}
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={26} color={colors.accent} /> : null}
    </Pressable>
  );
}

// A full-screen page with a back button, used for settings sub-pages.
export function SheetModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingTop: TOP_PAD, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <TopBar title={title} onBack={onClose} />
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}