import React, { useState } from 'react';
import { Modal, ScrollView, Text } from 'react-native';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import { colors } from '../theme';
import { useProfile } from '../ProfileContext';
import { ErrorBoundary } from '../ErrorBoundary';
import { BigButton, Body, Title } from '../ui';

function describe(list: any): string {
  try {
    if (!list || !list.length) return '(none reported)';
    return list
      .map((t: any, i: number) => {
        const shape = t && t.shape ? '[' + Array.from(t.shape).join(', ') + ']' : '(unknown)';
        return i + 1 + '. ' + (t?.name ?? 'unnamed') + '  type: ' + (t?.dataType ?? '?') + '  shape: ' + shape;
      })
      .join('\n');
  } catch (e: any) {
    return 'Could not read tensor info: ' + (e?.message ?? String(e));
  }
}

function Inner({ onClose }: { onClose: () => void }) {
  const { fs } = useProfile();
  const [report, setReport] = useState('');
  const [busy, setBusy] = useState(false);

  const check = async () => {
    try {
      setBusy(true);
      setReport('Loading the model...');
      const model: any = await loadTensorflowModel(
        require('../../assets/efficientdet_lite0.tflite'),
        []
      );
      setReport(
        'Model loaded.\n\nINPUTS\n' +
          describe(model.inputs) +
          '\n\nOUTPUTS\n' +
          describe(model.outputs)
      );
    } catch (e: any) {
      setReport('Could not load the model: ' + (e?.message ?? String(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 60 }}
    >
      <Title>Model check</Title>
      <Body muted>A test screen. It loads the object model and shows what it expects.</Body>
      <BigButton label="Load model" onPress={check} disabled={busy} />
      {report ? (
        <Text selectable style={{ fontSize: fs(16), color: colors.text, marginTop: 16 }}>
          {report}
        </Text>
      ) : null}
      <BigButton label="Close" onPress={onClose} />
    </ScrollView>
  );
}

export default function ModelCheck({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {visible ? (
        <ErrorBoundary name="Model check">
          <Inner onClose={onClose} />
        </ErrorBoundary>
      ) : null}
    </Modal>
  );
}