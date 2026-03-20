/**
 * Application Workflow Logic
 * Role 3 - Backend & Database Lead (Firebase Architect)
 * 
 * This module implements the finite state machine pattern for application
 * status management, following Gamma et al.'s (1994) State Pattern design.
 * 
 * The workflow ensures data integrity by enforcing valid state transitions
 * and provides comprehensive audit logging for compliance with GDPR Article 15.
 */

import type { ApplicationStatus, Application, DecisionHistoryEntry } from '@/types/database';
import { VALID_TRANSITIONS, canTransitionTo } from '@/types/database';

// ============================================
// WORKFLOW STATE MACHINE
// ============================================

/**
 * Application State Machine
 * 
 * Implements a finite state machine for managing application lifecycle.
 * Each state has defined entry/exit conditions and valid transitions.
 */
export class ApplicationStateMachine {
  private currentStatus: ApplicationStatus;
  private applicationId: string;

  constructor(application: Application) {
    this.currentStatus = application.status;
    this.applicationId = application.id;
  }

  /**
   * Get valid next states from current state
   */
  getValidTransitions(): ApplicationStatus[] {
    return VALID_TRANSITIONS[this.currentStatus] || [];
  }

  /**
   * Check if a transition is valid
   */
  canTransitionTo(newStatus: ApplicationStatus): boolean {
    return canTransitionTo(this.currentStatus, newStatus);
  }

  /**
   * Get current status
   */
  getCurrentStatus(): ApplicationStatus {
    return this.currentStatus;
  }

  /**
   * Check if application is in a terminal state
   */
  isTerminal(): boolean {
    return this.getValidTransitions().length === 0;
  }

  /**
   * Check if application can be edited by student
   */
  canStudentEdit(): boolean {
    return this.currentStatus === 'Draft';
  }

  /**
   * Check if application can be withdrawn
   */
  canWithdraw(): boolean {
    return this.canTransitionTo('Withdrawn');
  }

  /**
   * Check if admin can make decisions on this application
   */
  canAdminReview(): boolean {
    return ['Submitted', 'Under Review'].includes(this.currentStatus);
  }
}

// ============================================
// WORKFLOW VALIDATION FUNCTIONS
// ============================================

/**
 * Validate that an application is complete before submission
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateApplicationForSubmission(application: Application): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required personal info
  if (!application.personalInfo) {
    errors.push('Personal information is required');
  } else {
    if (!application.personalInfo.firstName?.trim()) {
      errors.push('First name is required');
    }
    if (!application.personalInfo.lastName?.trim()) {
      errors.push('Last name is required');
    }
    if (!application.personalInfo.email?.trim()) {
      errors.push('Email address is required');
    }
    if (!application.personalInfo.nationality?.trim()) {
      errors.push('Nationality is required');
    }
    if (!application.personalInfo.dateOfBirth) {
      errors.push('Date of birth is required');
    }
    if (!application.personalInfo.address?.line1) {
      errors.push('Address is required');
    }
  }

  // Check required academic info
  if (!application.academicInfo) {
    errors.push('Academic information is required');
  } else {
    if (!application.academicInfo.previousQualifications?.length) {
      errors.push('At least one previous qualification is required');
    }
    if (!application.academicInfo.englishProficiency) {
      errors.push('English proficiency information is required');
    }
  }

  // Check course selection
  if (!application.courseInfo) {
    errors.push('Course selection is required');
  } else {
    if (!application.courseInfo.courseId) {
      errors.push('Course must be selected');
    }
    if (!application.courseInfo.intendedStartDate) {
      errors.push('Intended start date is required');
    }
  }

  // Warnings (non-blocking but recommended)
  if (!application.personalStatement?.trim()) {
    warnings.push('Personal statement is recommended for a stronger application');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate status transition with detailed error message
 */
