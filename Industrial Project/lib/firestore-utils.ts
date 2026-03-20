/**
 * Firestore Utility Functions
 * Role 3 - Backend & Database Lead (Firebase Architect)
 * 
 * This module provides utility functions for common Firestore operations,
 * implementing best practices for query optimisation and error handling.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  DocumentSnapshot,
  QueryConstraint,
  writeBatch,
  runTransaction,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';

import { getFirestoreDb } from './firebase';
import type {
  User,
  University,
  Application,
  SupportingDocument,
  Notification,
  DecisionHistoryEntry,
  ApplicationFilters,
  PaginatedResult,
  ApplicationStatus,
  CreateApplicationInput,
  UpdateApplicationInput,
} from '@/types/database';
import { canTransitionTo, VALID_TRANSITIONS } from '@/types/database';

// ============================================
// COLLECTION REFERENCES
// ============================================

const COLLECTIONS = {
  USERS: 'users',
  UNIVERSITIES: 'universities',
  APPLICATIONS: 'applications',
  DOCUMENTS: 'documents',
  NOTIFICATIONS: 'notifications',
  EMAIL_LOGS: 'emailLogs',
} as const;

// ============================================
// USER OPERATIONS
// ============================================

/**
 * Get a user by their UID
 */
export async function getUserById(uid: string): Promise<User | null> {
  const db = getFirestoreDb();
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  
  if (!userDoc.exists()) {
    return null;
  }
  
  return { uid: userDoc.id, ...userDoc.data() } as User;
}

/**
 * Create a new user document
 */
