import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StatusBar, Text, View } from 'react-native';
import { colors } from './src/theme';
import { ProfileProvider, useProfile } from './src/ProfileContext';
import { ErrorBoundary } from './src/ErrorBoundary';
import Onboarding from './src/screens/Onboarding';
import Dashboard from './src/screens/Dashboard';
import Assistant from './src/screens/Assistant';
import Learn from './src/screens/Learn';
import Settings from './src/screens/Settings';

type Tab = 'home' | 'assistant' | 'learn' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'assistant', label: 'Assistant', icon: '💬' },
  { id: 'learn', label: 'Learn', icon: '📖' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

function TabButton({ tab, active, onPress }: { tab: (typeof TABS)[number]; active: boolean; onPress: () => void }) {
  const { fs } = useProfile();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: active }}
      style={{ flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontSize: 22 }}>{tab.icon}</Text>
      <Text
        style={{
          fontSize: Math.min(fs(12), 16),
          color: active ? colors.accent : colors.muted,
          fontWeight: active ? 'bold' : 'normal',
        }}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}

function SosButton() {
  return (
    <Pressable
      onPress={() => Alert.alert('SOS', 'Emergency help will be connected in the next step.')}
      accessibilityRole="button"
      accessibilityLabel="SOS emergency help"
      style={{
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: colors.sos,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -24,
        borderWidth: 4,
        borderColor: colors.bg,
      }}
    >
      <Text style={{ color: colors.sosText, fontSize: 22, fontWeight: 'bold' }}>SOS</Text>
    </Pressable>
  );
}

function Shell() {
  const { error } = useProfile();
  const [tab, setTab] = useState<Tab>('home');

  let screen: React.ReactNode = <Dashboard />;
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
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 24,
        }}
      >
        {left.map((t) => (
          <TabButton key={t.id} tab={t} active={tab === t.id} onPress={() => setTab(t.id)} />
        ))}
        <SosButton />
        {right.map((t) => (
          <TabButton key={t.id} tab={t} active={tab === t.id} onPress={() => setTab(t.id)} />
        ))}
      </View>
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