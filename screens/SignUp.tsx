import React, { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSignUp } from "../hooks/useSignUp";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";

type LoginNavProp = NativeStackNavigationProp<RootStackParamList, "Login">;

export default function SignUpScreen() {
  const { signUp, loading, error } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");

  const navigation = useNavigation<LoginNavProp>();

  const handleSignUp = async () => {
    if (password !== retypePassword) {
      console.log("Passwords do not match");
      return;
    }

    const result = await signUp(email, password);

    if (result) {
      console.log("Account created!");
      navigation.navigate("Login");
    }
  };

  return (  
    <View style={styles.container}>
      <Text style={styles.title}>PokeDex</Text>
      <TextInput
        placeholder="Email"
        placeholderTextColor="#ccc"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#ccc"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TextInput
        placeholder="Retype Password"
        placeholderTextColor="#ccc"
        secureTextEntry
        value={retypePassword}
        onChangeText={setRetypePassword}
        style={styles.input}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

     <View style={{ width: "100%", marginTop: 12 }}>
  <View style={styles.buttonWrapper}>
    <Button
      title={loading ? "Creating..." : "Sign Up"}
      onPress={handleSignUp}
      color="#1e90ff"
    />
  </View>

        <View style={styles.buttonWrapper}>
          <Button
            title="Back to Login"
            onPress={() => navigation.navigate("Login")}
            color="#888"
          />
        </View>
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
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
  errorText: {
    color: "red",
    marginBottom: 12,
  },

  buttonWrapper: {
    marginTop: 10,
    marginBottom: 10,
    width: "100%", 
  },


});
