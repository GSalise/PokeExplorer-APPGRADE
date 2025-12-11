import { useEffect, useState } from "react";
import { View, Text, Image, ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { auth, db } from "../services/firebaseConfig";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, User, updateProfile, signOut } from "firebase/auth";
import { launchImageLibrary, Asset } from "react-native-image-picker"; // ADD

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

  // Local edit state
  const [nameInput, setNameInput] = useState("");
  const [photoInput, setPhotoInput] = useState("");
  const [pickedPhoto, setPickedPhoto] = useState<Asset | null>(null); // ADD
  const [saving, setSaving] = useState(false);

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
        if (s.exists()) {
          const data = s.data() as Profile;
          setProfile(data);
          // Pre-fill inputs from profile
          setNameInput(data.displayName ?? "");
          setPhotoInput(data.profilePic ?? "");
        }
      });

      setLoading(false);
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  async function handleLogout() {
    try {
      await signOut(auth); // Logic aligned with logout.tsx usage of Firebase Auth
      // AppNavigation will show Login when user is null
    } catch (e) {
      Alert.alert("Logout failed", String(e));
    }
  }

  async function pickProfilePhoto() {
    const res = await launchImageLibrary({
      mediaType: "photo",
      selectionLimit: 1,
      quality: 0.9,
    });

    if (res.didCancel) return;
    if (res.errorCode) {
      Alert.alert("Image picker error", res.errorMessage || res.errorCode);
      return;
    }
    const asset = res.assets?.[0];
    if (!asset?.uri) {
      Alert.alert("No image selected");
      return;
    }
    setPickedPhoto(asset);
    setPhotoInput(asset.uri); // use local URI; if you need a remote URL, upload to storage first
  }

  async function saveProfileUpdates() {
    if (!user) return;
    setSaving(true);
    try {
      const ref = doc(db, "users", user.uid);

      await updateDoc(ref, {
        displayName: nameInput.trim(),
        profilePic: photoInput.trim(),
      });

      await updateProfile(user, {
        displayName: nameInput.trim() || undefined,
        photoURL: photoInput.trim() || undefined,
      });

      Alert.alert("Profile updated", "Your changes have been saved.");
    } catch (e) {
      Alert.alert("Update failed", String(e));
    } finally {
      setSaving(false);
    }
  }

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
        <TouchableOpacity style={[styles.button, { marginTop: 12 }]} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {photoInput ? (
        <Image source={{ uri: photoInput }} style={styles.avatar} />
      ) : profile?.profilePic ? (
        <Image source={{ uri: profile.profilePic }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarInitial}>
            {profile?.displayName?.charAt(0)?.toUpperCase() || "?"}
          </Text>
        </View>
      )}

      <Text style={styles.title}>{profile?.displayName}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile?.level ?? 0}</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile?.pokemonCount ?? 0}</Text>
          <Text style={styles.statLabel}>Pokémon</Text>
        </View>
      </View>

      {/* Edit form */}
      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Update profile</Text>

        <Text style={styles.inputLabel}>Display name</Text>
        <TextInput
          value={nameInput}
          onChangeText={setNameInput}
          placeholder="Enter display name"
          style={styles.input}
        />

        <Text style={styles.inputLabel}>Profile picture</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity style={[styles.button, { flex: 0 }]} onPress={pickProfilePhoto}>
            <Text style={styles.buttonText}>Pick from gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Optional: show URI for debugging */}
        {photoInput ? <Text style={styles.muted} numberOfLines={1}>Selected: {photoInput}</Text> : null}

        <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={saveProfileUpdates} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? "Saving..." : "Save changes"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.buttonOutline]} onPress={handleLogout}>
          <Text style={styles.buttonOutlineText}>Logout</Text>
        </TouchableOpacity>
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
    marginBottom: 16,
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
  form: {
    width: "100%",
    maxWidth: 480,
    marginTop: 12,
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fafafa",
  },
  button: {
    marginTop: 16,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  buttonOutline: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonOutlineText: {
    color: "#ef4444",
    fontWeight: "600",
  },
});
