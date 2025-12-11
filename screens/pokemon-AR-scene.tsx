import React, { useRef, useState } from 'react';
import {
  ViroAnimatedImage,
  ViroARScene,
  ViroAmbientLight,
  ViroTrackingStateConstants,
  ViroTrackingReason,
} from '@reactvision/react-viro';

type SceneProps = {
  pokemonid?: string;
  onTrackingReady?: () => void;
  capture?: () => void;
};

const PokemonARScene = ({ pokemonid = '25', onTrackingReady, capture }: SceneProps) => {
  const [text, setText] = useState('Initializing AR...');
  const firedOnce = useRef(false);

  function onInitialized(state: any, _reason: ViroTrackingReason) {
    if (state === ViroTrackingStateConstants.TRACKING_NORMAL) {
      setText('Ready!');
      if (!firedOnce.current) {
        firedOnce.current = true;
        onTrackingReady?.();
      }
    }
  }

  const gifUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${pokemonid}.gif`;

  return (
    <ViroARScene onTrackingUpdated={onInitialized}>
      <ViroAmbientLight color="#ffffff" intensity={1000} />
      <ViroAnimatedImage
        key={pokemonid}
        placeholderSource={{ uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${pokemonid}.gif` }}
        source={{ uri: gifUrl }}
        position={[0, -0.5, -1]}
        scale={[0.3, 0.3, 0.3]}
        onError={(e) => {
          console.warn('Animated image failed:', e?.nativeEvent ?? e);
        }}
        onClick={capture}
      />
   </ViroARScene>
  );
};

export default PokemonARScene;
