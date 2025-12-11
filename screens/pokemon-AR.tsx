import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  ActivityIndicator, // ADD
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ViroARSceneNavigator } from '@reactvision/react-viro';
import { captureRef } from 'react-native-view-shot';
import uuid from 'react-native-uuid';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import PokemonARScene from './pokemon-AR-scene';
import { rewardPokemonCapture } from '../services/profileService';
type props = {
  route: { params?: { pokemonid?: string; spawnId?: string } };
};
export default function PokemonAR({ route }: props) {
  const viroViewRef = useRef<ViroARSceneNavigator | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [arReady, setArReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const navigation = useNavigation<any>();

  const pokemonid = route.params?.pokemonid ?? '25';
  const spawnId = route.params?.spawnId;

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
    setFlashMessage('Capturing...'); // SHOW LOADING STATE
    let success = false;             // TRACK SUCCESS
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
        quality: 1, // was 1; slightly faster with negligible visual loss
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

// Kick off reward in background (don’t block navigation)
      rewardPokemonCapture().catch(e =>
        console.warn('Reward failed:', e),
      );
      success = true;

// Show toast but don’t block UI
      setFlashMessage('Captured! Saved to gallery.');
      setTimeout(() => setFlashMessage("captured"), 500);

// Navigate immediately
      navigation.navigate('Map', {
        capturedSpawnId: spawnId,
        capturedPokedexId: pokemonid,
      });
    } catch (err) {
      console.error('Error:', err);
    } finally {
      if (!success) {
        // Clear loading state if capture failed or was aborted
        if (flashMessage === 'Capturing...') setFlashMessage(null);
      }
      setCapturing(false);
    }
  }, [arReady, capturing, navigation, pokemonid, spawnId, viroViewRef, flashMessage]);

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

      <View style={styles.hud}>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor:
                flashMessage === 'Captured! Saved to gallery.'
                  ? '#16a34a' // green
                  : capturing
                    ? '#3b82f6' // blue while capturing
                    : arReady
                      ? '#16a34a' // green when ready
                      : '#f97316', // orange while scanning
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.statusText}>
              {flashMessage ||
                (arReady ? 'Target Locked' : 'Scanning environment...')}
            </Text>
            {capturing && (
              <ActivityIndicator
                size="small"
                color="#ffffff"
                style={{ marginLeft: 8 }}
              />
            )}
          </View>
        </View>
        <Text style={styles.tipText}>
          Tap the Pokémon to take a snap.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hud: {
    position: 'absolute',
    top: 24,
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 12,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  tipText: {
    marginTop: 6,
    color: 'white',
    fontSize: 12,
  },
});
