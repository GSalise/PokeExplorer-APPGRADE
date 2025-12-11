import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth, db } from "../services/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";

// Define user profile type
type UserProfile = {
  level: number;
  xp: number;
  pokemonCount: number;
  createdAt?: any;
};

// Context type
const UserProfileContext = createContext<UserProfile | null>(null);

type Props = {
  children: ReactNode;
};

export function UserProfileProvider({ children }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const ref = doc(db, "users", user.uid);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile); // Type assertion
      }
    });

    return () => unsub();
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
