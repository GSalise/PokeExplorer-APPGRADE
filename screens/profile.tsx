import { useEffect, useState } from "react";
import { auth, db } from '../services/firebaseConfig'
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
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
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const ref = doc(db, "users", currentUser.uid);

      const snap = await getDoc(ref);
      if (!snap.exists()) {
        console.log('User is not authenticated')
      }

      const unsubProfile = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as Profile);
        }
      });

      setLoading(false);

      return () => unsubProfile();
    });

    return () => unsub();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!profile) return <p className="text-center mt-10">No profile found.</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* Profile Picture */}
      {profile.profilePic ? (
        <img
          src={profile.profilePic}
          alt="Profile"
          className="w-28 h-28 rounded-full border mb-4"
        />
      ) : (
        <div className="w-28 h-28 rounded-full border flex items-center justify-center bg-gray-300 mb-4">
          <span className="text-3xl font-bold text-gray-700">
            {profile.displayName.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      <h1 className="text-2xl font-semibold mb-6">{profile.displayName}</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-md">
        <div className="bg-white p-4 rounded-xl shadow-sm text-center">
          <h2 className="text-xl font-bold">{profile.level}</h2>
          <p className="text-gray-500 text-sm">Level</p>
        </div>


        <div className="bg-white p-4 rounded-xl shadow-sm text-center">
          <h2 className="text-xl font-bold">{profile.pokemonCount}</h2>
          <p className="text-gray-500 text-sm">Pokémon</p>
        </div>
      </div>
    </div>
  );
}
