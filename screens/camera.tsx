import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import React, { useRef, useState, useCallback } from 'react';
import {
  Camera as VisionCamera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useIsFocused } from '@react-navigation/native';

const PermissionPage = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Camera permission is required.</Text>
  </View>
);

const NoCameraDeviceError = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>No camera device found.</Text>
  </View>
);

async function hasAndroidPermission() {
  const getCheckPermissionPromise = () => {
    if (Platform.Version >= '33') {
      return Promise.all([
        PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        ),
        PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        ),
      ]).then(
        ([hasReadMediaImagesPermission, hasReadMediaVideoPermission]) =>
          hasReadMediaImagesPermission && hasReadMediaVideoPermission,
      );
    } else {
      return PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      );
    }
  };

  const hasPermission = await getCheckPermissionPromise();
  if (hasPermission) {
    return true;
  }
  const getRequestPermissionPromise = () => {
    if (Platform.Version >= '33') {
      return PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
      ]).then(
        statuses =>
          statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] ===
            PermissionsAndroid.RESULTS.GRANTED,
      );
    } else {
      return PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ).then(status => status === PermissionsAndroid.RESULTS.GRANTED);
    }
  };

  return await getRequestPermissionPromise();
}

async function savePicture(
  tag: string,
  type: 'photo' | 'video' = 'photo',
  album?: string,
) {
  if (Platform.OS === 'android' && !(await hasAndroidPermission())) {
    return;
  }
  await CameraRoll.save(tag, { type, album });
}

export default function Camera() {
  const device = useCameraDevice('back');
  const { hasPermission } = useCameraPermission();
  const cameraRef = useRef<VisionCamera>(null);
  const [captureSuccess, setCaptureSuccess] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const isFocused = useIsFocused();

  const takePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePhoto();
      if (photo?.path) {
        await savePicture(photo.path, 'photo');
        setCaptureSuccess(true);
        setTimeout(() => setCaptureSuccess(false), 2000); // Hide after 2s
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
    }
  };

  const startVideoRecording = useCallback(async () => {
    if (cameraRef.current && !isRecording) {
      setIsRecording(true);
      cameraRef.current.startRecording({
        onRecordingFinished: async video => {
          await savePicture(video.path, 'video');
          setIsRecording(false);
          setCaptureSuccess(true);
          setTimeout(() => setCaptureSuccess(false), 2000);
        },
        onRecordingError: error => {
          console.error('Recording error:', error);
          setIsRecording(false);
        },
      });
    }
  }, [isRecording]);

  const stopVideoRecording = useCallback(() => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  }, [isRecording]);

  if (!hasPermission) return <PermissionPage />;
  if (device == null) return <NoCameraDeviceError />;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.hamburger}
          onPress={() => navigation.openDrawer()}
          accessibilityLabel="Open drawer menu"
        >
          <View style={styles.bar} />
          <View style={styles.bar} />
          <View style={styles.bar} />
        </TouchableOpacity>
        <Text style={styles.title}>Pokédex</Text>
        {/* To make things even */}
        <TouchableOpacity style={styles.hamburger}></TouchableOpacity>
      </View>
      <View style={{ flex: 1 }}>
        <VisionCamera
          ref={cameraRef}
          style={{ flex: 1 }}
          device={device}
          isActive={isFocused} // <-- Only active when screen is focused
          photo={true}
          video={true}
          audio={true}
        />
        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.captureButton,
              isRecording && { backgroundColor: 'red' },
            ]}
            onPress={isRecording ? stopVideoRecording : takePhoto}
            onLongPress={startVideoRecording}
          >
            <Text style={styles.captureText}>{isRecording ? '■' : '●'}</Text>
          </TouchableOpacity>
          <Text style={{ marginTop: 10, color: '#fff' }}>
            {isRecording
              ? 'Recording...'
              : 'Tap to capture, long press for video'}
          </Text>
        </View>
        {captureSuccess && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              {isRecording ? 'Video Saved' : 'Capture Success'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  captureText: {
    fontSize: 32,
  },
  successContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,200,0,0.8)',
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
  },
  successText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    alignSelf: 'center',
  },
  header: {
    marginTop: 64,
    paddingHorizontal: 16,
    paddingBottom: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  hamburger: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bar: {
    width: 24,
    height: 3,
    backgroundColor: 'black',
    marginVertical: 2,
    borderRadius: 2,
  },
});
