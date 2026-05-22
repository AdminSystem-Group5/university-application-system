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

/**
 * Application status transition rules
 * This replaces the missing "@/types/database" import.
 */
export const VALID_TRANSITIONS = {
  Draft: ["Submitted", "Withdrawn"],
  Submitted: ["Under Review", "Offered", "Rejected", "Withdrawn"],
  "Under Review": ["Offered", "Rejected", "Withdrawn"],
  Offered: ["Offer Accepted", "Offer Declined", "Withdrawn"],
  Rejected: [],
  Withdrawn: [],
  "Offer Accepted": [],
  "Offer Declined": [],
};

export function canTransitionTo(currentStatus, newStatus) {
  if (!currentStatus || !newStatus) {
    return false;
  }

  const allowedTransitions = VALID_TRANSITIONS[currentStatus];

  if (!allowedTransitions) {
    return false;
  }

  return allowedTransitions.includes(newStatus);
}

const COLLECTIONS = {
  USERS: "users",
  UNIVERSITIES: "universities",
  APPLICATIONS: "applications",
  DOCUMENTS: "documents",
  NOTIFICATIONS: "notifications",
  EMAIL_LOGS: "emailLogs",
  AGENT_STUDENT_LINKS: "agentStudentLinks",
  PAYMENTS: "payments",
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

  const data = appDoc.data();

  // Flatten nested objects written by the agent form so all consumers see flat fields.
  const personalInfo  = data.personalInfo  || {};
  const academicInfo  = data.academicInfo  || {};
  const courseInfo    = data.courseInfo    || {};

  return {
    id: appDoc.id,
    ...data,
    // Personal info — flat wins, nested is fallback
    fullName:             data.fullName             || `${personalInfo.firstName || ""} ${personalInfo.lastName || ""}`.trim() || null,
    dateOfBirth:          data.dateOfBirth          || personalInfo.dateOfBirth          || null,
    nationality:          data.nationality          || personalInfo.nationality          || null,
    passportNumber:       data.passportNumber       || personalInfo.passportNumber       || null,
    // Academic info
    highestQualification: data.highestQualification || academicInfo.highestQualification || null,
    institutionName:      data.institutionName      || academicInfo.institutionName      || null,
    graduationYear:       data.graduationYear       || academicInfo.graduationYear       || null,
    gpaGrade:             data.gpaGrade             || academicInfo.gpaGrade             || null,
    // Course info
    courseName:           data.courseName           || courseInfo.courseName             || null,
    intendedIntake:       data.intendedIntake        || courseInfo.intendedStartDate      || null,
    universityName:       data.universityName        || data.selectedUniversity          || null,
  };
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
    data: docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })),
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
    data: docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })),
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
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      status: newStatus,
      previousStatus: currentStatus,
      changedBy: adminId,
      changedByName: adminName,
      changedAt: Timestamp.now(),
      notes: notes || "",
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
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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

// ============================================
// PAYMENT FUNCTIONS
// ============================================

