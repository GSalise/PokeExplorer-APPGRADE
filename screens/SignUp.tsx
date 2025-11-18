import React, { useState } from "react";
import { View, TextInput, Button, Text } from "react-native";
import { useSignUp } from "../hooks/useSignUp";

export default function SignUpScreen() {
  const { signUp, loading, error } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View>
      <TextInput 
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput 
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}

      <Button 
        title={loading ? "Creating..." : "Sign Up"} 
        onPress={() => signUp(email, password)} 
      />
    </View>
  );
}
