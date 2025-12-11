import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { ViroARSceneNavigator } from '@reactvision/react-viro';
import { captureRef } from 'react-native-view-shot';
import uuid from 'react-native-uuid';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import PokemonARScene from './pokemon-AR-scene';

type props = {
  route: { params?: { pokemonid?: string } };
};
export default function PokemonAR({ route }: props) {
  const viroViewRef = useRef<ViroARSceneNavigator | null>(null);
  const [flashMessage, setFlashMessage] = useState(false);
  const [arReady, setArReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const pokemonid = route.params?.pokemonid ?? '25';

  const handleTrackingReady = useCallback(() => {
    setArReady(true);
  }, []);

  async function ensurePhotoPermission() {
    if (Platform.OS !== 'android') return true;
    const perm =
      Platform.Version >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
    const res = await PermissionsAndroid.request(perm);
    return res === PermissionsAndroid.RESULTS.GRANTED;
  }

  const nextFrame = () =>
    new Promise<void>((resolve) =>
      requestAnimationFrame(() => setTimeout(resolve, 0)),
    );

  const capturePokemon = useCallback(async () => {
    if (capturing) return;
    
    if (!arReady) {
      console.warn('AR tracking not ready yet, attempting capture anyway...');
    }
    
    setCapturing(true);
    try {
      if (!viroViewRef.current) {
        console.warn('AR scene not ready yet');
        return;
      }

      // Let layout settle to avoid "No view found with reactTag"
      await nextFrame();

      const randomName = String(uuid.v4());
      const localUri = await captureRef(viroViewRef.current, {
        format: 'jpg',
        quality: 1,
        fileName: randomName,
        handleGLSurfaceViewOnAndroid: true,
      });
      if (!localUri) {
        console.warn('AR scene not ready yet');
        return;
      }

      console.log('Captured:', localUri);

      const ok = await ensurePhotoPermission();
      if (!ok) {
        console.warn('Gallery permission denied');
        return;
      }

      await CameraRoll.save(localUri, { type: 'photo', album: 'PokeExplorer' });
      setFlashMessage(true);
      setTimeout(() => setFlashMessage(false), 1500);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setCapturing(false);
    }
  }, [arReady, viroViewRef]);

  const SceneWithProps = useMemo(
    () =>
      function Scene() {
        return (
          <PokemonARScene
            pokemonid={pokemonid}
            onTrackingReady={handleTrackingReady}
            capture={capturePokemon}
          />
        );
      },
    [pokemonid, capturePokemon, handleTrackingReady],
  );

  return (
    <View style={{ flex: 1 }}>
      <ViroARSceneNavigator
        key={pokemonid}
        ref={viroViewRef}
        initialScene={{ scene: SceneWithProps }}
        style={StyleSheet.absoluteFill}
      />

      

      {/* <Pressable
        onPress={capturePokemon}
        style={[
          styles.captureButton,
          (!arReady || capturing) && { opacity: 0.5 },
        ]}
        disabled={!arReady || capturing}
      >
        <Text style={styles.captureText}>
          {capturing ? 'CAPTURING…' : 'CAPTURE'}
        </Text>
      </Pressable> */}

      {flashMessage && (
        <View style={styles.flashBanner}>
          <Text style={{ color: 'white' }}>Screenshot saved!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  crosshair: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: 'red',
    borderRadius: 20,
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
    zIndex: 10,
  },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#ff4444',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    zIndex: 20,
  },
  captureText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  flashBanner: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 40,
    backgroundColor: 'green',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
