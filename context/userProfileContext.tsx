import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth, db } from "../services/firebaseConfig";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

// Define user profile type
type UserProfile = {
  level: number;
  xp: number;
  pokemonCount: number;
  displayName?: string;
  profilePic?: string;
  createdAt?: any;
};

// Context type
const UserProfileContext = createContext<UserProfile | null>(null);

type Props = { children: ReactNode };

export function UserProfileProvider({ children }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Listen to auth state changes
    const unsubAuth = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        setProfile(null);
        return;
      }

      const ref = doc(db, "users", user.uid);

      // Check if profile exists, create if not
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          level: 1,
          xp: 0,
          pokemonCount: 0,
          createdAt: new Date(),
          displayName: user.displayName || "Trainer",
          profilePic: "" // default
        });
      }

      // Subscribe to real-time updates
      const unsubProfile = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        }
      });

      // Clean up snapshot subscription on unmount
      return () => unsubProfile();
    });

    // Clean up auth listener
    return () => unsubAuth();
  }, []);

  return (
    <UserProfileContext.Provider value={profile}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(UserProfileContext);
}
