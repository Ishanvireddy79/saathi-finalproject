import React, { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StatusBar, Text, View } from 'react-native';
import { colors, shadow } from './src/theme';
import { Glyph } from './src/ui';
import { refreshEmergencyCard } from './src/emergencyCard';
import { ProfileProvider, useProfile } from './src/ProfileContext';
import { ErrorBoundary } from './src/ErrorBoundary';
import Onboarding from './src/screens/Onboarding';
import Dashboard from './src/screens/Dashboard';
import Assistant from './src/screens/Assistant';
import Learn from './src/screens/Learn';
import Settings from './src/screens/Settings';
import SosScreen from './src/screens/SosScreen';
import { useSosShortcut } from './src/shortcuts';

type Tab = 'home' | 'assistant' | 'learn' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'assistant', label: 'Assistant', icon: 'chatbubble-ellipses' },
  { id: 'learn', label: 'Learn', icon: 'school' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

function TabButton({ tab, active, onPress }: { tab: (typeof TABS)[number]; active: boolean; onPress: () => void }) {
  const { fs } = useProfile();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: active }}
      style={{ flex: 1, minHeight: 68, alignItems: 'center', justifyContent: 'center' }}
    >
      <View
        style={{
          width: 56,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? colors.accentSoft : 'transparent',
        }}
      >
        <Glyph
          icon={active ? tab.icon : tab.icon + '-outline'}
          color={active ? colors.accent : colors.muted}
          size={24}
        />
      </View>
      <Text
        style={{
          fontSize: Math.min(fs(12), 16),
          marginTop: 2,
          color: active ? colors.accent : colors.muted,
          fontWeight: active ? '800' : '500',
        }}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}

function SosButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="SOS emergency help"
      style={({ pressed }) => ({
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: colors.sos,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -28,
        borderWidth: 5,
        borderColor: colors.card,
        transform: [{ scale: pressed ? 0.95 : 1 }],
        ...shadow,
        shadowColor: colors.sos,
        shadowOpacity: 0.4,
        elevation: 8,
      })}
    >
      <Text style={{ color: colors.sosText, fontSize: 22, fontWeight: '800' }}>SOS</Text>
    </Pressable>
  );
}

function Shell() {
  const { error } = useProfile();
  const [tab, setTab] = useState<Tab>('home');
  const [sosOpen, setSosOpen] = useState(false);
  useSosShortcut(() => setSosOpen(true));

  // Keep the lock-screen emergency card up to date when the app starts or is left.
  useEffect(() => {
    refreshEmergencyCard();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') refreshEmergencyCard();
    });
    return () => sub.remove();
  }, []);

  let screen: React.ReactNode = <Dashboard onNavigate={setTab} />;
  if (tab === 'assistant') screen = <Assistant />;
  if (tab === 'learn') screen = <Learn />;
  if (tab === 'settings') screen = <Settings />;

  const left = TABS.slice(0, 2);
  const right = TABS.slice(2);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {error ? (
        <Text style={{ backgroundColor: colors.sos, color: '#fff', padding: 10, paddingTop: 40, fontSize: 16 }}>
          {error}
        </Text>
      ) : null}
      <View style={{ flex: 1 }}>
        <ErrorBoundary key={tab} name={tab}>
          {screen}
        </ErrorBoundary>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.card,
          marginHorizontal: 14,
          marginBottom: 20,
          borderRadius: 32,
          paddingVertical: 4,
          ...shadow,
          shadowOpacity: 0.14,
          elevation: 10,
        }}
      >
        {left.map((t) => (
          <TabButton key={t.id} tab={t} active={tab === t.id} onPress={() => setTab(t.id)} />
        ))}
        <SosButton onPress={() => setSosOpen(true)} />
        {right.map((t) => (
          <TabButton key={t.id} tab={t} active={tab === t.id} onPress={() => setTab(t.id)} />
        ))}
      </View>
      <SosScreen visible={sosOpen} onClose={() => setSosOpen(false)} />
    </View>
  );
}

function Root() {
  const { loaded, profile } = useProfile();
  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }
  if (!profile.onboarded) {
    return (
      <ErrorBoundary name="Onboarding">
        <Onboarding />
      </ErrorBoundary>
    );
  }
  return <Shell />;
}

export default function App() {
  return (
    <ErrorBoundary name="Saathi">
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ProfileProvider>
        <Root />
      </ProfileProvider>
    </ErrorBoundary>
  );
}