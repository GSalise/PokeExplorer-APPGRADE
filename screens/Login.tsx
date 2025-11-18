import React, { useState } from "react";
import { View, TextInput, Button, Text } from "react-native";
import { useSignIn } from "../hooks/useSignIn";

export default function LoginScreen() {
  const { signIn, loading, error } = useSignIn();

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
        title={loading ? "Signing in..." : "Sign In"} 
        onPress={() => signIn(email, password)} 
      />
    </View>
  );
}
