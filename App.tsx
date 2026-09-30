import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function App() {
  const [status, setStatus] = useState('App is running.');
  const [taps, setTaps] = useState(0);

  const onTap = () => {
    try {
      const next = taps + 1;
      setTaps(next);
      setStatus('Button works. Taps: ' + next);
    } catch (e: any) {
      setStatus('Error: ' + (e?.message ?? String(e)));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Hello Saathi
      </Text>
      <Text style={styles.status} accessibilityLiveRegion="polite">
        {status}
      </Text>
      <Pressable
        style={styles.button}
        onPress={onTap}
        accessibilityRole="button"
        accessibilityLabel="Test button"
      >
        <Text style={styles.buttonText}>Tap me</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { color: '#FFFFFF', fontSize: 36, fontWeight: 'bold', marginBottom: 16 },
  status: { color: '#FFD400', fontSize: 20, marginBottom: 32, textAlign: 'center' },
  button: {
    minHeight: 64,
    minWidth: 200,
    backgroundColor: '#FFD400',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttonText: { color: '#000000', fontSize: 22, fontWeight: 'bold' },
});