/**
 * Firestore Utility Functions
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  runTransaction,
  serverTimestamp,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";

import { getFirestoreDb } from "./firebase";
import { canTransitionTo, VALID_TRANSITIONS } from "@/types/database";

const COLLECTIONS = {
  USERS: "users",
  UNIVERSITIES: "universities",
  APPLICATIONS: "applications",
  DOCUMENTS: "documents",
  NOTIFICATIONS: "notifications",
  EMAIL_LOGS: "emailLogs",
};

export async function getUserById(uid) {
  const db = getFirestoreDb();
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));

  if (!userDoc.exists()) {
    return null;
  }

  return { uid: userDoc.id, ...userDoc.data() };
}

export async function createUser(user) {
  const db = getFirestoreDb();
  await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
    ...user,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateUser(uid, updates) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function getAllUniversities() {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, COLLECTIONS.UNIVERSITIES));

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function getUniversityById(id) {
  const db = getFirestoreDb();
  const universityDoc = await getDoc(doc(db, COLLECTIONS.UNIVERSITIES, id));

  if (!universityDoc.exists()) {
    return null;
  }

  return { id: universityDoc.id, ...universityDoc.data() };
}

export async function getUniversitiesForAdmin(adminUid) {
  const db = getFirestoreDb();
  const q = query(
    collection(db, COLLECTIONS.UNIVERSITIES),
    where("adminIds", "array-contains", adminUid)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function createApplication(input) {
  const db = getFirestoreDb();
  const applicationsRef = collection(db, COLLECTIONS.APPLICATIONS);
  const newDocRef = doc(applicationsRef);

  await setDoc(newDocRef, {
    ...input,
    id: newDocRef.id,
    status: "Draft",
    decisionHistory: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return newDocRef.id;
}

export async function getApplicationById(id) {
  const db = getFirestoreDb();
  const appDoc = await getDoc(doc(db, COLLECTIONS.APPLICATIONS, id));

  if (!appDoc.exists()) {
    return null;
  }

  return { id: appDoc.id, ...appDoc.data() };
}

export async function getApplicationsForStudent(
  studentId,
  pageSize = 10,
  lastDoc
) {
  const db = getFirestoreDb();

  const constraints = [
    where("studentId", "==", studentId),
    orderBy("createdAt", "desc"),
    limit(pageSize + 1),
  ];

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  const q = query(collection(db, COLLECTIONS.APPLICATIONS), ...constraints);
  const snapshot = await getDocs(q);

  const hasMore = snapshot.docs.length > pageSize;
  const docs = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs;

  return {
    data: docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })),
    lastDoc: docs[docs.length - 1] || null,
    hasMore,
  };
}

export async function getApplicationsForUniversity(
  universityId,
  filters = {},
  pageSize = 20,
  lastDoc
) {
  const db = getFirestoreDb();

  const constraints = [where("universityId", "==", universityId)];

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      constraints.push(where("status", "in", filters.status));
    } else {
      constraints.push(where("status", "==", filters.status));
    }
  }

  if (filters.submittedAfter) {
    constraints.push(where("submittedAt", ">=", filters.submittedAfter));
  }

  if (filters.submittedBefore) {
    constraints.push(where("submittedAt", "<=", filters.submittedBefore));
  }

  constraints.push(orderBy("submittedAt", "desc"));
  constraints.push(limit(pageSize + 1));

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  const q = query(collection(db, COLLECTIONS.APPLICATIONS), ...constraints);
  const snapshot = await getDocs(q);

  const hasMore = snapshot.docs.length > pageSize;
  const docs = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs;

  return {
    data: docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })),
    lastDoc: docs[docs.length - 1] || null,
    hasMore,
  };
}

export async function updateApplication(applicationId, updates) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, COLLECTIONS.APPLICATIONS, applicationId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function submitApplication(applicationId) {
  const db = getFirestoreDb();

  await runTransaction(db, async (transaction) => {
    const appRef = doc(db, COLLECTIONS.APPLICATIONS, applicationId);
    const appDoc = await transaction.get(appRef);

    if (!appDoc.exists()) {
      throw new Error("Application not found");
    }

    const currentStatus = appDoc.data().status;
    if (currentStatus !== "Draft") {
      throw new Error("Only draft applications can be submitted");
    }

    transaction.update(appRef, {
      status: "Submitted",
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function updateApplicationStatus(
  applicationId,
  newStatus,
  adminId,
  adminName,
  notes
) {
  const db = getFirestoreDb();

  await runTransaction(db, async (transaction) => {
    const appRef = doc(db, COLLECTIONS.APPLICATIONS, applicationId);
    const appDoc = await transaction.get(appRef);

    if (!appDoc.exists()) {
      throw new Error("Application not found");
    }

    const currentStatus = appDoc.data().status;

    if (!canTransitionTo(currentStatus, newStatus)) {
      throw new Error(
        `Invalid status transition from "${currentStatus}" to "${newStatus}". ` +
          `Valid transitions: ${
            VALID_TRANSITIONS[currentStatus]?.join(", ") || "none"
          }`
      );
    }

    const historyEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: newStatus,
      previousStatus: currentStatus,
      changedBy: adminId,
      changedByName: adminName,
      changedAt: Timestamp.now(),
      notes: notes || undefined,
    };

    transaction.update(appRef, {
      status: newStatus,
      decisionHistory: arrayUnion(historyEntry),
      updatedAt: serverTimestamp(),
    });

    const notificationRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
    transaction.set(notificationRef, {
      id: notificationRef.id,
      userId: appDoc.data().studentId,
      type: "status_change",
      title: "Application Status Updated",
      message: `Your application status has been updated to: ${newStatus}`,
      relatedApplicationId: applicationId,
      read: false,
      createdAt: serverTimestamp(),
    });
  });
}

export async function withdrawApplication(applicationId, studentId) {
  const db = getFirestoreDb();

  await runTransaction(db, async (transaction) => {
    const appRef = doc(db, COLLECTIONS.APPLICATIONS, applicationId);
    const appDoc = await transaction.get(appRef);

    if (!appDoc.exists()) {
      throw new Error("Application not found");
    }

    if (appDoc.data().studentId !== studentId) {
      throw new Error("You can only withdraw your own applications");
    }

    const currentStatus = appDoc.data().status;
    if (!canTransitionTo(currentStatus, "Withdrawn")) {
      throw new Error("This application cannot be withdrawn");
    }

    const historyEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: "Withdrawn",
      previousStatus: currentStatus,
      changedBy: studentId,
      changedAt: Timestamp.now(),
      notes: "Withdrawn by student",
    };

    transaction.update(appRef, {
      status: "Withdrawn",
      decisionHistory: arrayUnion(historyEntry),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function getDocumentsForApplication(applicationId) {
  const db = getFirestoreDb();
  const q = query(
    collection(db, COLLECTIONS.DOCUMENTS),
    where("applicationId", "==", applicationId),
    orderBy("uploadedAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function createDocumentRecord(documentData) {
  const db = getFirestoreDb();
  const docRef = doc(collection(db, COLLECTIONS.DOCUMENTS));

  await setDoc(docRef, {
    ...documentData,
    id: docRef.id,
    verified: false,
    uploadedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function verifyDocument(documentId, adminId) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, COLLECTIONS.DOCUMENTS, documentId), {
    verified: true,
    verifiedAt: serverTimestamp(),
    verifiedBy: adminId,
  });
}

export async function getNotificationsForUser(
  userId,
  unreadOnly = false,
  pageSize = 20
) {
  const db = getFirestoreDb();

  const constraints = [where("userId", "==", userId)];

  if (unreadOnly) {
    constraints.push(where("read", "==", false));
  }

  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(limit(pageSize));

  const q = query(collection(db, COLLECTIONS.NOTIFICATIONS), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function markNotificationAsRead(notificationId) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), {
    read: true,
    readAt: serverTimestamp(),
  });
}

export async function markAllNotificationsAsRead(userId) {
  const db = getFirestoreDb();
  const batch = writeBatch(db);

  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where("userId", "==", userId),
    where("read", "==", false)
  );

  const snapshot = await getDocs(q);

  snapshot.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      read: true,
      readAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

export function subscribeToNotifications(userId, callback) {
  const db = getFirestoreDb();

  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    callback(notifications);
  });
}

export async function getApplicationCountsByStatus(universityId) {
  const db = getFirestoreDb();

  const counts = {
    Draft: 0,
    Submitted: 0,
    "Under Review": 0,
    Offered: 0,
    Rejected: 0,
    Withdrawn: 0,
    "Offer Accepted": 0,
    "Offer Declined": 0,
  };

  const q = query(
    collection(db, COLLECTIONS.APPLICATIONS),
    where("universityId", "==", universityId)
  );

  const snapshot = await getDocs(q);

  snapshot.docs.forEach((docSnap) => {
    const status = docSnap.data().status;
    if (status in counts) {
      counts[status]++;
    }
  });

  return counts;
}