export async function createUser(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<void> {
  const db = getFirestoreDb();
  await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
    ...user,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update a user's profile
 */
export async function updateUser(
  uid: string, 
  updates: Partial<Omit<User, 'uid' | 'email' | 'role' | 'createdAt'>>
): Promise<void> {
  const db = getFirestoreDb();
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// ============================================
// UNIVERSITY OPERATIONS
// ============================================

/**
 * Get all universities
 */
export async function getAllUniversities(): Promise<University[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, COLLECTIONS.UNIVERSITIES));
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as University[];
}

/**
 * Get a university by ID
 */
export async function getUniversityById(id: string): Promise<University | null> {
  const db = getFirestoreDb();
  const universityDoc = await getDoc(doc(db, COLLECTIONS.UNIVERSITIES, id));
  
  if (!universityDoc.exists()) {
    return null;
  }
  
  return { id: universityDoc.id, ...universityDoc.data() } as University;
}

/**
 * Get universities where user is an admin
 */
export async function getUniversitiesForAdmin(adminUid: string): Promise<University[]> {
  const db = getFirestoreDb();
  const q = query(
    collection(db, COLLECTIONS.UNIVERSITIES),
    where('adminIds', 'array-contains', adminUid)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as University[];
}

// ============================================
// APPLICATION OPERATIONS
// ============================================

/**
 * Create a new application
 */
export async function createApplication(
  input: CreateApplicationInput
): Promise<string> {
  const db = getFirestoreDb();
  const applicationsRef = collection(db, COLLECTIONS.APPLICATIONS);
  const newDocRef = doc(applicationsRef);
  
  await setDoc(newDocRef, {
    ...input,
    id: newDocRef.id,
    status: 'Draft',
    decisionHistory: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return newDocRef.id;
}

/**
 * Get an application by ID
 */
export async function getApplicationById(id: string): Promise<Application | null> {
  const db = getFirestoreDb();
  const appDoc = await getDoc(doc(db, COLLECTIONS.APPLICATIONS, id));
  
  if (!appDoc.exists()) {
    return null;
  }
  
  return { id: appDoc.id, ...appDoc.data() } as Application;
}

/**
 * Get applications for a student with pagination
 */
export async function getApplicationsForStudent(
  studentId: string,
  pageSize: number = 10,
  lastDoc?: DocumentSnapshot
): Promise<PaginatedResult<Application>> {
  const db = getFirestoreDb();
  
  const constraints: QueryConstraint[] = [
    where('studentId', '==', studentId),
    orderBy('createdAt', 'desc'),
    limit(pageSize + 1), // Fetch one extra to check if there are more
  ];
  
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  
  const q = query(collection(db, COLLECTIONS.APPLICATIONS), ...constraints);
  const snapshot = await getDocs(q);
  
  const hasMore = snapshot.docs.length > pageSize;
  const docs = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs;
  
  return {
    data: docs.map(doc => ({ id: doc.id, ...doc.data() })) as Application[],
    lastDoc: docs[docs.length - 1] || null,
    hasMore,
  };
}

/**
 * Get applications for a university with filtering and pagination
 */
export async function getApplicationsForUniversity(
  universityId: string,
  filters: Omit<ApplicationFilters, 'universityId'> = {},
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<PaginatedResult<Application>> {
  const db = getFirestoreDb();
  
  const constraints: QueryConstraint[] = [
    where('universityId', '==', universityId),
  ];
  
  // Add status filter
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      constraints.push(where('status', 'in', filters.status));
    } else {
      constraints.push(where('status', '==', filters.status));
    }
  }
  
  // Add date filters
  if (filters.submittedAfter) {
    constraints.push(where('submittedAt', '>=', filters.submittedAfter));
  }
  
  if (filters.submittedBefore) {
    constraints.push(where('submittedAt', '<=', filters.submittedBefore));
  }
  
  // Add ordering and pagination
  constraints.push(orderBy('submittedAt', 'desc'));
  constraints.push(limit(pageSize + 1));
  
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  
  const q = query(collection(db, COLLECTIONS.APPLICATIONS), ...constraints);
  const snapshot = await getDocs(q);
  
  const hasMore = snapshot.docs.length > pageSize;
  const docs = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs;
  
  return {
    data: docs.map(doc => ({ id: doc.id, ...doc.data() })) as Application[],
    lastDoc: docs[docs.length - 1] || null,
    hasMore,
  };
}

/**
 * Update an application (for students - draft editing)
 */
export async function updateApplication(
  applicationId: string,
  updates: UpdateApplicationInput
): Promise<void> {
  const db = getFirestoreDb();
  await updateDoc(doc(db, COLLECTIONS.APPLICATIONS, applicationId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Submit an application (student action)
 */
export async function submitApplication(applicationId: string): Promise<void> {
  const db = getFirestoreDb();
  
  await runTransaction(db, async (transaction) => {
    const appRef = doc(db, COLLECTIONS.APPLICATIONS, applicationId);
    const appDoc = await transaction.get(appRef);
    
    if (!appDoc.exists()) {
      throw new Error('Application not found');
    }
    
    const currentStatus = appDoc.data().status;
    if (currentStatus !== 'Draft') {
      throw new Error('Only draft applications can be submitted');
    }
    
    transaction.update(appRef, {
      status: 'Submitted',
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

/**
 * Update application status (admin action) with decision history logging
 */
export async function updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus,
  adminId: string,
  adminName: string,
  notes?: string
): Promise<void> {
  const db = getFirestoreDb();
  
  await runTransaction(db, async (transaction) => {
    const appRef = doc(db, COLLECTIONS.APPLICATIONS, applicationId);
    const appDoc = await transaction.get(appRef);
    
    if (!appDoc.exists()) {
      throw new Error('Application not found');
    }
    
    const currentStatus = appDoc.data().status as ApplicationStatus;
    
    // Validate state transition
    if (!canTransitionTo(currentStatus, newStatus)) {
      throw new Error(
        `Invalid status transition from "${currentStatus}" to "${newStatus}". ` +
        `Valid transitions: ${VALID_TRANSITIONS[currentStatus].join(', ') || 'none'}`
      );
    }
    
    // Create decision history entry
    const historyEntry: DecisionHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: newStatus,
      previousStatus: currentStatus,
      changedBy: adminId,
      changedByName: adminName,
      changedAt: Timestamp.now(),
      notes: notes || undefined,
    };
    
    // Update application
    transaction.update(appRef, {
      status: newStatus,
      decisionHistory: arrayUnion(historyEntry),
      updatedAt: serverTimestamp(),
    });
    
    // Create notification for student
    const notificationRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
    transaction.set(notificationRef, {
      id: notificationRef.id,
      userId: appDoc.data().studentId,
      type: 'status_change',
      title: 'Application Status Updated',
      message: `Your application status has been updated to: ${newStatus}`,
      relatedApplicationId: applicationId,
      read: false,
      createdAt: serverTimestamp(),
    });
  });
}

/**
 * Withdraw an application (student action)
 */
export async function withdrawApplication(
  applicationId: string,
  studentId: string
): Promise<void> {
  const db = getFirestoreDb();
  
  await runTransaction(db, async (transaction) => {
    const appRef = doc(db, COLLECTIONS.APPLICATIONS, applicationId);
    const appDoc = await transaction.get(appRef);
    
    if (!appDoc.exists()) {
      throw new Error('Application not found');
    }
    
    if (appDoc.data().studentId !== studentId) {
      throw new Error('You can only withdraw your own applications');
    }
    
    const currentStatus = appDoc.data().status as ApplicationStatus;
    if (!canTransitionTo(currentStatus, 'Withdrawn')) {
      throw new Error('This application cannot be withdrawn');
    }
    
    const historyEntry: DecisionHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'Withdrawn',
      previousStatus: currentStatus,
      changedBy: studentId,
      changedAt: Timestamp.now(),
      notes: 'Withdrawn by student',
    };
    
    transaction.update(appRef, {
      status: 'Withdrawn',
      decisionHistory: arrayUnion(historyEntry),
      updatedAt: serverTimestamp(),
    });
  });
}

// ============================================
// DOCUMENT OPERATIONS
// ============================================

/**
 * Get documents for an application
 */
export async function getDocumentsForApplication(
  applicationId: string
): Promise<SupportingDocument[]> {
  const db = getFirestoreDb();
  const q = query(
    collection(db, COLLECTIONS.DOCUMENTS),
    where('applicationId', '==', applicationId),
    orderBy('uploadedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as SupportingDocument[];
}

/**
 * Add a document record (after file upload to Storage)
 */
export async function createDocumentRecord(
  document: Omit<SupportingDocument, 'id' | 'verified' | 'verifiedAt' | 'verifiedBy'>
): Promise<string> {
  const db = getFirestoreDb();
  const docRef = doc(collection(db, COLLECTIONS.DOCUMENTS));
  
  await setDoc(docRef, {
    ...document,
    id: docRef.id,
    verified: false,
    uploadedAt: serverTimestamp(),
  });
  
  return docRef.id;
}

/**
 * Verify a document (admin action)
 */
export async function verifyDocument(
  documentId: string,
  adminId: string
): Promise<void> {
  const db = getFirestoreDb();
  await updateDoc(doc(db, COLLECTIONS.DOCUMENTS, documentId), {
    verified: true,
    verifiedAt: serverTimestamp(),
    verifiedBy: adminId,
  });
}

// ============================================
// NOTIFICATION OPERATIONS
// ============================================

/**
 * Get notifications for a user
 */
export async function getNotificationsForUser(
  userId: string,
  unreadOnly: boolean = false,
  pageSize: number = 20
): Promise<Notification[]> {
  const db = getFirestoreDb();
  
  const constraints: QueryConstraint[] = [
    where('userId', '==', userId),
  ];
  
  if (unreadOnly) {
    constraints.push(where('read', '==', false));
  }
  
  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limit(pageSize));
  
  const q = query(collection(db, COLLECTIONS.NOTIFICATIONS), ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Notification[];
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const db = getFirestoreDb();
  await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), {
    read: true,
    readAt: serverTimestamp(),
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const db = getFirestoreDb();
  const batch = writeBatch(db);
  
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('userId', '==', userId),
    where('read', '==', false)
  );
  
  const snapshot = await getDocs(q);
  
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      read: true,
      readAt: serverTimestamp(),
    });
  });
  
  await batch.commit();
}

/**
 * Subscribe to real-time notifications
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): Unsubscribe {
  const db = getFirestoreDb();
  
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
    
    callback(notifications);
  });
}

// ============================================
// ANALYTICS / COUNTS
// ============================================

/**
 * Get application counts by status for a university
 */
export async function getApplicationCountsByStatus(
  universityId: string
): Promise<Record<ApplicationStatus, number>> {
  const db = getFirestoreDb();
  
  const counts: Record<string, number> = {
    'Draft': 0,
    'Submitted': 0,
    'Under Review': 0,
    'Offered': 0,
    'Rejected': 0,
    'Withdrawn': 0,
    'Offer Accepted': 0,
    'Offer Declined': 0,
  };
  
  // Note: In production, you might want to use aggregation queries
  // or maintain separate counter documents for better performance
  const q = query(
    collection(db, COLLECTIONS.APPLICATIONS),
    where('universityId', '==', universityId)
  );
  
  const snapshot = await getDocs(q);
  
  snapshot.docs.forEach(doc => {
    const status = doc.data().status as ApplicationStatus;
    if (status in counts) {
      counts[status]++;
    }
  });
  
  return counts as Record<ApplicationStatus, number>;
}
