"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { APPLICATION_STATUSES, VALID_TRANSITIONS } from "@/types/database";

export default function ArchitectureOverview() {
  const [selectedStatus, setSelectedStatus] = useState("Draft");

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <header className="mb-8">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
            UAAMS Backend Architecture
          </h1>
          <p className="text-lg text-muted-foreground">
            Role 3: Backend & Database Lead (Firebase Architect) - Lavinia
          </p>
        </header>

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Project Files Created
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FileCard
              title="Firestore Rules"
              path="firebase/firestore.rules"
              description="Complete security rules with RBAC, privilege escalation prevention, and audit trail enforcement"
              lines={222}
            />
            <FileCard
              title="Firestore Indexes"
              path="firebase/firestore.indexes.json"
              description="Composite indexes for optimised queries on applications, notifications, and documents"
              lines={105}
            />
            <FileCard
              title="Storage Rules"
              path="firebase/storage.rules"
              description="Security rules for document uploads with file type and size validation"
              lines={86}
            />
            <FileCard
              title="Database Types"
              path="types/database.jsx"
              description="Runtime constants and helper functions for collections, statuses, and validation"
              lines={319}
            />
            <FileCard
              title="Firebase Config"
              path="lib/firebase.jsx"
              description="Firebase initialisation with emulator support and singleton pattern"
              lines={107}
            />
            <FileCard
              title="Firestore Utils"
              path="lib/firestore-utils.jsx"
              description="CRUD operations, pagination, real-time subscriptions, and transaction handling"
              lines={625}
            />
            <FileCard
              title="Workflow Logic"
              path="lib/application-workflow.jsx"
              description="State machine implementation, validation, and decision history formatting"
              lines={428}
            />
            <FileCard
              title="Auth Context"
              path="lib/auth-context.jsx"
              description="React context for authentication state, sign-in/sign-up, and role-based access"
              lines={316}
            />
            <FileCard
              title="Seed Script"
              path="scripts/seed-database.js"
              description="Database seeding script with sample universities, users, and applications"
              lines={392}
            />
          </div>
        </section>

        <Tabs defaultValue="collections" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="workflow">State Machine</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="collections">
            <div className="grid gap-4 md:grid-cols-2">
              <CollectionCard
                name="users"
                fields={[
                  "uid",
                  "email",
                  "role",
                  "displayName",
                  "profileData",
                  "timestamps",
                ]}
                description="Identity and role management with embedded profile data"
              />
              <CollectionCard
                name="universities"
                fields={[
                  "name",
                  "adminIds[]",
                  "courses[]",
                  "settings",
                  "contactEmail",
                ]}
                description="Institution data with denormalised admin references"
              />
              <CollectionCard
                name="applications"
                fields={[
                  "studentId",
                  "universityId",
                  "status",
                  "personalInfo",
                  "academicInfo",
                  "courseInfo",
                  "decisionHistory[]",
                ]}
                description="Core business entity with full audit trail"
              />
              <CollectionCard
                name="documents"
                fields={[
                  "applicationId",
                  "fileType",
                  "fileUrl",
                  "verified",
                  "uploadedBy",
                ]}
                description="Supporting documents with verification status"
              />
              <CollectionCard
                name="notifications"
                fields={[
                  "userId",
                  "type",
                  "message",
                  "read",
                  "relatedApplicationId",
                ]}
                description="Real-time notifications with read tracking"
              />
              <CollectionCard
                name="emailLogs"
                fields={["recipientId", "templateId", "status", "sentAt"]}
                description="Email delivery audit trail"
              />
            </div>
          </TabsContent>

          <TabsContent value="workflow">
            <Card>
              <CardHeader>
                <CardTitle>Application State Machine</CardTitle>
                <CardDescription>
                  Click a status to see valid transitions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex flex-wrap gap-2">
                  {APPLICATION_STATUSES.map((status) => (
                    <Badge
                      key={status}
                      variant={selectedStatus === status ? "default" : "outline"}
                      className="cursor-pointer transition-colors"
                      onClick={() => setSelectedStatus(status)}
                    >
                      {status}
                    </Badge>
                  ))}
                </div>

                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="mb-2 text-sm text-muted-foreground">
                    From{" "}
                    <span className="font-semibold text-foreground">
                      {selectedStatus}
                    </span>
                    , valid transitions:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(VALID_TRANSITIONS[selectedStatus] || []).length > 0 ? (
                      (VALID_TRANSITIONS[selectedStatus] || []).map((nextStatus) => (
                        <Badge key={nextStatus} variant="secondary">
                          {nextStatus}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm italic text-muted-foreground">
                        Terminal state - no further transitions allowed
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs">
                  <pre>{`Draft → Submitted → Under Review → Offered/Rejected
        ↓           ↓              ↓           ↓
    Withdrawn   Withdrawn      Withdrawn   Accept/Decline`}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <div className="grid gap-4 md:grid-cols-2">
              <SecurityFeatureCard
                title="Deny by Default"
                description="All access is denied unless explicitly granted, following the principle of least privilege"
              />
              <SecurityFeatureCard
                title="Role-Based Access Control"
                description="Students and admins have distinct permissions enforced at the database layer"
              />
              <SecurityFeatureCard
                title="Privilege Escalation Prevention"
                description="Users cannot modify their own role field, preventing unauthorised elevation"
              />
              <SecurityFeatureCard
                title="Audit Trail Immutability"
                description="Decision history entries cannot be modified or deleted"
              />
              <SecurityFeatureCard
                title="Institution Isolation"
                description="Admins can only access applications for their own university"
              />
              <SecurityFeatureCard
                title="State Transition Validation"
                description="Both application code and security rules validate status changes"
              />
            </div>
          </TabsContent>
        </Tabs>

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Firebase Setup Instructions
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Quick Setup Steps</CardTitle>
              <CardDescription>
                Follow these steps to connect your Firebase project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SetupStep
                number={1}
                title="Create Firebase Project"
                description="Go to console.firebase.google.com and create a new project called 'uaams-dev'"
              />
              <SetupStep
                number={2}
                title="Enable Services"
                description="Enable Authentication (Email/Password), Firestore Database, and Storage"
              />
              <SetupStep
                number={3}
                title="Get Config Values"
                description="Go to Project Settings > Your apps > Web, and copy the config object"
              />
              <SetupStep
                number={4}
                title="Add Environment Variables"
                description="Add your Firebase config values to the environment file"
              />
              <SetupStep
                number={5}
                title="Deploy Security Rules"
                description="Copy firestore.rules and storage.rules content to Firebase Console > Rules"
              />

              <div className="mt-6 rounded-lg bg-muted p-4">
                <h4 className="mb-2 font-medium">Required Environment Variables:</h4>
                <div className="space-y-1 font-mono text-xs">
                  <p>NEXT_PUBLIC_FIREBASE_API_KEY</p>
                  <p>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</p>
                  <p>NEXT_PUBLIC_FIREBASE_PROJECT_ID</p>
                  <p>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</p>
                  <p>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</p>
                  <p>NEXT_PUBLIC_FIREBASE_APP_ID</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Full documentation available in{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                docs/ROLE3-DATABASE-ARCHITECTURE.md
              </code>{" "}
              and setup guide in{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                docs/FIREBASE-SETUP-GUIDE.md
              </code>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function FileCard({ title, path, description, lines }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <code className="text-xs text-muted-foreground">{path}</code>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-sm text-muted-foreground">{description}</p>
        <Badge variant="secondary" className="text-xs">
          {lines} lines
        </Badge>
      </CardContent>
    </Card>
  );
}

function CollectionCard({ name, fields, description }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-base">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">{description}</p>
        <div className="flex flex-wrap gap-1">
          {fields.map((field) => (
            <Badge key={field} variant="outline" className="text-xs font-mono">
              {field}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SecurityFeatureCard({ title, description }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-green-600">&#10003;</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function SetupStep({ number, title, description }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
        {number}
      </div>
      <div>
        <h4 className="font-medium text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}