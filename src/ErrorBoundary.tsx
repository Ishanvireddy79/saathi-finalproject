import React from 'react';
import { ScrollView, Text } from 'react-native';
import { colors } from './theme';

type Props = { children: React.ReactNode; name?: string };
type State = { message: string };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { message: '' };

  static getDerivedStateFromError(error: any): State {
    return { message: error?.message ?? String(error) };
  }

  render() {
    if (this.state.message) {
      return (
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.bg }}
          contentContainerStyle={{ padding: 24, paddingTop: 64 }}
        >
          <Text
            accessibilityRole="header"
            style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 12 }}
          >
            Something went wrong
          </Text>
          <Text style={{ fontSize: 18, color: colors.text, marginBottom: 12 }}>
            {this.props.name ? this.props.name + ' has a problem. ' : ''}
            The rest of the app still works. Please tell the developer this message:
          </Text>
          <Text style={{ fontSize: 16, color: colors.sos }} selectable>
            {this.state.message}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}