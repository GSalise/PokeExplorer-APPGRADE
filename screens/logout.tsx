import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebaseConfig"; // adjust path

export default function LogoutScreen() {
  useEffect(() => {
    signOut(auth).catch((err) => console.log("Logout error:", err));
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
      <Text>Logging out...</Text>
    </View>
  );
}
