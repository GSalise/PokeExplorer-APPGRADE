import { auth, db } from "./firebaseConfig";
import { doc, updateDoc, increment, getDoc, setDoc } from "firebase/firestore";

// XP formula: level * 100 = next level requirement
const getNextLevelXp = (level: number) => level * 100;

export async function rewardPokemonCapture() {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No user is logged in");

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    // Initialize profile if it doesn't exist
    if (!snap.exists()) {
        console.log('User is not authenticated')
    }

    const { level = 1, xp = 0 } = (snap.data() || {}) as any;

    const xpGain = 50;
    const newXp = xp + xpGain;

    const updateData: any = {
      pokemonCount: increment(1),
      xp: increment(xpGain),
    };

    if (newXp >= getNextLevelXp(level)) {
      updateData.level = increment(1);
    }

    await updateDoc(ref, updateData);

  } catch (err: any) {
    console.error("Failed to reward Pokémon capture:", err);
    // Optional: show a toast or alert to the user
    // Alert.alert("Error", "Could not update your stats. Please try again.");
  }
}