export async function createPaymentRecord(data) {
  const db = getFirestoreDb();
  const paymentRef = doc(collection(db, COLLECTIONS.PAYMENTS));

  await setDoc(paymentRef, {
    ...data,
    id: paymentRef.id,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  return paymentRef.id;
}

export async function getPaymentForApplication(applicationId) {
  const db = getFirestoreDb();

  const q = query(
    collection(db, COLLECTIONS.PAYMENTS),
    where("applicationId", "==", applicationId),
    orderBy("createdAt", "desc"),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

export async function markPaymentPaid(paymentId, stripePaymentIntentId) {
  const db = getFirestoreDb();

  await updateDoc(doc(db, COLLECTIONS.PAYMENTS, paymentId), {
    status: "paid",
    stripePaymentIntentId,
    paidAt: serverTimestamp(),
  });
}

export async function setApplicationPaymentStatus(applicationId, paymentStatus) {
  const db = getFirestoreDb();

  await updateDoc(doc(db, COLLECTIONS.APPLICATIONS, applicationId), {
    paymentStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function saveDraftAndGetId(applicationData) {
  const db = getFirestoreDb();
  const applicationsRef = collection(db, COLLECTIONS.APPLICATIONS);
  const newDocRef = doc(applicationsRef);

  await setDoc(newDocRef, {
    ...applicationData,
    id: newDocRef.id,
    status: "Draft",
    applicationStatus: "Draft",
    paymentStatus: "unpaid",
    decisionHistory: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return newDocRef.id;
}

// ============================================
// AGENT / COUNSELOR FUNCTIONS
// ============================================

function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createAgentInvite(agentUid, agentName, agencyName) {
  const db = getFirestoreDb();
  const linkRef = doc(collection(db, COLLECTIONS.AGENT_STUDENT_LINKS));
  const inviteCode = generateInviteCode();

  await setDoc(linkRef, {
    id: linkRef.id,
    agentId: agentUid,
    agentName,
    agencyName,
    studentId: null,
    studentName: null,
    studentEmail: null,
    inviteCode,
    status: "pending",
    createdAt: serverTimestamp(),
    linkedAt: null,
  });

  return inviteCode;
}

export async function acceptAgentInvite(studentUid, studentName, studentEmail, inviteCode) {
  const db = getFirestoreDb();

  const q = query(
    collection(db, COLLECTIONS.AGENT_STUDENT_LINKS),
    where("inviteCode", "==", inviteCode.toUpperCase().trim()),
    where("status", "==", "pending")
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error("Invalid or expired invite code.");
  }

  const linkDoc = snapshot.docs[0];
  const agentId = linkDoc.data().agentId;

  await updateDoc(linkDoc.ref, {
    studentId: studentUid,
    studentName,
    studentEmail,
    status: "active",
    linkedAt: serverTimestamp(),
  });

  // Lookup doc (agentId_studentId) is created by ensureAgentLookupDocuments when the
  // agent next loads their students page. Creating it here would fail because the student
  // (not the agent) is authenticated, so request.auth.uid != agentId in the create rule.

  return linkDoc.id;
}

// Creates missing lookup documents for existing active links.
// Call this once on agent page load to fix links created before the lookup doc pattern.
export async function ensureAgentLookupDocuments(agentUid) {
  const db = getFirestoreDb();

  const q = query(
    collection(db, COLLECTIONS.AGENT_STUDENT_LINKS),
    where("agentId", "==", agentUid),
    where("status", "==", "active")
  );

  const snapshot = await getDocs(q);

  const writes = [];
  for (const snap of snapshot.docs) {
    const data = snap.data();
    if (!data.studentId || data.type === "lookup") continue;

    const lookupRef = doc(db, COLLECTIONS.AGENT_STUDENT_LINKS, `${agentUid}_${data.studentId}`);
    // Always setDoc — create if missing, overwrite if already exists (idempotent).
    writes.push(setDoc(lookupRef, {
      agentId: agentUid,
      studentId: data.studentId,
      studentName: data.studentName || null,
      studentEmail: data.studentEmail || null,
      status: "active",
      type: "lookup",
      linkedAt: data.linkedAt || serverTimestamp(),
    }));
  }

  await Promise.all(writes);
}

export async function getLinksForAgent(agentUid) {
  const db = getFirestoreDb();

  const q = query(
    collection(db, COLLECTIONS.AGENT_STUDENT_LINKS),
    where("agentId", "==", agentUid),
    where("status", "in", ["active", "pending"])
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function getActiveLinksForAgent(agentUid) {
  const db = getFirestoreDb();

  const q = query(
    collection(db, COLLECTIONS.AGENT_STUDENT_LINKS),
    where("agentId", "==", agentUid),
    where("status", "==", "active")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function getLinksForStudent(studentUid) {
  const db = getFirestoreDb();

  const q = query(
    collection(db, COLLECTIONS.AGENT_STUDENT_LINKS),
    where("studentId", "==", studentUid),
    where("status", "==", "active")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function revokeAgentLink(linkId) {
  const db = getFirestoreDb();

  await updateDoc(doc(db, COLLECTIONS.AGENT_STUDENT_LINKS, linkId), {
    status: "revoked",
  });
}

export async function getApplicationsForAgent(agentUid) {
  const db = getFirestoreDb();
  const results = [];
  const seenIds = new Set();

  // Query 1: applications the agent directly submitted (submittedByAgent == agentUid)
  // Rules allow: resource.data.submittedByAgent == request.auth.uid
  const bySubmitterQuery = query(
    collection(db, COLLECTIONS.APPLICATIONS),
    where("submittedByAgent", "==", agentUid),
    orderBy("createdAt", "desc")
  );
  const submitterSnap = await getDocs(bySubmitterQuery);
  submitterSnap.docs.forEach((docSnap) => {
    seenIds.add(docSnap.id);
    results.push({ id: docSnap.id, ...docSnap.data() });
  });

  // Query 2: applications tagged with agentId field (agent-created apps going forward)
  // Rules allow: resource.data.get('agentId', '') == request.auth.uid
  // This query does NOT use orderBy so no composite index is required.
  const byAgentIdQuery = query(
    collection(db, COLLECTIONS.APPLICATIONS),
    where("agentId", "==", agentUid)
  );
  const agentIdSnap = await getDocs(byAgentIdQuery);
  agentIdSnap.docs.forEach((docSnap) => {
    if (!seenIds.has(docSnap.id)) {
      seenIds.add(docSnap.id);
      results.push({ id: docSnap.id, ...docSnap.data() });
    }
  });

  results.sort((a, b) => {
    const aTime = a.createdAt?.toDate?.()?.getTime() ?? 0;
    const bTime = b.createdAt?.toDate?.()?.getTime() ?? 0;
    return bTime - aTime;
  });

  return results;
}

export async function createApplicationForStudent(agentUid, agentName, agencyName, studentId, applicationData) {
  const db = getFirestoreDb();
  const applicationsRef = collection(db, COLLECTIONS.APPLICATIONS);
  const newDocRef = doc(applicationsRef);

  await setDoc(newDocRef, {
    ...applicationData,
    id: newDocRef.id,
    studentId,
    submittedByAgent: agentUid,
    agentId: agentUid,
    agentName,
    agencyName,
    status: "Draft",
    decisionHistory: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return newDocRef.id;
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