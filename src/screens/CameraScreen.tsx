import React, { useState } from 'react';
import { Image, Modal, StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';
import { colors } from '../theme';
import { useProfile } from '../ProfileContext';
import { ErrorBoundary } from '../ErrorBoundary';
import { BigButton, Body, Title } from '../ui';

function CameraInner({ onClose }: { onClose: () => void }) {
  const { fs } = useProfile();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const photoOutput = usePhotoOutput();
  const [status, setStatus] = useState('');
  const [uri, setUri] = useState('');

  const takePhoto = async () => {
    try {
      setStatus('Taking photo...');
      const photo = await photoOutput.capturePhoto({}, {});
      try {
        const path = await photo.saveToTemporaryFileAsync();
        setUri(path.startsWith('file://') ? path : 'file://' + path);
        setStatus('Photo taken.');
      } finally {
        photo.dispose();
      }
    } catch (e: any) {
      setStatus('Could not take photo: ' + (e?.message ?? String(e)));
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
      <Title>Camera</Title>

      {!hasPermission ? (
        <View>
          <Body>Saathi needs the camera to look around for you. The photo stays on your phone.</Body>
          <BigButton label="Allow camera" onPress={askPermission} />
        </View>
      ) : !device ? (
        <Body>No camera was found on this phone.</Body>
      ) : uri ? (
        <View style={{ flex: 1 }}>
          <Image
            source={{ uri }}
            resizeMode="contain"
            accessibilityLabel="The photo you just took"
            style={{ flex: 1, borderRadius: 16 }}
          />
          <BigButton
            label="Take another photo"
            onPress={() => {
              setUri('');
              setStatus('');
            }}
          />
        </View>
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