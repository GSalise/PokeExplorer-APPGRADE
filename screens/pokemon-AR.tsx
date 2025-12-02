import React, { useRef, useState } from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { ViroARSceneNavigator } from "@reactvision/react-viro";
import { captureRef } from "react-native-view-shot";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import PokemonARScene from "./pokemon-AR-scene";
import uuid from "react-native-uuid";

export default function PokemonAR() {
  const viroViewRef = useRef<View>(null);
  const [flashMessage, setFlashMessage] = useState(false);

  const capturePokemon = async () => {
  try {
    const uri = await captureRef(viroViewRef, {
      format: "jpg",
      quality: 1,
      result: "tmpfile",
      handleGLSurfaceViewOnAndroid: true,
    });

    console.log("Captured:", uri);

  } catch (err) {
    console.error("Error:", err);
  }
};

  return (
    <View style={{ flex: 1 }}>
      {/* AR view wrapped for captureRef */}
      <View ref={viroViewRef} style={StyleSheet.absoluteFill}>
        <ViroARSceneNavigator
          initialScene={{ scene: PokemonARScene }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Crosshair */}
      <View style={styles.crosshair} />

      {/* Capture Button */}
      <Pressable onPress={capturePokemon} style={styles.captureButton}>
        <Text style={styles.captureText}>CAPTURE</Text>
      </Pressable>

      {/* Flash message */}
      {flashMessage && (
        <View style={styles.flashBanner}>
          <Text style={{ color: "white" }}>Screenshot saved!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  crosshair: {
    position: "absolute",
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: "red",
    borderRadius: 20,
    top: "50%",
    left: "50%",
    marginLeft: -20,
    marginTop: -20,
    zIndex: 10,
  },
  captureButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "#ff4444",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    zIndex: 20,
  },
  captureText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  flashBanner: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 40,
    backgroundColor: "green",
    justifyContent: "center",
    alignItems: "center",
  },
});
