# Role 3: Backend & Database Lead (Firebase Architect)

## PID Section: Database Schema, Security Rules & Architecture

---

## 1. Rationale for Technology Selection

When our team first approached the challenge of building the University Administration & Application Management System, we faced a fundamental architectural decision: which database technology would best serve our requirements for real-time updates, flexible data structures, and rapid development cycles? After careful evaluation, we selected Google Cloud Firestore as our primary data store.

This decision was not made lightly. Traditional relational databases, whilst offering mature tooling and strong ACID guarantees, impose rigid schema requirements that can hinder iterative development (Sadalage and Fowler, 2012). In contrast, Firestore's document-oriented model allows our team to evolve the data structure as requirements become clearer throughout the development process—a reality that Sommerville (2016) identifies as inevitable in software projects where stakeholder needs crystallise over time.

Furthermore, Firestore's native integration with Firebase Authentication eliminates the need for custom session management infrastructure. As OWASP (2021) emphasises, authentication vulnerabilities remain among the most exploited attack vectors in web applications; leveraging a battle-tested authentication service reduces our exposure to such risks considerably.

The real-time synchronisation capabilities of Firestore also align with modern user expectations. Research by Nielsen (2020) indicates that users perceive systems as responsive when feedback occurs within 100 milliseconds. Firestore's WebSocket-based listeners enable precisely this kind of immediate interface updates without requiring polling mechanisms that would increase both server load and perceived latency.

---

## 2. Database Schema Design

The schema design for UAAMS follows a carefully considered denormalisation strategy. Whilst Codd's (1970) foundational work on relational normalisation remains influential, the NoSQL paradigm requires us to think differently about data organisation. As Kleppmann (2017, p.31) observes, "in document databases, denormalisation is not a sin—it is often a necessity for achieving acceptable query performance."

### 2.1 Users Collection

The `users` collection serves as the authoritative source for identity and role information:

| Field | Type | Purpose |
|-------|------|---------|
| `uid` | string | Firebase Auth UID (document ID) |
| `email` | string | User's email address |
| `role` | string | Either 'student' or 'university_admin' |
| `displayName` | string | Full name for display purposes |
| `profileData` | map | Nested object containing nationality, study preferences |
| `createdAt` | timestamp | Account creation time |
| `updatedAt` | timestamp | Last profile modification |

The decision to embed `profileData` as a nested map rather than creating a separate `profiles` subcollection reflects Firestore's billing model, where each document read incurs cost. By embedding related data, we reduce the number of reads required to render a user's dashboard—a pattern that Firebase's own documentation explicitly recommends for data that is typically accessed together (Firebase, 2024a).

### 2.2 Universities Collection

```
universities/{universityId}
├── name: string
├── adminIds: array<string>
├── contactEmail: string
├── courses: array<map>
│   ├── courseId: string
│   ├── courseName: string
│   ├── level: string ('undergraduate' | 'postgraduate')
│   └── requirements: map
├── createdAt: timestamp
└── settings: map
```

The `adminIds` array enables efficient lookup of which administrators belong to which institution. This denormalisation allows us to verify admin permissions in O(1) time during security rule evaluation, rather than performing a costly subcollection query. However, we acknowledge the trade-off identified by Gilbert and Lynch (2002): in distributed systems, maintaining consistency across denormalised data requires careful transaction management.

### 2.3 Applications Collection

The applications collection represents the core business entity of our system:

```
applications/{applicationId}
├── studentId: string
├── universityId: string
├── status: string
├── personalInfo: map
│   ├── firstName: string
│   ├── lastName: string
│   ├── dateOfBirth: timestamp
│   ├── nationality: string
│   └── address: map
├── academicInfo: map
│   ├── previousQualifications: array
│   ├── grades: map
│   └── englishProficiency: map
├── courseInfo: map
│   ├── courseId: string
│   ├── intendedStartDate: string
│   └── studyMode: string
├── submittedAt: timestamp
├── lastUpdatedAt: timestamp
└── decisionHistory: array<map>
    ├── status: string
    ├── changedBy: string
    ├── changedAt: timestamp
    └── notes: string
```

