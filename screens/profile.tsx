import { useEffect, useState } from "react";
import { View, Text, Image, ActivityIndicator, StyleSheet } from "react-native";
import { auth, db } from "../services/firebaseConfig";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

type Profile = {
  level: number;
  xp: number;
  pokemonCount: number;
  displayName: string;
  profilePic: string;
  createdAt: any;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: undefined | (() => void);

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setLoading(false);
        if (unsubProfile) unsubProfile();
        return;
      }

      const ref = doc(db, "users", currentUser.uid);

      const snap = await getDoc(ref);
      if (!snap.exists()) {
        console.log("User doc missing");
      }

      unsubProfile = onSnapshot(ref, (s) => {
        if (s.exists()) setProfile(s.data() as Profile);
      });

      setLoading(false);
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>No profile found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {profile.profilePic ? (
        <Image source={{ uri: profile.profilePic }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarInitial}>
            {profile.displayName?.charAt(0)?.toUpperCase() || "?"}
          </Text>
        </View>
      )}

      <Text style={styles.title}>{profile.displayName}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile.level}</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile.pokemonCount}</Text>
          <Text style={styles.statLabel}>Pokémon</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f3f4f6",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  muted: {
    marginTop: 8,
    color: "#6b7280",
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  avatarFallback: {
    backgroundColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#374151",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 120,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    marginHorizontal: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 4,
  },
});