export function validateStatusTransition(
  currentStatus: ApplicationStatus,
  newStatus: ApplicationStatus,
  actorRole: 'student' | 'university_admin'
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if transition is valid
  if (!canTransitionTo(currentStatus, newStatus)) {
    errors.push(
      `Cannot transition from "${currentStatus}" to "${newStatus}". ` +
      `Valid transitions are: ${VALID_TRANSITIONS[currentStatus].join(', ') || 'none (terminal state)'}`
    );
    return { isValid: false, errors, warnings };
  }

  // Check role-based permissions
  if (actorRole === 'student') {
    // Students can only: submit drafts, withdraw, accept/decline offers
    const studentAllowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      'Draft': ['Submitted', 'Withdrawn'],
      'Submitted': ['Withdrawn'],
      'Under Review': ['Withdrawn'],
      'Offered': ['Offer Accepted', 'Offer Declined', 'Withdrawn'],
      'Rejected': [],
      'Withdrawn': [],
      'Offer Accepted': [],
      'Offer Declined': [],
    };

    if (!studentAllowedTransitions[currentStatus]?.includes(newStatus)) {
      errors.push(`Students cannot change status from "${currentStatus}" to "${newStatus}"`);
    }
  }

  if (actorRole === 'university_admin') {
    // Admins can: start review, make offers, reject
    const adminAllowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      'Draft': [],
      'Submitted': ['Under Review'],
      'Under Review': ['Offered', 'Rejected'],
      'Offered': [],
      'Rejected': [],
      'Withdrawn': [],
      'Offer Accepted': [],
      'Offer Declined': [],
    };

    if (!adminAllowedTransitions[currentStatus]?.includes(newStatus)) {
      errors.push(`Administrators cannot change status from "${currentStatus}" to "${newStatus}"`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================
// DECISION HISTORY HELPERS
// ============================================

/**
 * Format decision history for display
 */
export function formatDecisionHistory(history: DecisionHistoryEntry[]): string {
  if (!history || history.length === 0) {
    return 'No decision history available';
  }

  return history
    .sort((a, b) => b.changedAt.toMillis() - a.changedAt.toMillis())
    .map((entry) => {
      const date = entry.changedAt.toDate().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const actor = entry.changedByName || entry.changedBy;
      const notes = entry.notes ? ` - "${entry.notes}"` : '';
      
      return `[${date}] ${entry.previousStatus} → ${entry.status} (by ${actor})${notes}`;
    })
    .join('\n');
}

/**
 * Get the latest decision entry
 */
export function getLatestDecision(history: DecisionHistoryEntry[]): DecisionHistoryEntry | null {
  if (!history || history.length === 0) {
    return null;
  }

  return history.reduce((latest, current) => {
    if (!latest || current.changedAt.toMillis() > latest.changedAt.toMillis()) {
      return current;
    }
    return latest;
  }, null as DecisionHistoryEntry | null);
}

/**
 * Calculate time spent in each status
 */
export interface StatusDuration {
  status: ApplicationStatus;
  startTime: Date;
  endTime: Date | null;
  durationMs: number | null;
  durationFormatted: string;
}

export function calculateStatusDurations(history: DecisionHistoryEntry[]): StatusDuration[] {
  if (!history || history.length === 0) {
    return [];
  }

  // Sort by time ascending
  const sorted = [...history].sort((a, b) => a.changedAt.toMillis() - b.changedAt.toMillis());
  
  const durations: StatusDuration[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const nextEntry = sorted[i + 1];
    
    const startTime = entry.changedAt.toDate();
    const endTime = nextEntry ? nextEntry.changedAt.toDate() : null;
    const durationMs = endTime ? endTime.getTime() - startTime.getTime() : null;

    durations.push({
      status: entry.status,
      startTime,
      endTime,
      durationMs,
      durationFormatted: durationMs ? formatDuration(durationMs) : 'Ongoing',
    });
  }

  return durations;
}

/**
 * Format milliseconds to human-readable duration
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  return `${seconds} second${seconds !== 1 ? 's' : ''}`;
}

// ============================================
// STATUS DISPLAY HELPERS
// ============================================

/**
 * Get display properties for a status
 */
export interface StatusDisplay {
  label: string;
  color: string;
  bgColor: string;
  description: string;
  icon: string;
}

export function getStatusDisplay(status: ApplicationStatus): StatusDisplay {
  const displays: Record<ApplicationStatus, StatusDisplay> = {
    'Draft': {
      label: 'Draft',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      description: 'Application is being prepared',
      icon: '📝',
    },
    'Submitted': {
      label: 'Submitted',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      description: 'Application submitted and awaiting review',
      icon: '📤',
    },
    'Under Review': {
      label: 'Under Review',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      description: 'Application is being reviewed by the university',
      icon: '🔍',
    },
    'Offered': {
      label: 'Offer Made',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      description: 'Congratulations! You have received an offer',
      icon: '🎉',
    },
    'Rejected': {
      label: 'Unsuccessful',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      description: 'Application was not successful',
      icon: '❌',
    },
    'Withdrawn': {
      label: 'Withdrawn',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      description: 'Application was withdrawn',
      icon: '↩️',
    },
    'Offer Accepted': {
      label: 'Offer Accepted',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-100',
      description: 'You have accepted the offer',
      icon: '✅',
    },
    'Offer Declined': {
      label: 'Offer Declined',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
      description: 'You have declined the offer',
      icon: '🚫',
    },
  };

  return displays[status] || displays['Draft'];
}

/**
 * Get progress percentage for timeline display
 */
export function getStatusProgress(status: ApplicationStatus): number {
  const progressMap: Record<ApplicationStatus, number> = {
    'Draft': 10,
    'Submitted': 30,
    'Under Review': 50,
    'Offered': 80,
    'Rejected': 100,
    'Withdrawn': 100,
    'Offer Accepted': 100,
    'Offer Declined': 100,
  };

  return progressMap[status] || 0;
}
