import { useEffect } from 'react';
import * as QuickActions from 'expo-quick-actions';

export function useSosShortcut(onSos: () => void) {
  useEffect(() => {
    let sub: { remove: () => void } | undefined;
    try {
      QuickActions.setItems([
        {
          id: 'sos',
          title: 'SOS emergency help',
          subtitle: 'Call or message for help',
          icon: 'symbol:exclamationmark.triangle',
        },
      ]);
      if (QuickActions.initial?.id === 'sos') onSos();
      sub = QuickActions.addListener((action) => {
        if (action?.id === 'sos') onSos();
      });
    } catch {
      // Shortcut is optional. The SOS button still works.
    }
    return () => sub?.remove();
  }, []);
}