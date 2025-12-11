import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { signOut, onAuthStateChanged, updateProfile, User } from 'firebase/auth';
import { auth, db } from '../services/firebaseConfig';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary, Asset } from 'react-native-image-picker';

type UserDoc = {
  displayName?: string;
  profilePic?: string;
  level?: number;
  pokemonCount?: number;
};

export default function ProfileScreen() {
  const navigation = useNavigation();

  // Profile state
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  // Editing state
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [pickedPhoto, setPickedPhoto] = useState<Asset | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      if (!u) {
        setUserDoc(null);
        setLoading(false);
        return;
      }
      const ref = doc(db, 'users', u.uid);
      const unsubDoc = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserDoc;
          setUserDoc(data);
          // Prefill inputs when opening editor later
          setNameInput(data.displayName ?? '');
          setPhotoUri(data.profilePic ?? null);
        }
        setLoading(false);
      });
      return () => unsubDoc();
    });

    return () => unsubAuth();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            console.log('User logged out successfully');
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  };

  async function pickProfilePhoto() {
    const res = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.9,
    });
    if (res.didCancel) return;
    if (res.errorCode) {
      Alert.alert('Image picker error', res.errorMessage || res.errorCode);
      return;
    }
    const asset = res.assets?.[0];
    if (!asset?.uri) {
      Alert.alert('No image selected');
      return;
    }
    setPickedPhoto(asset);
    setPhotoUri(asset.uri);
  }

  async function saveProfile() {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      const ref = doc(db, 'users', firebaseUser.uid);
      await updateDoc(ref, {
        displayName: nameInput.trim(),
        profilePic: photoUri || '',
      });
      await updateProfile(firebaseUser, {
        displayName: nameInput.trim() || undefined,
        photoURL: photoUri || undefined,
      });
      setEditing(false);
      Alert.alert('Profile updated');
    } catch (e) {
      Alert.alert('Update failed', String(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  const displayName = userDoc?.displayName || 'Pokémon Trainer';
  const emailText = auth.currentUser?.email || 'trainer@pokemon.com';
  const avatar = photoUri || userDoc?.profilePic || null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#DC0A2D', '#FF6B6B']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Profile + stats + editor */}
        <View>
          <View style={styles.profileSection}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <Text style={styles.profileIcon}>👤</Text>
            )}
            <Text style={styles.username}>{displayName}</Text>
            <Text style={styles.email}>{emailText}</Text>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                setEditing((e) => !e);
                if (!editing) {
                  setNameInput(userDoc?.displayName ?? '');
                  setPhotoUri(userDoc?.profilePic ?? null);
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.editButtonText}>{editing ? 'Close Editor' : 'Edit Profile'}</Text>
            </TouchableOpacity>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userDoc?.level ?? 1}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userDoc?.pokemonCount ?? 0}</Text>
              <Text style={styles.statLabel}>Pokémon</Text>
            </View>
          </View>

          {/* Inline editor */}
          {editing && (
            <View style={styles.editCard}>
              <Text style={styles.editLabel}>Display name</Text>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Enter display name"
                style={styles.input}
              />

              <Text style={styles.editLabel}>Profile picture</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity style={styles.secondaryButton} onPress={pickProfilePhoto} activeOpacity={0.85}>
                  <Text style={styles.secondaryButtonText}>Pick from gallery</Text>
                </TouchableOpacity>
              </View>

              {photoUri ? (
                <View style={{ alignItems: 'center', marginTop: 12 }}>
                  <Image source={{ uri: photoUri }} style={styles.preview} />
                  <Text style={styles.previewNote} numberOfLines={1}>
                    Selected: {photoUri}
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryButton, saving && { opacity: 0.6 }]}
                onPress={saveProfile}
                disabled={saving}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save changes'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Logout (bottom) */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CARD_BG = '#ffffff';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerGradient: {
    paddingTop: 48,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  profileIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  editButton: {
    marginTop: 16,
    backgroundColor: '#DC0A2D',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 2,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '700',
  },

  // Stats
  statsRow: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  statCard: {
    backgroundColor: CARD_BG,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    minWidth: 140,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#222',
  },
  statLabel: {
    marginTop: 4,
    color: '#6b7280',
    fontWeight: '600',
  },

  // Editor
  editCard: {
    marginTop: 20,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  editLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '600',
  },
  preview: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginTop: 8,
  },
  previewNote: {
    marginTop: 6,
    color: '#6b7280',
    fontSize: 12,
    maxWidth: '100%',
  },
  primaryButton: {
    marginTop: 14,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },

  // Logout
  logoutButton: {
    backgroundColor: '#DC0A2D',
    paddingVertical: 16,
    borderRadius: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});
