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
import { colors, shadow } from '../theme';
import { useProfile } from '../ProfileContext';
import { ErrorBoundary } from '../ErrorBoundary';
import { ActionRow, BigButton, Card, IconBadge, TOP_PAD, TopBar } from '../ui';
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

  const statusPill = status ? (
    <View
      style={{
        backgroundColor: colors.accentSoft,
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginTop: 12,
      }}
    >
      <Text accessibilityLiveRegion="polite" style={{ fontSize: fs(16), color: colors.accent, fontWeight: '600' }}>
        {status}
      </Text>
    </View>
  ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, paddingTop: TOP_PAD, paddingBottom: 20 }}>
      <TopBar
        title="Camera"
        onBack={() => {
          stopSpeaking();
          onClose();
        }}
      />

      {!hasPermission ? (
        <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
          <IconBadge icon="camera-outline" tone="sage" size={76} />
          <Text
            style={{
              fontSize: fs(18),
              color: colors.text,
              lineHeight: fs(26),
              textAlign: 'center',
              marginTop: 18,
            }}
          >
            Saathi needs the camera to look around and read for you. The photo stays on your phone.
          </Text>
          <BigButton label="Allow camera" onPress={askPermission} />
        </Card>
      ) : !device ? (
        <Card>
          <Text style={{ fontSize: fs(18), color: colors.text }}>No camera was found on this phone.</Text>
        </Card>
      ) : uri ? (
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View
            style={{
              borderRadius: 28,
              overflow: 'hidden',
              backgroundColor: colors.card,
              marginBottom: 16,
              ...shadow,
            }}
          >
            <Image
              source={{ uri }}
              resizeMode="cover"
              accessibilityLabel="The photo you just took"
              style={{ height: 240, width: '100%' }}
            />
          </View>

          <ActionRow
            icon="eye-outline"
            tone="sage"
            title="What is around me?"
            subtitle="Describe objects and where they are"
            onPress={() => {
              if (!busy) lookAround();
            }}
          />
          <ActionRow
            icon="text-outline"
            tone="accent"
            title="Read text"
            subtitle="Read the printed words aloud"
            onPress={() => {
              if (!busy) readText();
            }}
          />

          {shown ? (
            <Card style={{ marginTop: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <IconBadge icon={seen ? 'eye-outline' : 'text-outline'} tone={seen ? 'sage' : 'accent'} size={40} />
                <Text style={{ fontSize: fs(18), fontWeight: '800', color: colors.text, marginLeft: 12 }}>
                  {seen ? 'What I see' : 'Text found'}
                </Text>
              </View>
              <Text selectable style={{ fontSize: fs(20), lineHeight: fs(29), color: colors.text }}>
                {shown}
              </Text>
              <BigButton
                label={speaking ? 'Stop speaking' : 'Say it again'}
                onPress={() => (speaking ? stopSpeaking() : speak(lastSpoken || shown))}
              />
            </Card>
          ) : null}

          {seen ? (
            <View style={{ marginBottom: 8 }}>
              {debug ? (
                <Text selectable style={{ fontSize: fs(13), color: colors.muted, marginBottom: 6 }}>
                  {debug}
                </Text>
              ) : null}
              <Text style={{ fontSize: fs(14), color: colors.muted, lineHeight: fs(21) }}>
                Saathi can miss things or get them wrong. It says where something is, not how far away. It does
                not replace a cane or a guide.
              </Text>
            </View>
          ) : null}

          {statusPill}

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
            style={{ flex: 1, borderRadius: 28, overflow: 'hidden', backgroundColor: '#0F172A', ...shadow }}
            accessibilityLabel="Camera view"
          >
            <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} outputs={[photoOutput]} />
            <View
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                position: 'absolute',
                top: 14,
                left: 14,
                right: 14,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  backgroundColor: 'rgba(15,23,42,0.6)',
                  borderRadius: 999,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ fontSize: fs(14), color: '#FFFFFF', fontWeight: '600' }}>
                  Hold steady and point at the text
                </Text>
              </View>
            </View>
          </View>
          {statusPill}
          <BigButton label="Take photo and read it aloud" onPress={snapAndRead} disabled={busy} />
          <BigButton label="Take photo" variant="secondary" onPress={takePhoto} disabled={busy} />
        </View>
      )}
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