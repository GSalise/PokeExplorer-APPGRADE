import { auth, db } from "./firebaseConfig";
import { doc, updateDoc, increment, getDoc } from "firebase/firestore";

// XP formula: level * 100 = next level requirement
const getNextLevelXp = (level: number) => level * 100;

export async function rewardPokemonCapture() {
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "users", user.uid);

  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const { level, xp } = snap.data();

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
