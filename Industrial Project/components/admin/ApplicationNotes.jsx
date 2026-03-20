"use client";

import { useEffect, useState } from "react";
import {
  addApplicationNote,
  getApplicationNotes,
} from "@/lib/applicationService";

export default function ApplicationNotes({ applicationId }) {
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(false);

  const loadNotes = async () => {
    const data = await getApplicationNotes(applicationId);
    setNotes(data);
  };

  useEffect(() => {
    loadNotes();
  }, [applicationId]);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    setLoading(true);
    await addApplicationNote(applicationId, noteText);
    setNoteText("");
    await loadNotes();
    setLoading(false);
  };

  return (
    <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Internal Notes</h2>

      <div className="mt-4">
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Write an internal note..."
          className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
        <button
          onClick={handleAddNote}
          disabled={loading}
          className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Add Note"}
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {notes.length === 0 ? (
          <p className="text-sm text-gray-500">No notes yet.</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="rounded-lg border bg-gray-50 p-4">
              <p className="text-gray-800">{note.noteText}</p>
              <div className="mt-2 text-xs text-gray-500">
                <span>{note.adminName || "Admin"}</span>
                {" • "}
                <span>
                  {note.createdAt?.toDate
                    ? note.createdAt.toDate().toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "No date"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}