import { auth, db } from "./firebaseConfig";
import { doc, updateDoc, increment, getDoc, setDoc } from "firebase/firestore";
import { Alert } from "react-native"; // import Alert

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
        console.log('User profile does not exist');
        return;
    }

    const { level = 1, xp = 0 } = (snap.data() || {}) as any;

    const xpGain = 50;
    const newXp = xp + xpGain;

    const updateData: any = {
      pokemonCount: increment(1),
      xp: increment(xpGain),
    };

    let leveledUp = false;
    if (newXp >= getNextLevelXp(level)) {
      updateData.level = increment(1);
      leveledUp = true; // flag to indicate user leveled up
    }

    await updateDoc(ref, updateData);

    // Show notification if leveled up
    if (leveledUp) {
      Alert.alert("Level Up!", `Congratulations! You reached level ${level + 1}!`);
    }

  } catch (err: any) {
    console.error("Failed to reward Pokémon capture:", err);
  }
}
