"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        router.push("/login");
        return;
      }

      const data = userSnap.data();

      if (data.role !== "student") {
        router.push("/admin");
        return;
      }

      setUserData(data);

      const q = query(
        collection(db, "applications"),
        where("studentId", "==", user.uid)
      );

      const snapshot = await getDocs(q);
      const apps = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setApplications(apps);
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  if (loading) {
    return <main className="p-8">Loading student dashboard...</main>;
  }

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Student Dashboard</h1>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Welcome</h2>
        <p>{userData?.displayName}</p>
        <p className="text-sm text-gray-600">{userData?.email}</p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm">Total Applications</p>
          <h3 className="text-xl font-bold">{applications.length}</h3>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm">Submitted</p>
          <h3 className="text-xl font-bold">
            {applications.filter((a) => a.applicationStatus === "Submitted").length}
          </h3>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm">Under Review</p>
          <h3 className="text-xl font-bold">
            {applications.filter((a) => a.applicationStatus === "Under Review").length}
          </h3>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm">Offered</p>
          <h3 className="text-xl font-bold">
            {applications.filter((a) => a.applicationStatus === "Offered").length}
          </h3>
        </div>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-4">My Applications</h2>

        {applications.length === 0 ? (
          <p>No applications found.</p>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="border rounded-lg p-4">
                <h3 className="font-semibold">{app.courseName}</h3>
                <p>Status: {app.applicationStatus}</p>
                <p>Email: {app.studentEmail}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}