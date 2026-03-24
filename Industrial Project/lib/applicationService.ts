import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";

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
  newStatus: string,
  adminInfo?: { uid: string; name: string }
) {
  const db = getFirestoreDb();
  const applicationRef = doc(db, "applications", id);

  const snapshot = await getDoc(applicationRef);

  if (!snapshot.exists()) {
    throw new Error("Application not found");
  }

  const currentData = snapshot.data();
  const oldStatus = currentData?.applicationStatus || "Unknown";

  await updateDoc(applicationRef, {
    applicationStatus: newStatus,
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, "applications", id, "decisionHistory"), {
    note: `Status changed from ${oldStatus} to ${newStatus}`,
    previousStatus: oldStatus,
    status: newStatus,
    changedAt: serverTimestamp(),
    changedBy: adminInfo?.name || "Admin",
    changedById: adminInfo?.uid || "unknown-admin",
  });
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
    createdAt: serverTimestamp(),
  });
}

export async function getDecisionHistory(applicationId: string) {
  const db = getFirestoreDb();
  const historyRef = collection(db, "applications", applicationId, "decisionHistory");
  const q = query(historyRef, orderBy("changedAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}