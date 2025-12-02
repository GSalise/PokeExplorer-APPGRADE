import React, { useState } from "react";
import {
  ViroAnimatedImage,
  ViroARScene,
  ViroAmbientLight,
  ViroTrackingStateConstants,
  ViroTrackingReason,

} from "@reactvision/react-viro";

const PokemonARScene = () => {
  const [text, setText] = useState("Initializing AR...");

  function onInitialized(state: any, reason: ViroTrackingReason) {
    if (state === ViroTrackingStateConstants.TRACKING_NORMAL) {
      setText("Ready!");
    }
  }
  return (
    <ViroARScene onTrackingUpdated={onInitialized}>
      <ViroAmbientLight color="#ffffff" intensity={1000} />

      <ViroAnimatedImage
        placeholderSource={{
          uri: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/1.gif",
        }}
        source={{
          uri: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/1.gif",
        }}
        position={[0, -0.5, -1]}  // centered & 1 meter away
        scale={[0.3, 0.3, 0.3]}
      />
    </ViroARScene>
  );
};

export default PokemonARScene;
