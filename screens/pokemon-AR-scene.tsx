import React, { useState } from 'react';
import {
  ViroAnimatedImage,
  ViroARScene,
  ViroAmbientLight,
  ViroTrackingStateConstants,
  ViroTrackingReason,
} from '@reactvision/react-viro';

type SceneProps = {
  pokemonid?: string;
};
const PokemonARScene = ({ pokemonid }: SceneProps) => {
  const [text, setText] = useState('Initializing AR...');

  function onInitialized(state: any, reason: ViroTrackingReason) {
    if (state === ViroTrackingStateConstants.TRACKING_NORMAL) {
      setText('Ready!');
    }
  }
  return (
    <ViroARScene onTrackingUpdated={onInitialized}>
      <ViroAmbientLight color="#ffffff" intensity={1000} />

      <ViroAnimatedImage
        key={pokemonid}
        placeholderSource={{
          uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${pokemonid}.gif`,
        }}
        source={{
          uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${pokemonid}.gif`,
        }}
        position={[0, -0.5, -1]}
        scale={[0.3, 0.3, 0.3]}
      />
    </ViroARScene>
  );
};

export default PokemonARScene;
