import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/firestore/types";
import type { User } from "firebase/auth";

function userRef(uid: string) {
  return doc(db, "users", uid);
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const ref = userRef(user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as UserProfile;

  const profile: UserProfile = {
    email: user.email,
    displayName: user.displayName,
    createdAt: new Date().toISOString(),
    onboardingComplete: false,
    goals: [],
    grade: null,
    curriculum: null,
    school: null,
    aiStyle: "adaptive",
    academicLevel: null,
    explanationStyle: null,
    communicationStyle: null,
    learningPreferences: null,
    weaknesses: null,
    allowRecordingUploads: true,
    calendarAutoSync: false,
  };
  await setDoc(ref, profile);
  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await updateDoc(userRef(uid), data);
}
