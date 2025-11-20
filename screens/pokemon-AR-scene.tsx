import React, { useEffect, useState } from "react";
import {
  ViroARScene,
  ViroText,
  ViroTrackingStateConstants,
  ViroARTrackingTargets,
  ViroARImageMarker,
  Viro3DObject,
  ViroAmbientLight,
  ViroNode,
  ViroOmniLight,
} from "@reactvision/react-viro";
import { StyleSheet } from "react-native";

export default function PokemonARScene() {
  return (
    <ViroARScene >
      <ViroText text="Hello World" position={[0, 0, -1]} style={styles.statusText}>
      </ViroText>
    </ViroARScene>
  );
}

const styles = StyleSheet.create({
  statusText: {
    fontFamily: "Arial",
    fontSize: 5,
    color: "#ffffff",
    textAlign: "center",
  },
});