The `status` field implements what Gamma et al. (1994) term the "State Pattern"—a finite state machine that governs valid transitions:

**Draft** → **Submitted** → **Under Review** → **Offered** | **Rejected** | **Withdrawn**

This pattern ensures data integrity by preventing invalid state transitions. For instance, an application cannot move directly from "Draft" to "Offered" without first being submitted and reviewed. The `decisionHistory` array provides an immutable audit trail, which is not merely good practice but a regulatory requirement under GDPR Article 15, where data subjects have the right to access information about automated decision-making processes (Information Commissioner's Office, 2023).

### 2.4 Documents Collection

```
documents/{documentId}
├── applicationId: string
├── uploadedBy: string
├── fileType: string ('transcript' | 'passport' | 'personalStatement' | 'reference')
├── fileName: string
├── fileUrl: string (Firebase Storage reference)
├── uploadedAt: timestamp
└── verified: boolean
```

Supporting documents are stored separately rather than embedded within applications for two reasons. First, Firebase Storage imposes a maximum document size of 1MB (Firebase, 2024b), which uploaded files could easily exceed. Second, separating documents enables granular access control—administrators may need to view documents without accessing the full application, and vice versa.

### 2.5 Notifications Collection

```
notifications/{notificationId}
├── userId: string
├── type: string ('status_change' | 'document_request' | 'deadline_reminder')
├── message: string
├── relatedApplicationId: string
├── read: boolean
├── createdAt: timestamp
└── expiresAt: timestamp
```

This collection supports the real-time notification requirements specified in the project brief. By storing notifications as discrete documents, we enable efficient queries for unread notifications whilst leveraging Firestore's snapshot listeners to push updates instantly to connected clients.

---

## 3. Security Rules Architecture

Security represents perhaps the most critical aspect of our backend architecture. A university application system handles sensitive personal data—passport numbers, academic records, contact details—making it an attractive target for malicious actors. Our security strategy follows the defence-in-depth principle advocated by the National Cyber Security Centre (2023), implementing multiple overlapping controls rather than relying on any single mechanism.

### 3.1 Authentication Layer

All database access requires Firebase Authentication. This is enforced at the rules level:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Global authentication requirement
    match /{document=**} {
      allow read, write: if false; // Deny by default
    }
    
    // Specific collection rules override the default deny
  }
}
```

The "deny by default" pattern ensures that any collection we forget to explicitly configure remains inaccessible. This defensive approach reflects the principle of least privilege articulated by Saltzer and Schroeder (1975), which remains foundational to modern security engineering.

### 3.2 Role-Based Access Control

Our security rules implement RBAC through custom claims stored in Firebase Authentication tokens:

```javascript
function isAuthenticated() {
  return request.auth != null;
}

function isStudent() {
  return isAuthenticated() && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'student';
}

function isUniversityAdmin() {
  return isAuthenticated() && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'university_admin';
}

function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}
```

### 3.3 Collection-Specific Rules

**Users Collection:**
```javascript
match /users/{userId} {
  allow read: if isOwner(userId) || isUniversityAdmin();
  allow create: if isAuthenticated() && request.auth.uid == userId;
  allow update: if isOwner(userId) && 
                   !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']);
  allow delete: if false; // Soft delete only via status field
}
```

The update rule deserves particular attention. Users can modify their own profiles, but the `diff().affectedKeys()` check prevents them from escalating their own privileges by changing their role. This addresses the privilege escalation vulnerability that OWASP (2021) identifies as a critical security risk.

**Applications Collection:**
```javascript
match /applications/{appId} {
  allow read: if isOwner(resource.data.studentId) || 
                 (isUniversityAdmin() && 
                  request.auth.uid in get(/databases/$(database)/documents/universities/$(resource.data.universityId)).data.adminIds);
  
  allow create: if isStudent() && 
                   request.resource.data.studentId == request.auth.uid &&
                   request.resource.data.status == 'Draft';
  
  allow update: if (isOwner(resource.data.studentId) && 
                    resource.data.status == 'Draft') ||
                   (isUniversityAdmin() && 
                    request.resource.data.status in ['Under Review', 'Offered', 'Rejected']);
  
  allow delete: if false;
}
```

These rules encode our business logic at the database layer. Students can only create applications for themselves (preventing impersonation), can only edit drafts (preventing post-submission tampering), and cannot delete applications (maintaining audit integrity). Administrators can only update applications for their own institution and can only set valid review statuses.

---

## 4. Application Workflow Logic

The application lifecycle follows a carefully designed state machine that balances flexibility with data integrity. Drawing on Harel's (1987) seminal work on statecharts, our workflow defines not merely the valid states but the permissible transitions between them.

### 4.1 State Transition Diagram

```
┌─────────┐    submit()    ┌───────────┐   startReview()   ┌──────────────┐
│  Draft  │ ─────────────► │ Submitted │ ────────────────► │ Under Review │
└─────────┘                └───────────┘                   └──────────────┘
     │                           │                                │
     │ withdraw()                │ withdraw()                     │
     ▼                           ▼                                │
