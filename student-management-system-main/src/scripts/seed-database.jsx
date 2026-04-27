/**
 * Database Seed Script
 * Role 3 - Backend & Database Lead (Firebase Architect)
 * 
 * This script populates the Firestore database with sample data
 * for development and testing purposes.
 * 
 * Usage: npx ts-node scripts/seed-database.ts
 * 
 * WARNING: This script will overwrite existing data in the
 * specified collections. Only run against development databases.
 */

import { initializeApp, cert, serviceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
// In production, use environment variable for service account
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// ============================================
// SAMPLE DATA
// ============================================

const universities = [
  {
    id: 'uni-solent',
    name: 'Southampton Solent University',
    contactEmail: 'admissions@solent.ac.uk',
    website: 'https://www.solent.ac.uk',
    adminIds: [], // Will be populated with admin user IDs
    courses: [
      {
        courseId: 'bsc-computing',
        courseName: 'BSc (Hons) Computing',
        level: 'undergraduate',
        department: 'School of Media Arts and Technology',
        requirements: {
          minimumGrade: 'BBC',
          englishRequirement: 'IELTS 6.0',
        },
        availableIntakes: ['September 2026', 'January 2027'],
      },
      {
        courseId: 'msc-data-science',
        courseName: 'MSc Data Science',
        level: 'postgraduate',
        department: 'School of Media Arts and Technology',
        requirements: {
          minimumGrade: '2:1 Honours degree',
          englishRequirement: 'IELTS 6.5',
        },
        availableIntakes: ['September 2026'],
      },
      {
        courseId: 'bsc-software-eng',
        courseName: 'BSc (Hons) Software Engineering',
        level: 'undergraduate',
        department: 'School of Media Arts and Technology',
        requirements: {
          minimumGrade: 'BBC',
          englishRequirement: 'IELTS 6.0',
        },
        availableIntakes: ['September 2026', 'January 2027'],
      },
    ],
    settings: {
      acceptingApplications: true,
      maxApplicationsPerStudent: 3,
    },
  },
  {
    id: 'uni-southampton',
    name: 'University of Southampton',
    contactEmail: 'admissions@soton.ac.uk',
    website: 'https://www.southampton.ac.uk',
    adminIds: [],
    courses: [
      {
        courseId: 'bsc-cs',
        courseName: 'BSc Computer Science',
        level: 'undergraduate',
        department: 'Electronics and Computer Science',
        requirements: {
          minimumGrade: 'A*AA',
          englishRequirement: 'IELTS 6.5',
        },
        availableIntakes: ['September 2026'],
      },
      {
        courseId: 'msc-ai',
        courseName: 'MSc Artificial Intelligence',
        level: 'postgraduate',
        department: 'Electronics and Computer Science',
        requirements: {
          minimumGrade: 'First class Honours',
          englishRequirement: 'IELTS 7.0',
        },
        availableIntakes: ['September 2026'],
      },
    ],
    settings: {
      acceptingApplications: true,
      maxApplicationsPerStudent: 2,
    },
  },
];

const sampleUsers = {
  students: [
    {
      uid: 'student-001',
      email: 'student1@example.com',
      role: 'student',
      displayName: 'Alice Johnson',
      profileData: {
        nationality: 'British',
        intendedStudyLevel: 'undergraduate',
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: Timestamp.now(),
      },
    },
    {
      uid: 'student-002',
      email: 'student2@example.com',
      role: 'student',
      displayName: 'Bob Smith',
      profileData: {
        nationality: 'International',
        intendedStudyLevel: 'postgraduate',
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: Timestamp.now(),
      },
    },
  ],
  admins: [
    {
      uid: 'admin-solent-001',
      email: 'admin@solent.ac.uk',
      role: 'university_admin',
      displayName: 'Carol Williams',
      profileData: {
        privacyPolicyAccepted: true,
      },
    },
    {
      uid: 'admin-soton-001',
      email: 'admin@soton.ac.uk',
      role: 'university_admin',
      displayName: 'David Brown',
      profileData: {
        privacyPolicyAccepted: true,
      },
    },
  ],
};

const sampleApplications = [
  {
    id: 'app-001',
    studentId: 'student-001',
    studentName: 'Alice Johnson',
    studentEmail: 'student1@example.com',
    universityId: 'uni-solent',
    universityName: 'Southampton Solent University',
    status: 'Submitted',
    personalInfo: {
      firstName: 'Alice',
      lastName: 'Johnson',
      dateOfBirth: Timestamp.fromDate(new Date('2000-05-15')),
      nationality: 'British',
      email: 'student1@example.com',
      phone: '+44 7123 456789',
      address: {
        line1: '123 High Street',
        city: 'Southampton',
        postcode: 'SO14 1AB',
        country: 'United Kingdom',
      },
    },
    academicInfo: {
      previousQualifications: [
        {
          institution: 'Southampton City College',
          qualification: 'A-Levels',
          subject: 'Computer Science, Mathematics, Physics',
          grade: 'ABB',
          yearCompleted: 2023,
        },
      ],
      currentlyStudying: false,
      englishProficiency: {
        testType: 'Native',
      },
    },
    courseInfo: {
      courseId: 'bsc-computing',
      courseName: 'BSc (Hons) Computing',
      intendedStartDate: 'September 2026',
      studyMode: 'full-time',
    },
    personalStatement: 'I am passionate about technology and software development...',
    decisionHistory: [],
    submittedAt: Timestamp.now(),
  },
  {
    id: 'app-002',
    studentId: 'student-002',
    studentName: 'Bob Smith',
    studentEmail: 'student2@example.com',
    universityId: 'uni-southampton',
    universityName: 'University of Southampton',
    status: 'Under Review',
    personalInfo: {
      firstName: 'Bob',
      lastName: 'Smith',
      dateOfBirth: Timestamp.fromDate(new Date('1998-11-22')),
      nationality: 'Indian',
      email: 'student2@example.com',
      phone: '+44 7987 654321',
      address: {
        line1: '456 Ocean Road',
        city: 'Southampton',
        postcode: 'SO15 2CD',
        country: 'United Kingdom',
      },
    },
    academicInfo: {
      previousQualifications: [
        {
          institution: 'Delhi University',
          qualification: 'Bachelor of Technology',
          subject: 'Computer Science',
          grade: 'First Class',
          yearCompleted: 2022,
        },
      ],
      currentlyStudying: false,
      englishProficiency: {
        testType: 'IELTS',
        overallScore: '7.5',
        testDate: Timestamp.fromDate(new Date('2025-06-01')),
      },
    },
    courseInfo: {
      courseId: 'msc-ai',
      courseName: 'MSc Artificial Intelligence',
      intendedStartDate: 'September 2026',
      studyMode: 'full-time',
    },
    personalStatement: 'My passion for artificial intelligence began during my undergraduate studies...',
    decisionHistory: [
      {
        id: 'history-001',
        status: 'Under Review',
        previousStatus: 'Submitted',
        changedBy: 'admin-soton-001',
        changedByName: 'David Brown',
        changedAt: Timestamp.now(),
        notes: 'Application received, beginning review process.',
      },
    ],
    submittedAt: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), // 7 days ago
  },
];

