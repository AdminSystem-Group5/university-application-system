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
import { sendDecisionEmail } from "@/functions/triggers/sendDecisionEmail";

const DECISION_STATUSES = ["Under Review", "Offered", "Rejected"];

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

export async function updateApplicationStatus(
  id,
  newStatus,
  adminInfo,
  messageToStudent = ""
) {
  const db = getFirestoreDb();
  const applicationRef = doc(db, "applications", id);
  const snapshot = await getDoc(applicationRef);

  if (!snapshot.exists()) {
    throw new Error("Application not found");
  }

  if (!DECISION_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  const currentData = snapshot.data();

  const oldStatus =
    currentData?.applicationStatus ||
    currentData?.status ||
    currentData?.pendingDecision ||
    "Submitted";

  const finalMessage = String(messageToStudent || "").trim();

  const studentId =
    currentData?.studentId ||
    currentData?.studentUid ||
    currentData?.userId ||
    currentData?.createdBy ||
    null;

  const studentEmail =
    currentData?.email ||
    currentData?.emailAddress ||
    currentData?.studentEmail ||
    currentData?.applicantEmail ||
    null;

  const studentName =
    currentData?.studentName ||
    currentData?.fullName ||
    currentData?.displayName ||
    currentData?.applicantName ||
    "Student";

  await updateDoc(applicationRef, {
    applicationStatus: newStatus,
    status: newStatus,
    pendingDecision: newStatus,

    messageToStudent: finalMessage,
    decisionMessage: finalMessage,

    updatedAt: serverTimestamp(),
    reviewedAt: serverTimestamp(),
    reviewedBy: adminInfo?.name || "Admin",
    reviewedById: adminInfo?.uid || null,

    ...(newStatus === "Offered" || newStatus === "Rejected"
      ? { decisionAt: serverTimestamp() }
      : {}),
  });

  await addDoc(collection(db, "applications", id, "decisionHistory"), {
    note: finalMessage || `Status changed from ${oldStatus} to ${newStatus}`,
    previousStatus: oldStatus,
    status: newStatus,
    changedAt: serverTimestamp(),
    changedBy: adminInfo?.name || "Admin",
    changedById: adminInfo?.uid || null,
    eventType: "status_change",
  });

  if (studentId && finalMessage) {
    await addDoc(collection(db, "notifications"), {
      studentId,
      applicationId: currentData?.applicationId || id,
      applicationDocumentId: id,
      status: newStatus,
      title: `Application ${newStatus}`,
      message: finalMessage,
      read: false,
      createdAt: serverTimestamp(),
      eventType: "application_status_update",
    });
  }

  if (studentEmail && finalMessage) {
    try {
      sendDecisionEmail({
        name: studentName,
        email: studentEmail,
        status: newStatus,
        messageToStudent: finalMessage,
      });
    } catch (error) {
      console.error("Decision email failed:", error);
    }
  }
}

export async function addApplicationNote(applicationId, noteText, adminInfo) {
  const db = getFirestoreDb();
  const notesRef = collection(db, "applications", applicationId, "notes");

  await addDoc(notesRef, {
    adminId: adminInfo?.uid || null,
    adminName: adminInfo?.name || "Admin",
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