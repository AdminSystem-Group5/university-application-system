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

const STATUSES = [
  "Submitted",
  "Under Review",
  "More Info Required",
  "Approved",
  "Rejected",
];

export async function getApplicationById(id) {
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

export async function updateApplicationStatus(id, newStatus, adminInfo) {
  const db = getFirestoreDb();
  const applicationRef = doc(db, "applications", id);
  const snapshot = await getDoc(applicationRef);

  if (!snapshot.exists()) {
    throw new Error("Application not found");
  }

  if (!STATUSES.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  const currentData = snapshot.data();
  const oldStatus = currentData?.applicationStatus || "Unknown";

  const validTransitions = {
    Submitted: STATUSES,
    "Under Review": STATUSES,
    "More Info Required": STATUSES,
    Approved: STATUSES,
    Rejected: STATUSES,
  };

  const allowedNext = validTransitions[oldStatus] || [];

  if (!allowedNext.includes(newStatus)) {
    throw new Error(`Invalid status transition: ${oldStatus} → ${newStatus}`);
  }

  await updateDoc(applicationRef, {
    applicationStatus: newStatus,
    updatedAt: serverTimestamp(),
    reviewedBy: adminInfo.name,
    reviewedAt: serverTimestamp(),
    ...(newStatus === "Approved" || newStatus === "Rejected"
      ? { decisionAt: serverTimestamp() }
      : {}),
  });

  await addDoc(collection(db, "applications", id, "decisionHistory"), {
    note: `Status changed from ${oldStatus} to ${newStatus}`,
    previousStatus: oldStatus,
    status: newStatus,
    changedAt: serverTimestamp(),
    changedBy: adminInfo.name,
    changedById: adminInfo.uid,
    eventType: "status_change",
  });
}

export async function addApplicationNote(applicationId, noteText, adminInfo) {
  const db = getFirestoreDb();
  const notesRef = collection(db, "applications", applicationId, "notes");

  await addDoc(notesRef, {
    adminId: adminInfo.uid,
    adminName: adminInfo.name,
    noteText,
    createdAt: serverTimestamp(),
    updatedAt: null,
    eventType: "admin_note",
  });
}

export async function getDecisionHistory(applicationId) {
  const db = getFirestoreDb();
  const historyRef = collection(
    db,
    "applications",
    applicationId,
    "decisionHistory"
  );
  const q = query(historyRef, orderBy("changedAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}