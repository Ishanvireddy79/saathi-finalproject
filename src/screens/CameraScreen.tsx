import React, { useEffect, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import * as Speech from 'expo-speech';
import { colors } from '../theme';
import { useProfile } from '../ProfileContext';
import { ErrorBoundary } from '../ErrorBoundary';
import { BigButton, Body, Card, Title } from '../ui';
import { describeSurroundings } from '../detect';

function CameraInner({ onClose }: { onClose: () => void }) {
  const { fs } = useProfile();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const photoOutput = usePhotoOutput();
  const [status, setStatus] = useState('');
  const [uri, setUri] = useState('');
  const [text, setText] = useState('');
  const [seen, setSeen] = useState('');
  const [debug, setDebug] = useState('');
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [lastSpoken, setLastSpoken] = useState('');

  useEffect(() => {
    return () => {
      try {
        Speech.stop();
      } catch {
        // Nothing to stop.
      }
    };
  }, []);

  const stopSpeaking = () => {
    try {
      Speech.stop();
    } catch {
      // Nothing to stop.
    }
    setSpeaking(false);
  };

  const speak = (t: string) => {
    try {
      Speech.stop();
      setSpeaking(true);
      setLastSpoken(t);
      Speech.speak(t, {
        language: 'en-IN',
        rate: 0.9,
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: (e: any) => {
          setSpeaking(false);
          setStatus('Could not speak: ' + (e?.message ?? String(e)));
        },
      });
    } catch (e: any) {
      setSpeaking(false);
      setStatus('Could not speak: ' + (e?.message ?? String(e)));
    }
  };

  const clearResults = () => {
    setText('');
    setSeen('');
    setDebug('');
  };

  // Takes a photo and returns its file path.
  const capture = async (): Promise<string> => {
    const photo = await (photoOutput as any).capturePhoto({}, {});
    try {
      const path = await photo.saveToTemporaryFileAsync();
      return path.startsWith('file://') ? path : 'file://' + path;
    } finally {
      photo.dispose();
    }
  };

  const takePhoto = async () => {
    try {
      stopSpeaking();
      setStatus('Taking photo...');
      const path = await capture();
      setUri(path);
      clearResults();
      setStatus('Photo taken.');
    } catch (e: any) {
      setStatus('Could not take photo: ' + (e?.message ?? String(e)));
    }
  };

  const readText = async (photoUri: string = uri) => {
    try {
      setBusy(true);
      stopSpeaking();
      clearResults();
      setStatus('Reading the text...');
      const result = await TextRecognition.recognize(photoUri);
      const t = (result?.text ?? '').trim();
      setText(t);
      if (t) {
        setStatus('Reading it aloud.');
        speak(t);
      } else {
        setStatus('No text found. Try again with more light and hold the phone steady.');
        speak('No text found. Try again with more light.');
      }
    } catch (e: any) {
      setStatus('Could not read text: ' + (e?.message ?? String(e)));
    } finally {
      setBusy(false);
    }
  };

  // One tap for people who cannot see the screen: take a photo, then read it aloud.
  const snapAndRead = async () => {
    try {
      setBusy(true);
      stopSpeaking();
      setStatus('Taking photo...');
      const path = await capture();
      setUri(path);
      await readText(path);
    } catch (e: any) {
      setBusy(false);
      setStatus('Could not take photo: ' + (e?.message ?? String(e)));
      speak('Could not take the photo. Please try again.');
    }
  };

  const lookAround = async () => {
    try {
      setBusy(true);
      stopSpeaking();
      clearResults();
      const r = await describeSurroundings(uri, setStatus);
      setSeen(r.sentence);
      setDebug(r.debug);
      setStatus('Done.');
      speak(r.sentence);
    } catch (e: any) {
      setStatus('Could not look around: ' + (e?.message ?? String(e)));
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

  const shown = seen || text;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 20, paddingTop: 56 }}>
      <Title>Camera</Title>

      {!hasPermission ? (
        <View>
          <Body>Saathi needs the camera to look around and read for you. The photo stays on your phone.</Body>
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
            style={{ height: 220, borderRadius: 16 }}
          />
          <BigButton label="What is around me?" onPress={lookAround} disabled={busy} />
          <BigButton label="Read text" onPress={() => readText()} disabled={busy} />
          {shown ? (
            <>
              <BigButton
                label={speaking ? 'Stop speaking' : 'Say it again'}
                onPress={() => (speaking ? stopSpeaking() : speak(lastSpoken || shown))}
              />
              <Card style={{ marginTop: 12 }}>
                <Text
                  selectable
                  style={{ fontSize: fs(20), lineHeight: fs(28), color: colors.text }}
                >
                  {shown}
                </Text>
              </Card>
            </>
          ) : null}
          {seen ? (
            <>
              {debug ? (
                <Text selectable style={{ fontSize: fs(14), color: colors.muted, marginTop: 4 }}>
                  {debug}
                </Text>
              ) : null}
              <Body muted>
                Saathi can miss things or get them wrong. It says where something is, not how far
                away. It does not replace a cane or a guide.
              </Body>
            </>
          ) : null}
          <BigButton
            label="Take another photo"
            onPress={() => {
              stopSpeaking();
              setUri('');
              clearResults();
              setStatus('');
            }}
          />
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <View
            style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}
            accessibilityLabel="Camera view"
          >
            <Camera
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={true}
              outputs={[photoOutput]}
            />
          </View>
          <BigButton label="Take photo and read it aloud" onPress={snapAndRead} disabled={busy} />
          <BigButton label="Take photo" onPress={takePhoto} disabled={busy} />
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

      <BigButton
        label="Close"
        onPress={() => {
          stopSpeaking();
          onClose();
        }}
      />
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