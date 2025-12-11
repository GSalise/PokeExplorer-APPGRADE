// hooks/useSignUp.ts
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../services/firebaseConfig";
import {doc, setDoc} from "firebase/firestore"
export function useSignUp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signUp = async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    setError("");

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      
      await setDoc(doc(db, "users", userCred.user.uid), {
        level: 1,
        pokemonCount: 0,
        xp: 0,
        createdAt: new Date(),
      });


      // Optional: set display name
      if (displayName) {
        await updateProfile(userCred.user, { displayName });
      }

      return userCred.user;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { signUp, loading, error };
}