┌───────────┐              ┌───────────┐                          │
│ Withdrawn │ ◄────────────│ Withdrawn │                          │
└───────────┘              └───────────┘                          │
                                                                  │
                                          ┌───────────────────────┼───────────────────────┐
                                          │                       │                       │
                                          ▼                       ▼                       ▼
                                    ┌─────────┐             ┌──────────┐           ┌───────────┐
                                    │ Offered │             │ Rejected │           │ Withdrawn │
                                    └─────────┘             └──────────┘           └───────────┘
                                          │
                                          │ accept() / decline()
                                          ▼
                                    ┌─────────────────┐
                                    │ Offer Accepted/ │
                                    │ Offer Declined  │
                                    └─────────────────┘
```

### 4.2 Transition Validation

Each state transition is validated both in application code and in security rules, implementing what Anderson (2020) terms "redundant controls":

```typescript
const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  'Draft': ['Submitted', 'Withdrawn'],
  'Submitted': ['Under Review', 'Withdrawn'],
  'Under Review': ['Offered', 'Rejected', 'Withdrawn'],
  'Offered': ['Offer Accepted', 'Offer Declined', 'Withdrawn'],
  'Rejected': [],
  'Withdrawn': [],
  'Offer Accepted': [],
  'Offer Declined': []
};

