"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

export default function ApplicationNotes({ applicationId }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState([]);

  const { firebaseUser, userData, isUniversityAdmin } = useAuth();

  const loadNotes = async () => {
    try {
      const db = getFirestoreDb();
      const notesRef = collection(db, "applications", applicationId, "notes");
      const q = query(notesRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const notesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setNotes(notesData);
    } catch (error) {
      console.error("Error loading notes:", error);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [applicationId]);

  const handleAddNote = async () => {
    if (!note.trim()) return;

    if (!firebaseUser || !isUniversityAdmin) {
      alert("Only signed-in admins can add notes.");
      return;
    }

    setLoading(true);

    try {
      const db = getFirestoreDb();

      await addDoc(collection(db, "applications", applicationId, "notes"), {
        noteText: note,
        adminId: firebaseUser.uid,
        adminName:
          userData?.displayName ||
          firebaseUser.displayName ||
          firebaseUser.email ||
          "Admin",
        createdAt: serverTimestamp(),
      });

      setNote("");
      await loadNotes();
    } catch (error) {
      console.error(error);
      alert("Error adding note");
    }

    setLoading(false);
  };

  return (
    <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Admin Notes</h2>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Write internal notes..."
        className="mt-3 w-full rounded-lg border p-3"
        rows={4}
      />

      <button
        onClick={handleAddNote}
        disabled={loading}
        className="mt-3 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Add Note"}
      </button>

      <div className="mt-6">
        <h3 className="text-md font-semibold text-gray-900">Notes History</h3>

        {notes.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No notes yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {notes.map((item) => (
              <div key={item.id} className="rounded-lg border bg-gray-50 p-4">
                <p className="text-gray-800">{item.noteText}</p>
                <div className="mt-2 text-xs text-gray-500">
                  <span>{item.adminName || "Admin"}</span>
                  {" • "}
                  <span>
                    {item.createdAt?.toDate
                      ? item.createdAt.toDate().toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "Just now"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}