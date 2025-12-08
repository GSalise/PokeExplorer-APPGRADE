// screens/Login.tsx
import React, { useState } from "react";
import { View, TextInput, Button, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { useSignIn } from "../hooks/useSignIn";

type LoginNavProp = NativeStackNavigationProp<RootStackParamList, "Login">;

export default function LoginScreen() {
  const navigation = useNavigation<LoginNavProp>();
  const { signIn, loading, error } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const user = await signIn(email, password);
    if (user) {
      console.log("Logged in!");
      navigation.navigate("Home"); // Navigate to Home or another screen if needed
    }
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>PokeDex</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#ccc"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#ccc"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <Button title={loading ? "Signing in..." : "Sign In"} onPress={handleLogin} />

      {error ? <Text style={{ color: "red", marginTop: 10 }}>{error}</Text> : null}

      <View style={styles.signupContainer}>
        <Text style={styles.text}>No account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text style={[styles.text, styles.signupText]}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#fff",
    textAlign: "center",
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#121212",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    color: "#fff",
  },
  signupContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  text: {
    color: "#fff",
  },
  signupText: {
    color: "#1e90ff",
    marginTop: 4,
  },
});