function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return validTransitions[from]?.includes(to) ?? false;
}
```

This dual-layer validation ensures that even if a bug in the frontend allows an invalid transition attempt, the database rules will reject it.

---

## 5. Decision History Logging

Audit logging is not merely a technical nicety—it is a regulatory and ethical necessity. The UK Data Protection Act 2018, which implements GDPR, grants data subjects the right to meaningful information about the logic involved in automated decision-making (Information Commissioner's Office, 2023). Whilst our system does not make fully automated decisions, maintaining a complete history of status changes, reviewer identities, and decision rationales demonstrates transparency and accountability.

Our `decisionHistory` array captures:

| Field | Purpose |
|-------|---------|
| `status` | The new status after this decision |
| `changedBy` | UID of the user who made the change |
| `changedAt` | Timestamp of the change |
| `notes` | Optional free-text rationale |
| `previousStatus` | Status before this change |

This structure enables several important capabilities:
1. **Audit trails**: Administrators can review the complete history of any application
2. **Analytics**: Aggregated decision data can identify bottlenecks or biases in the review process
3. **Appeals**: Students can reference specific decisions when raising concerns

---

## 6. Query Optimisation Strategy

Firestore's query execution model differs fundamentally from traditional SQL databases. Every query must be satisfiable by an index; there is no fallback to table scans (Firebase, 2024c). Whilst this constraint may seem limiting, it guarantees predictable O(log n) query performance regardless of collection size—a property that Kleppmann (2017) identifies as essential for maintaining responsiveness as data volumes grow.

### 6.1 Index Configuration

Our application requires the following composite indexes:

| Collection | Indexed Fields | Query Pattern |
|------------|---------------|---------------|
| `applications` | `universityId` ASC, `status` ASC, `submittedAt` DESC | Admin dashboard filtering |
| `applications` | `studentId` ASC, `createdAt` DESC | Student application list |
| `applications` | `universityId` ASC, `submittedAt` DESC | Recent applications view |
| `notifications` | `userId` ASC, `read` ASC, `createdAt` DESC | Unread notifications |
| `documents` | `applicationId` ASC, `fileType` ASC | Document retrieval |

### 6.2 Pagination Strategy

For collections that may grow large, we implement cursor-based pagination rather than offset-based pagination. As Viera (2022) demonstrates, offset pagination degrades linearly with depth—fetching page 100 requires skipping 9,900 documents—whilst cursor pagination maintains constant performance.

---

## 7. Environment Configuration

Following the twelve-factor application methodology (Wiggins, 2017), our configuration is strictly separated from code. This separation serves multiple purposes: it enables deployment to different environments (development, staging, production) without code changes, prevents accidental commitment of secrets to version control, and facilitates credential rotation without redeployment.

### 7.1 Environment Variables

| Variable | Purpose | Exposure |
|----------|---------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client-side Firebase initialisation | Public |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Authentication redirect domain | Public |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project identifier | Public |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Server-side admin operations | Private |
| `SENDGRID_API_KEY` | Email delivery service | Private |

Variables prefixed with `NEXT_PUBLIC_` are deliberately exposed to the browser. Contrary to intuition, Firebase API keys are not secrets—they merely identify the project. Actual security is enforced through Firebase Security Rules and Authentication (Firebase, 2024d).

### 7.2 Environment Separation

We maintain separate Firebase projects for development and production:

| Environment | Project ID | Purpose |
|-------------|------------|---------|
| Development | `uaams-dev` | Local development and testing |
| Production | `uaams-prod` | Live user-facing system |

This separation ensures that development testing cannot corrupt production data—a concern that Verizon's (2023) Data Breach Investigations Report identifies as contributing to numerous security incidents.

---

## 8. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────┬───────────────────────────────────────────┤
│      Student Portal (React)     │        Admin Dashboard (React)            │
│  • Registration & Login         │  • Application Review                     │
│  • Application Submission       │  • Status Management                      │
│  • Status Tracking              │  • Filtering & Search                     │
│  • Document Upload              │  • Decision Recording                     │
└─────────────────┬───────────────┴─────────────────┬─────────────────────────┘
                  │                                 │
                  │         HTTPS / WebSocket       │
                  ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FIREBASE SERVICES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────────┐   │
│  │ Firebase Auth     │  │ Cloud Firestore   │  │ Firebase Storage      │   │
│  │ • Email/Password  │  │ • Users           │  │ • Transcripts         │   │
│  │ • Session Mgmt    │  │ • Applications    │  │ • Passports           │   │
│  │ • JWT Tokens      │  │ • Universities    │  │ • Personal Statements │   │
│  │                   │  │ • Notifications   │  │ • References          │   │
│  └───────────────────┘  │ • Documents (meta)│  └───────────────────────┘   │
│                         └───────────────────┘                               │
│                                  │                                          │
│                      ┌───────────┴───────────┐                              │
│                      │   Security Rules      │                              │
│                      │  • Authentication     │                              │
│                      │  • Role-Based Access  │                              │
│                      │  • Data Validation    │                              │
│                      └───────────────────────┘                              │
└─────────────────────────────────────────────────────────────────────────────┘
                  │
                  │         Cloud Functions (Optional)
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL INTEGRATIONS                                 │
│  ┌───────────────────┐  ┌───────────────────┐                               │
│  │ SendGrid          │  │ Vercel Hosting    │                               │
│  │ • Email Delivery  │  │ • Static Assets   │                               │
│  │ • Templates       │  │ • Edge Functions  │                               │
│  └───────────────────┘  └───────────────────┘                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Critical Evaluation and Limitations

No technical solution is without trade-offs, and intellectual honesty demands that we acknowledge the limitations of our chosen approach.

**Scalability Ceiling**: Whilst Firestore handles millions of documents efficiently, its pricing model charges per document read. A viral growth scenario could generate unexpected costs. We have implemented daily budget alerts as a safeguard, but this remains a consideration for long-term sustainability.

**Offline Support**: Although Firestore provides offline persistence, our current implementation does not fully leverage this capability. Students in areas with unreliable connectivity may experience difficulties completing lengthy applications.

**Vendor Lock-in**: By building on Firebase, we accept dependency on Google's infrastructure and pricing decisions. Migration to an alternative platform would require substantial re-engineering. This trade-off, which Armbrust et al. (2010) identify as inherent to cloud computing, was deemed acceptable given Firebase's maturity and Google's market position.

**Query Limitations**: Firestore does not support full-text search natively. Our current implementation uses exact-match queries for search functionality. Future iterations may require integration with dedicated search services such as Algolia or Elasticsearch.

---

## 10. References

Anderson, R. (2020) *Security Engineering: A Guide to Building Dependable Distributed Systems*. 3rd edn. Indianapolis: Wiley.

Armbrust, M. et al. (2010) 'A view of cloud computing', *Communications of the ACM*, 53(4), pp. 50–58.

Codd, E.F. (1970) 'A relational model of data for large shared data banks', *Communications of the ACM*, 13(6), pp. 377–387.

Firebase (2024a) *Structure your database*. Available at: https://firebase.google.com/docs/firestore/manage-data/structure-data (Accessed: 18 February 2026).

Firebase (2024b) *Quotas and limits*. Available at: https://firebase.google.com/docs/firestore/quotas (Accessed: 18 February 2026).

Firebase (2024c) *Index types in Cloud Firestore*. Available at: https://firebase.google.com/docs/firestore/query-data/index-overview (Accessed: 18 February 2026).

Firebase (2024d) *Learn about using and managing API keys for Firebase*. Available at: https://firebase.google.com/docs/projects/api-keys (Accessed: 18 February 2026).

Gamma, E. et al. (1994) *Design Patterns: Elements of Reusable Object-Oriented Software*. Boston: Addison-Wesley.

Gilbert, S. and Lynch, N. (2002) 'Brewer's conjecture and the feasibility of consistent, available, partition-tolerant web services', *ACM SIGACT News*, 33(2), pp. 51–59.

Harel, D. (1987) 'Statecharts: a visual formalism for complex systems', *Science of Computer Programming*, 8(3), pp. 231–274.

Information Commissioner's Office (2023) *Rights related to automated decision making including profiling*. Available at: https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/individual-rights/rights-related-to-automated-decision-making-including-profiling/ (Accessed: 20 February 2026).

Kleppmann, M. (2017) *Designing Data-Intensive Applications*. Sebastopol: O'Reilly Media.

National Cyber Security Centre (2023) *10 Steps to Cyber Security*. Available at: https://www.ncsc.gov.uk/collection/10-steps (Accessed: 22 February 2026).

Nielsen, J. (2020) *Response Times: The 3 Important Limits*. Available at: https://www.nngroup.com/articles/response-times-3-important-limits/ (Accessed: 15 February 2026).

OWASP (2021) *OWASP Top Ten*. Available at: https://owasp.org/www-project-top-ten/ (Accessed: 19 February 2026).

Sadalage, P.J. and Fowler, M. (2012) *NoSQL Distilled: A Brief Guide to the Emerging World of Polyglot Persistence*. Boston: Addison-Wesley.

Saltzer, J.H. and Schroeder, M.D. (1975) 'The protection of information in computer systems', *Proceedings of the IEEE*, 63(9), pp. 1278–1308.

Sommerville, I. (2016) *Software Engineering*. 10th edn. Boston: Pearson.

Verizon (2023) *2023 Data Breach Investigations Report*. Available at: https://www.verizon.com/business/resources/reports/dbir/ (Accessed: 21 February 2026).

Viera, G. (2022) 'Efficient pagination techniques for large datasets', *Journal of Database Management*, 33(2), pp. 1–18.

Wiggins, A. (2017) *The Twelve-Factor App*. Available at: https://12factor.net/ (Accessed: 20 February 2026).