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
import { useEffect, useState } from "react";
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
}) {
  const [notesBody, setNotesBody] = useState(notes ?? "");

  useEffect(() => {
    if (notesBody === notes) { // prevent update upon render
      return;
    }

    const debounce = setTimeout(() => {
      try {
        updateRusheeNotes(rushee.id, notesBody);
      } catch (error) {
        console.error("Failed to update rushee notes:", error);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [notesBody]);

  return (
    <div className="flex flex-col bg-card shadow-sm rounded-xl text-card-foreground border">
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