"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import { useAuth } from "@/lib/context/auth-context";

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

  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const { firebaseUser, userData, isUniversityAdmin } = useAuth();

  const loadNotes = async () => {
    try {
      setLoadingNotes(true);

      const db = getFirestoreDb();
      const notesRef = collection(db, "applications", applicationId, "notes");
      const q = query(notesRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const notesData = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
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
        updatedAt: null,
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

  const handleStartEdit = (item) => {
    setEditingNoteId(item.id);
    setEditingText(item.noteText || "");
    setMessage("");
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingText("");
  };

  const handleSaveEdit = async (noteId) => {
    if (!editingText.trim()) {
      setMessage("Note cannot be empty.");
      setMessageType("error");
      return;
    }

    if (!firebaseUser || !isUniversityAdmin) {
      setMessage("Only signed-in admins can edit notes.");
      setMessageType("error");
      return;
    }

    try {
      setActionLoadingId(noteId);
      setMessage("");

      const db = getFirestoreDb();
      const noteRef = doc(db, "applications", applicationId, "notes", noteId);

      await updateDoc(noteRef, {
        noteText: editingText.trim(),
        updatedAt: serverTimestamp(),
        editedBy:
          userData?.displayName ||
          firebaseUser.displayName ||
          firebaseUser.email ||
          "Admin",
      });

      setEditingNoteId(null);
      setEditingText("");
      await loadNotes();
      setMessage("Note updated successfully.");
      setMessageType("success");
    } catch (error) {
      console.error(error);
      setMessage("Error updating note.");
      setMessageType("error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!firebaseUser || !isUniversityAdmin) {
      setMessage("Only signed-in admins can delete notes.");
      setMessageType("error");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(noteId);
      setMessage("");

      const db = getFirestoreDb();
      const noteRef = doc(db, "applications", applicationId, "notes", noteId);

      await deleteDoc(noteRef);

      if (editingNoteId === noteId) {
        setEditingNoteId(null);
        setEditingText("");
      }

      await loadNotes();
      setMessage("Note deleted successfully.");
      setMessageType("success");
    } catch (error) {
      console.error(error);
      setMessage("Error deleting note.");
      setMessageType("error");
    } finally {
      setActionLoadingId(null);
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
                className="animate-pulse rounded-lg border bg-gray-50 p-4"
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
            {notes.map((item) => {
              const isEditing = editingNoteId === item.id;
              const isBusy = actionLoadingId === item.id;

              return (
                <div key={item.id} className="rounded-lg border bg-gray-50 p-4">
                  {isEditing ? (
                    <>
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                      />

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          disabled={isBusy}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isBusy ? "Saving..." : "Save"}
                        </button>

                        <button
                          onClick={handleCancelEdit}
                          disabled={isBusy}
                          className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="whitespace-pre-line text-gray-800">
                        {item.noteText}
                      </p>

                      <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">
                            {item.adminName || "Admin"}
                          </span>
                          {" • "}
                          <span>{formatDateTime(item.createdAt)}</span>
                          {item.updatedAt && (
                            <>
                              {" • "}
                              <span>Edited: {formatDateTime(item.updatedAt)}</span>
                            </>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleStartEdit(item)}
                            disabled={isBusy}
                            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDeleteNote(item.id)}
                            disabled={isBusy}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isBusy ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}