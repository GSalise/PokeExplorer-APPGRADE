import { auth, db } from "./firebaseConfig";
import { doc, updateDoc, increment, getDoc, setDoc } from "firebase/firestore";

// XP formula: level * 100 = next level requirement
const getNextLevelXp = (level: number) => level * 100;

export async function rewardPokemonCapture() {
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  // If no profile exists, create it
  if (!snap.exists()) {
    await setDoc(ref, {
      level: 1,
      xp: 0,
      pokemonCount: 0,
      createdAt: new Date(),
      displayName: user.displayName || "",
    });
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
}

