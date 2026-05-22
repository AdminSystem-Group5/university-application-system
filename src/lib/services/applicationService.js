import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
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

  const data = snapshot.data();

  // Flatten nested objects written by the agent form so all consumers see flat fields.
  const personalInfo = data.personalInfo  || {};
  const academicInfo = data.academicInfo  || {};
  const courseInfo   = data.courseInfo    || {};

  // Load student documents and student email in parallel
  const [studentDocs, studentEmail] = await Promise.all([
    fetchStudentDocuments(data.studentId),
    fetchStudentEmail(data.studentId, data.studentEmail || data.email),
  ]);

  return {
    id: snapshot.id,
    ...data,
    fullName:             data.fullName             || `${personalInfo.firstName || ""} ${personalInfo.lastName || ""}`.trim() || null,
    dateOfBirth:          data.dateOfBirth          || personalInfo.dateOfBirth          || null,
    nationality:          data.nationality          || personalInfo.nationality          || null,
    passportNumber:       data.passportNumber       || personalInfo.passportNumber       || null,
    highestQualification: data.highestQualification || academicInfo.highestQualification || null,
    institutionName:      data.institutionName      || academicInfo.institutionName      || null,
    graduationYear:       data.graduationYear       || academicInfo.graduationYear       || null,
    gpaGrade:             data.gpaGrade             || academicInfo.gpaGrade             || null,
    courseName:           data.courseName           || courseInfo.courseName             || null,
    intendedIntake:       data.intendedIntake        || courseInfo.intendedStartDate      || null,
    universityName:       data.universityName        || data.selectedUniversity          || null,
    applicationStatus:    data.applicationStatus    || data.status                      || "Draft",
    studentName:          data.studentName          || data.fullName                    ||
                          `${personalInfo.firstName || ""} ${personalInfo.lastName || ""}`.trim() || null,
    studentEmail:         studentEmail,
    _studentDocuments:    studentDocs,
  };
}

async function fetchStudentDocuments(studentId) {
  if (!studentId) return {};
  try {
    const db = getFirestoreDb();
    const snap = await getDoc(doc(db, "studentDocuments", studentId));
    return snap.exists() ? (snap.data()?.documents || {}) : {};
  } catch {
    return {};
  }
}

async function fetchStudentEmail(studentId, existingEmail) {
  if (existingEmail) return existingEmail;
  if (!studentId) return null;
  try {
    const db = getFirestoreDb();
    const snap = await getDoc(doc(db, "users", studentId));
    return snap.exists() ? (snap.data()?.email || null) : null;
  } catch {
    return null;
  }
}

export function subscribeToApplications(onApplicationsChange, onError, universityId = null) {
  const db = getFirestoreDb();
  const applicationsRef = collection(db, "applications");
  const q = universityId
    ? query(applicationsRef, where("universityId", "==", universityId), orderBy("createdAt", "desc"))
    : query(applicationsRef, orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const applications = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const personalInfo = data.personalInfo || {};
        const academicInfo = data.academicInfo || {};
        const courseInfo   = data.courseInfo   || {};
        return {
          id: docSnap.id,
          ...data,
          fullName:             data.fullName             || `${personalInfo.firstName || ""} ${personalInfo.lastName || ""}`.trim() || null,
          dateOfBirth:          data.dateOfBirth          || personalInfo.dateOfBirth          || null,
          nationality:          data.nationality          || personalInfo.nationality          || null,
          passportNumber:       data.passportNumber       || personalInfo.passportNumber       || null,
          highestQualification: data.highestQualification || academicInfo.highestQualification || null,
          institutionName:      data.institutionName      || academicInfo.institutionName      || null,
          graduationYear:       data.graduationYear       || academicInfo.graduationYear       || null,
          gpaGrade:             data.gpaGrade             || academicInfo.gpaGrade             || null,
          courseName:        data.courseName      || courseInfo.courseName    || null,
          intendedIntake:    data.intendedIntake  || courseInfo.intendedStartDate || null,
          universityName:    data.universityName  || data.selectedUniversity || null,
          // Normalise status + student name for table display
          applicationStatus: data.applicationStatus || data.status           || "Draft",
          studentName:       data.studentName     || data.fullName           ||
                             `${personalInfo.firstName || ""} ${personalInfo.lastName || ""}`.trim() || null,
        };
      });

      onApplicationsChange(applications);
    },
    (error) => {
      console.error("Error listening to applications:", error);
      onError?.(error);
    }
  );
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
    changedBy: adminInfo?.uid || null,
    changedByName: adminInfo?.name || "Admin",
    eventType: "status_change",
  });

  if (studentId && finalMessage) {
    await addDoc(collection(db, "notifications"), {
      userId: studentId,
      studentId,
      type: "application_status_update",
      applicationId: currentData?.applicationId || id,
      applicationDocumentId: id,
      status: newStatus,
      title: `Application ${newStatus}`,
      message: finalMessage,
      read: false,
      createdAt: serverTimestamp(),
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