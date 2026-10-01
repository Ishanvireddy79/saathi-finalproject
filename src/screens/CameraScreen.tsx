import React, { useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { colors } from '../theme';
import { useProfile } from '../ProfileContext';
import { ErrorBoundary } from '../ErrorBoundary';
import { BigButton, Body, Card, Title } from '../ui';

function CameraInner({ onClose }: { onClose: () => void }) {
  const { fs } = useProfile();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const photoOutput = usePhotoOutput();
  const [status, setStatus] = useState('');
  const [uri, setUri] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const takePhoto = async () => {
    try {
      setStatus('Taking photo...');
      const photo = await (photoOutput as any).capturePhoto({}, {});
      try {
        const path = await photo.saveToTemporaryFileAsync();
        setUri(path.startsWith('file://') ? path : 'file://' + path);
        setText('');
        setStatus('Photo taken.');
      } finally {
        photo.dispose();
      }
    } catch (e: any) {
      setStatus('Could not take photo: ' + (e?.message ?? String(e)));
    }
  };

  const readText = async () => {
    try {
      setBusy(true);
      setStatus('Reading the text...');
      const result = await TextRecognition.recognize(uri);
      const t = (result?.text ?? '').trim();
      setText(t);
      setStatus(
        t
          ? 'Done.'
          : 'No text found. Try again with more light and hold the phone steady.'
      );
    } catch (e: any) {
      setStatus('Could not read text: ' + (e?.message ?? String(e)));
    } finally {
      setBusy(false);
    }
  };

  const askPermission = async () => {
    try {
      const ok = await requestPermission();
      setStatus(ok ? '' : 'Camera permission was not given. Please allow it in phone Settings.');
    } catch (e: any) {
      setStatus('Permission error: ' + (e?.message ?? String(e)));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 20, paddingTop: 56 }}>
      <Title>Read text</Title>

      {!hasPermission ? (
        <View>
          <Body>Saathi needs the camera to look at text for you. The photo stays on your phone.</Body>
          <BigButton label="Allow camera" onPress={askPermission} />
        </View>
      ) : !device ? (
        <Body>No camera was found on this phone.</Body>
      ) : uri ? (
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          <Image
            source={{ uri }}
            resizeMode="contain"
            accessibilityLabel="The photo you just took"
            style={{ height: 240, borderRadius: 16 }}
          />
          <BigButton label="Read text" onPress={readText} disabled={busy} />
          {text ? (
            <Card style={{ marginTop: 12 }}>
              <Text
                selectable
                style={{ fontSize: fs(20), lineHeight: fs(28), color: colors.text }}
              >
                {text}
              </Text>
            </Card>
          ) : null}
          <BigButton
            label="Take another photo"
            onPress={() => {
              setUri('');
              setText('');
              setStatus('');
            }}
          />
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}>
            <Camera
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={true}
              outputs={[photoOutput]}
            />
          </View>
          <BigButton label="Take photo" onPress={takePhoto} />
        </View>
      )}

      {status ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{ fontSize: fs(18), color: colors.accent, marginTop: 12 }}
        >
          {status}
        </Text>
      ) : null}

      <BigButton label="Close" onPress={onClose} />
    </View>
  );
}

export default function CameraScreen({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {visible ? (
        <ErrorBoundary name="Camera">
          <CameraInner onClose={onClose} />
        </ErrorBoundary>
      ) : null}
    </Modal>
  );
}