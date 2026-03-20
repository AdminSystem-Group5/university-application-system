/**
 * UAAMS Database Type Definitions
 * Role 3 - Backend & Database Lead (Firebase Architect)
 * 
 * These types define the structure of all Firestore collections
 * and ensure type safety throughout the application.
 */

import { Timestamp } from 'firebase/firestore';

// ============================================
// ENUMS & CONSTANTS
// ============================================

export const APPLICATION_STATUSES = [
  'Draft',
  'Submitted',
  'Under Review',
  'Offered',
  'Rejected',
  'Withdrawn',
  'Offer Accepted',
  'Offer Declined'
] as const;

export type ApplicationStatus = typeof APPLICATION_STATUSES[number];

export const USER_ROLES = ['student', 'university_admin'] as const;
export type UserRole = typeof USER_ROLES[number];

export const DOCUMENT_TYPES = [
  'transcript',
  'passport',
  'personalStatement',
  'reference',
  'other'
] as const;
export type DocumentType = typeof DOCUMENT_TYPES[number];

export const STUDY_LEVELS = ['undergraduate', 'postgraduate'] as const;
export type StudyLevel = typeof STUDY_LEVELS[number];

export const STUDY_MODES = ['full-time', 'part-time'] as const;
export type StudyMode = typeof STUDY_MODES[number];

export const NOTIFICATION_TYPES = [
  'status_change',
  'document_request',
  'deadline_reminder',
  'new_application',
  'system'
] as const;
export type NotificationType = typeof NOTIFICATION_TYPES[number];

// ============================================
// USER TYPES
// ============================================

export interface ProfileData {
  nationality?: string;
  dateOfBirth?: Timestamp;
  phone?: string;
  intendedStudyLevel?: StudyLevel;
  privacyPolicyAccepted: boolean;
  privacyPolicyAcceptedAt?: Timestamp;
}

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  profileData: ProfileData;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// UNIVERSITY TYPES
// ============================================

export interface CourseRequirements {
  minimumGrade?: string;
  englishRequirement?: string;
  otherRequirements?: string[];
}

export interface Course {
  courseId: string;
  courseName: string;
  level: StudyLevel;
  department?: string;
  requirements: CourseRequirements;
  availableIntakes: string[]; // e.g., ['September 2026', 'January 2027']
}

export interface UniversitySettings {
  acceptingApplications: boolean;
  applicationDeadline?: Timestamp;
  maxApplicationsPerStudent?: number;
}

export interface University {
  id: string;
  name: string;
  adminIds: string[];
  contactEmail: string;
  website?: string;
  logoUrl?: string;
  courses: Course[];
  settings: UniversitySettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// APPLICATION TYPES
// ============================================

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: Timestamp;
  nationality: string;
  passportNumber?: string;
  email: string;
  phone: string;
  address: Address;
}

export interface Qualification {
  institution: string;
  qualification: string;
  subject: string;
  grade: string;
  yearCompleted: number;
}

export interface EnglishProficiency {
  testType: 'IELTS' | 'TOEFL' | 'PTE' | 'Cambridge' | 'Native' | 'Other';
  overallScore?: string;
  testDate?: Timestamp;
  certificateUrl?: string;
}

export interface AcademicInfo {
  previousQualifications: Qualification[];
  currentlyStudying: boolean;
  currentInstitution?: string;
  expectedGraduationDate?: Timestamp;
  englishProficiency: EnglishProficiency;
}

export interface CourseInfo {
  courseId: string;
  courseName: string;
  intendedStartDate: string;
  studyMode: StudyMode;
}

export interface DecisionHistoryEntry {
  id: string;
  status: ApplicationStatus;
  previousStatus: ApplicationStatus;
  changedBy: string;
  changedByName?: string;
  changedAt: Timestamp;
  notes?: string;
}

export interface Application {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  universityId: string;
  universityName?: string;
  status: ApplicationStatus;
  personalInfo: PersonalInfo;
  academicInfo: AcademicInfo;
  courseInfo: CourseInfo;
  personalStatement?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  submittedAt?: Timestamp;
  decisionHistory: DecisionHistoryEntry[];
}

// ============================================
// DOCUMENT TYPES (Supporting Documents)
// ============================================

export interface SupportingDocument {
  id: string;
  applicationId: string;
  uploadedBy: string;
  fileType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number; // in bytes
  mimeType: string;
  uploadedAt: Timestamp;
  verified: boolean;
  verifiedAt?: Timestamp;
  verifiedBy?: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedApplicationId?: string;
  actionUrl?: string;
  read: boolean;
  readAt?: Timestamp;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

// ============================================
// EMAIL LOG TYPES
// ============================================

export interface EmailLog {
  id: string;
  recipientId: string;
  recipientEmail: string;
  templateId: string;
  subject: string;
  status: 'sent' | 'failed' | 'bounced';
  relatedApplicationId?: string;
  sentAt: Timestamp;
  errorMessage?: string;
}

// ============================================
// VALID STATE TRANSITIONS
// ============================================

export const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  'Draft': ['Submitted', 'Withdrawn'],
  'Submitted': ['Under Review', 'Withdrawn'],
  'Under Review': ['Offered', 'Rejected', 'Withdrawn'],
  'Offered': ['Offer Accepted', 'Offer Declined', 'Withdrawn'],
  'Rejected': [],
  'Withdrawn': [],
  'Offer Accepted': [],
  'Offer Declined': []
};

// ============================================
// HELPER TYPE GUARDS
// ============================================

export function isValidApplicationStatus(status: string): status is ApplicationStatus {
  return APPLICATION_STATUSES.includes(status as ApplicationStatus);
}

export function isValidUserRole(role: string): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}

export function isValidDocumentType(type: string): type is DocumentType {
  return DOCUMENT_TYPES.includes(type as DocumentType);
}

export function canTransitionTo(currentStatus: ApplicationStatus, newStatus: ApplicationStatus): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

// ============================================
// FORM INPUT TYPES (For Create/Update Operations)
// ============================================

export type CreateUserInput = Omit<User, 'uid' | 'createdAt' | 'updatedAt'> & {
  password: string;
};

export type UpdateUserInput = Partial<Omit<User, 'uid' | 'email' | 'role' | 'createdAt'>>;

export type CreateApplicationInput = Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'decisionHistory'>;

export type UpdateApplicationInput = Partial<Omit<Application, 'id' | 'studentId' | 'createdAt'>>;

export type CreateDocumentInput = Omit<SupportingDocument, 'id' | 'verified' | 'verifiedAt' | 'verifiedBy'>;

// ============================================
// QUERY RESULT TYPES
// ============================================

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: unknown; // Firestore DocumentSnapshot for cursor pagination
  hasMore: boolean;
  totalCount?: number;
}

export interface ApplicationFilters {
  universityId?: string;
  status?: ApplicationStatus | ApplicationStatus[];
  studentId?: string;
  submittedAfter?: Timestamp;
  submittedBefore?: Timestamp;
}
