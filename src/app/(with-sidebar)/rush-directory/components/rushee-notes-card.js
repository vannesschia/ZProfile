"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import 'react-quill-new/dist/quill.snow.css';
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { updateRusheeNotes } from "../_lib/actions";
import { NotebookPen } from "lucide-react";

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <p>Loading Editor...</p>
});

export default function RusheeNotesCard({
  rushee,
  isAdmin,
  notes,
  onUpdate,
}) {
  const [notesBody, setNotesBody] = useState(notes ?? "<p></p>");
  const latestNotes = useRef(notesBody);

  useEffect(() => {
    latestNotes.current = notesBody;
  }, [notesBody]);

  useEffect(() => {
    if (notesBody === notes) return; // prevent update upon render

    const saveNotes = async () => {
      try {
        await updateRusheeNotes(rushee.id, notesBody);
        onUpdate();
      } catch (error) {
        console.error("Failed to update rushee notes:", error);
      }
    }

    const debounce = setTimeout(() => saveNotes(), 300);

    return () => {
      clearTimeout(debounce);
      if (latestNotes.current !== notes) {
        saveNotes(latestNotes.current);
      }
    }
  }, [notesBody]);

  return (
    <div id="text-editor" className="flex flex-col bg-card shadow-sm rounded-xl text-card-foreground border">
      <Card className="flex flex-row gap-2 shadow-none pt-2 px-3 pb-2 text-sm items-center rounded-b-none border-t-0 border-x-0">
        <NotebookPen className="w-5 h-5" /> Notes
      </Card>
      <ReactQuill
        theme="snow"
        readOnly={!isAdmin}
        modules={{ toolbar: isAdmin }}
        value={notesBody}
        onChange={setNotesBody}
        placeholder={isAdmin ? "Add notes..." : "No notes available"}
      />
    </div>
  )
}