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

function formatDateTime(value) {
  if (!value) return "Just now";

  try {
    const date =
      typeof value?.toDate === "function" ? value.toDate() : new Date(value);

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Just now";
  }
}

export default function ApplicationNotes({ applicationId }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [notes, setNotes] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const { firebaseUser, userData, isUniversityAdmin } = useAuth();

  const loadNotes = async () => {
    try {
      setLoadingNotes(true);

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
      setMessage("Failed to load notes.");
      setMessageType("error");
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    if (!applicationId) return;
    loadNotes();
  }, [applicationId]);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  const handleAddNote = async () => {
    if (!note.trim()) {
      setMessage("Please enter a note before saving.");
      setMessageType("error");
      return;
    }

    if (!firebaseUser || !isUniversityAdmin) {
      setMessage("Only signed-in admins can add notes.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const db = getFirestoreDb();

      await addDoc(collection(db, "applications", applicationId, "notes"), {
        noteText: note.trim(),
        adminId: firebaseUser.uid,
        adminName:
          userData?.displayName ||
          firebaseUser.displayName ||
          firebaseUser.email ||
          "Admin",
        createdAt: serverTimestamp(),
        eventType: "admin_note",
      });

      setNote("");
      await loadNotes();
      setMessage("Note added successfully.");
      setMessageType("success");
    } catch (error) {
      console.error(error);
      setMessage("Error adding note.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold text-gray-900">Admin Notes</h2>
        <p className="mt-1 text-sm text-gray-500">
          Internal notes visible to university admins only.
        </p>
      </div>

      {message && (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            messageType === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Add a new note
        </label>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write internal notes..."
          className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-green-500"
          rows={4}
        />

        <div className="mt-3 flex justify-end">
          <button
            onClick={handleAddNote}
            disabled={loading}
            className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : "Add Note"}
          </button>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900">Notes History</h3>

        {loadingNotes ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-lg border bg-gray-50 p-4 animate-pulse"
              >
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="mt-3 h-3 w-1/3 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed bg-gray-50 px-4 py-6 text-sm text-gray-500">
            No notes yet.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {notes.map((item) => (
              <div key={item.id} className="rounded-lg border bg-gray-50 p-4">
                <p className="whitespace-pre-line text-gray-800">
                  {item.noteText}
                </p>

                <div className="mt-3 text-xs text-gray-500">
                  <span className="font-medium">
                    {item.adminName || "Admin"}
                  </span>
                  {" • "}
                  <span>{formatDateTime(item.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}