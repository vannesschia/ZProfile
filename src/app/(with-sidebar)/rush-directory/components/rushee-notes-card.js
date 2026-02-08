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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import 'react-quill-new/dist/quill.snow.css';
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { updateRusheeNotes } from "../_lib/actions";
import { NotebookPen, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <p>Loading Editor...</p>
});

export default function RusheeNotesCard({
  rushee,
  isAdmin,
  archiveMode = false,
  notes,
  onUpdate,
  fontSize = "14px",
  setFontSize,
}) {
  const [notesBody, setNotesBody] = useState(notes ?? "<p></p>");
  const [isSaving, setIsSaving] = useState(false);
  const latestNotes = useRef(notesBody);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    latestNotes.current = notesBody;
  }, [notesBody]);

  const handleSave = async () => {
    if (notesBody === notes) {
      toast.info("No changes to save");
      return;
    }

    // Clear any pending debounced save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    setIsSaving(true);
    try {
      await updateRusheeNotes(rushee.id, notesBody);
      onUpdate();
      toast.success("Notes saved successfully");
    } catch (error) {
      console.error("Failed to update rushee notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  };


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

    debounceTimerRef.current = setTimeout(() => saveNotes(), 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    }
  }, [notesBody, notes, rushee.id, onUpdate]);

  useEffect(() => {
    // Apply font size and ensure proper height/overflow to ReactQuill editor
    const editorId = `text-editor-${rushee.id}`;
    const container = document.querySelector(`#${editorId} .ql-container`);
    const editor = document.querySelector(`#${editorId} .ql-editor`);
    
    if (container) {
      container.style.height = '100%';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.overflow = 'hidden';
    }
    
    if (editor) {
      editor.style.fontSize = fontSize;
      editor.style.flex = '1';
      editor.style.overflowY = 'auto';
      editor.style.minHeight = '0';
      editor.style.maxHeight = 'none';
    }
  }, [fontSize, rushee.id, notesBody]);

  return (
    <div id={`text-editor-${rushee.id}`} className="flex flex-col h-full max-h-full bg-card shadow-sm rounded-xl text-card-foreground border overflow-hidden">
      <Card className="flex flex-row gap-2 shadow-none pt-2 px-3 pb-2 text-sm items-center justify-between rounded-b-none border-t-0 border-x-0 flex-shrink-0">
        <div className="flex items-center gap-2">
          <NotebookPen className="w-5 h-5" /> Notes
        </div>
        <div className="flex items-center gap-2">
          <Select value={fontSize} onValueChange={setFontSize}>
            <SelectTrigger className="w-[100px] h-7 text-xs">
              <SelectValue placeholder="Font Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12px">12px</SelectItem>
              <SelectItem value="14px">14px</SelectItem>
              <SelectItem value="16px">16px</SelectItem>
              <SelectItem value="18px">18px</SelectItem>
              <SelectItem value="20px">20px</SelectItem>
              <SelectItem value="24px">24px</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && !archiveMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || notesBody === notes}
              className="h-7 text-xs"
            >
              <Save className="w-3 h-3 mr-1" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </Card>
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <ReactQuill
          theme="snow"
          readOnly={!isAdmin || archiveMode}
          modules={{ toolbar: isAdmin && !archiveMode }}
          value={notesBody}
          onChange={setNotesBody}
          placeholder={isAdmin && !archiveMode ? "Add notes..." : "No notes available"}
          className="h-full"
        />
      </div>
    </div>
  )
}