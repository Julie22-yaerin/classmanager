import { addDoc, collection, getDocs, limit as fsLimit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MessageDoc } from "@/lib/firestore/types";

function messagesRef(uid: string) {
  return collection(db, "users", uid, "messages");
}

export async function listMessages(uid: string, take = 200): Promise<MessageDoc[]> {
  const snap = await getDocs(query(messagesRef(uid), orderBy("createdAt", "asc"), fsLimit(take)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MessageDoc, "id">) }));
}

export async function createMessage(uid: string, data: Omit<MessageDoc, "id">): Promise<MessageDoc> {
  const ref = await addDoc(messagesRef(uid), data);
  return { id: ref.id, ...data };
}