// ============================================
// SEED FUNCTIONS
// ============================================

async function seedUniversities() {
  console.log('Seeding universities...');
  
  const batch = db.batch();
  
  for (const uni of universities) {
    // Add admin IDs based on naming convention
    const adminId = uni.id === 'uni-solent' ? 'admin-solent-001' : 'admin-soton-001';
    uni.adminIds = [adminId];
    
    const ref = db.collection('universities').doc(uni.id);
    batch.set(ref, {
      ...uni,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  
  await batch.commit();
  console.log(` Seeded ${universities.length} universities`);
}

async function seedUsers() {
  console.log('Seeding users...');
  
  const batch = db.batch();
  const allUsers = [...sampleUsers.students, ...sampleUsers.admins];
  
  for (const user of allUsers) {
    const ref = db.collection('users').doc(user.uid);
    batch.set(ref, {
      ...user,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  
  await batch.commit();
  console.log(` Seeded ${allUsers.length} users`);
}

async function seedApplications() {
  console.log('Seeding applications...');
  
  const batch = db.batch();
  
  for (const app of sampleApplications) {
    const ref = db.collection('applications').doc(app.id);
    batch.set(ref, {
      ...app,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  
  await batch.commit();
  console.log(` Seeded ${sampleApplications.length} applications`);
}

async function seedNotifications() {
  console.log('Seeding notifications...');
  
  const notifications = [
    {
      id: 'notif-001',
      userId: 'student-002',
      type: 'status_change',
      title: 'Application Update',
      message: 'Your application to University of Southampton is now under review.',
      relatedApplicationId: 'app-002',
      read: false,
    },
  ];
  
  const batch = db.batch();
  
  for (const notif of notifications) {
    const ref = db.collection('notifications').doc(notif.id);
    batch.set(ref, {
      ...notif,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  
  await batch.commit();
  console.log(` Seeded ${notifications.length} notifications`);
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('========================================');
  console.log('UAAMS Database Seed Script');
  console.log('========================================\n');
  
  try {
    await seedUniversities();
    await seedUsers();
    await seedApplications();
    await seedNotifications();
    
    console.log('\n========================================');
    console.log(' Database seeding completed successfully!');
    console.log('========================================');
  } catch (error) {
    console.error('\n Seeding failed:', error);
    process.exit(1);
  }
}

main();
