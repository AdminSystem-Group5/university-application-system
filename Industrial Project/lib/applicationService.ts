import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";

// keep your existing functions above

export async function getApplicationById(id: string) {
  const db = getFirestoreDb();
  const applicationRef = doc(db, "applications", id);
  const snapshot = await getDoc(applicationRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function getApplications() {
  const db = getFirestoreDb();
  const applicationsRef = collection(db, "applications");
  const q = query(applicationsRef, orderBy("submittedAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function updateApplicationStatus(
  id: string,
  newStatus: string
) {
  const db = getFirestoreDb();
  const applicationRef = doc(db, "applications", id);

  await updateDoc(applicationRef, {
    applicationStatus: newStatus,
    updatedAt: new Date(),
  });
}

export async function getApplicationNotes(applicationId: string) {
  const db = getFirestoreDb();
  const notesRef = collection(db, "applications", applicationId, "notes");
  const q = query(notesRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function addApplicationNote(
  applicationId: string,
  noteText: string
) {
  const db = getFirestoreDb();
  const notesRef = collection(db, "applications", applicationId, "notes");

  await addDoc(notesRef, {
    adminId: "admin001",
    adminName: "Anton",
    noteText,
    createdAt: new Date(),
  });
}