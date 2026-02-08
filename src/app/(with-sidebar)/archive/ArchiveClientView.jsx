"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ClientMembersView from "../rush-directory/ClientView";

const CLASSES_STORAGE_KEY = "zp-archive-classes";
const CURRENT_CLASS_STORAGE_KEY = "zp-archive-current-class";
const LEGACY_STORAGE_KEY = "zp-archive-data";

function transformArchiveData(data, uniqname) {
  const rushees = data.map(({ comments, note, ...r }) => r);
  const comments = data.flatMap((r) =>
    (r.comments || []).map((c) => ({
      ...c,
      rushee_id: r.id,
      deleted_at: null,
      isMine: c.author_uniqname === uniqname,
      is_anonymous: false,
    }))
  );
  const notes = data.map((r) => ({ rushee_id: r.id, body: r.note ?? "" }));
  return { rushees, comments, notes };
}

function isValidArchiveItem(item) {
  return (
    item &&
    typeof item === "object" &&
    typeof item.id !== "undefined" &&
    (Array.isArray(item.comments) || item.comments == null) &&
    (typeof item.note === "string" || item.note == null)
  );
}

function loadClassesFromStorage() {
  try {
    if (typeof window === "undefined") return { classes: {}, currentClass: null };
    const raw = localStorage.getItem(CLASSES_STORAGE_KEY);
    const current = localStorage.getItem(CURRENT_CLASS_STORAGE_KEY);
    let classes = {};
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        classes = parsed;
      }
    }
    // Migrate legacy single array to "Eta" class
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw && Object.keys(classes).length === 0) {
      const parsed = JSON.parse(legacyRaw);
      if (Array.isArray(parsed) && parsed.length > 0 && isValidArchiveItem(parsed[0])) {
        classes = { Eta: parsed };
        localStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(classes));
        localStorage.setItem(CURRENT_CLASS_STORAGE_KEY, "Eta");
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }
    const classNames = Object.keys(classes);
    const currentClass = current && classNames.includes(current) ? current : (classNames[0] || null);
    return { classes, currentClass };
  } catch (_) {
    return { classes: {}, currentClass: null };
  }
}

export default function ArchiveClientView({ uniqname }) {
  const [classes, setClasses] = useState({});
  const [currentClass, setCurrentClass] = useState(null);
  const [error, setError] = useState(null);
  const [pendingImportData, setPendingImportData] = useState(null);
  const [newClassName, setNewClassName] = useState("");
  const [deleteClassDialogOpen, setDeleteClassDialogOpen] = useState(false);
  const importInputRef = useRef(null);

  useEffect(() => {
    const { classes: c, currentClass: cc } = loadClassesFromStorage();
    setClasses(c);
    setCurrentClass(cc);
  }, []);

  const saveClasses = useCallback((newClasses, newCurrent = null) => {
    if (typeof window === "undefined") return;
    const names = Object.keys(newClasses);
    const current = newCurrent ?? (names[0] || null);
    localStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(newClasses));
    if (current) localStorage.setItem(CURRENT_CLASS_STORAGE_KEY, current);
    setClasses(newClasses);
    setCurrentClass(current);
  }, []);

  const handleImport = (mode) => {
    setError(null);
    if (!importInputRef.current) return;
    importInputRef.current.dataset.mode = mode;
    importInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mode = e.target.dataset?.mode || "replace";

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result;
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          setError("File must contain a JSON array of rushee objects.");
          return;
        }
        if (parsed.length === 0) {
          setError("Array is empty.");
          return;
        }
        if (!isValidArchiveItem(parsed[0])) {
          setError("Each item must have id, and optional comments and note.");
          return;
        }
        const newClasses = { ...classes };
        if (mode === "new") {
          setNewClassName("New Class");
          setPendingImportData(parsed);
          return;
        } else {
          const targetClass = currentClass || "Eta";
          newClasses[targetClass] = parsed;
          saveClasses(newClasses, targetClass);
        }
      } catch (err) {
        setError(err.message || "Invalid JSON.");
      }
    };
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsText(file);
    e.target.value = "";
    e.target.dataset.mode = "";
  };

  const archiveData = currentClass ? classes[currentClass] : null;
  const hasData = Array.isArray(archiveData) && archiveData.length > 0;
  const { rushees, comments, notes } = hasData
    ? transformArchiveData(archiveData, uniqname)
    : { rushees: [], comments: [], notes: [] };

  const classNames = Object.keys(classes);

  const handleConfirmNewClass = () => {
    if (!pendingImportData) return;
    const name = newClassName.trim() || "New Class";
    const newClasses = { ...classes, [name]: pendingImportData };
    saveClasses(newClasses, name);
    setPendingImportData(null);
  };

  const handleCancelNewClass = () => {
    setPendingImportData(null);
  };

  const handleDeleteCurrentClass = () => {
    if (!currentClass) return;
    const newClasses = { ...classes };
    delete newClasses[currentClass];
    const remaining = Object.keys(newClasses);
    saveClasses(newClasses, remaining[0] || null);
    setDeleteClassDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={importInputRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          onChange={handleFileChange}
          data-mode=""
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Import data
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => handleImport("new")}>
              Import as new class
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleImport("replace")}>
              Replace current class
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {classNames.length > 0 && (
          <>
            <Select value={currentClass || ""} onValueChange={(v) => { setCurrentClass(v); localStorage.setItem(CURRENT_CLASS_STORAGE_KEY, v); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteClassDialogOpen(true)}
              title="Delete this class"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Dialog open={deleteClassDialogOpen} onOpenChange={setDeleteClassDialogOpen}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Delete class &quot;{currentClass}&quot;?</DialogTitle>
                  <DialogDescription>
                    This will remove this class from the archive. The data will be lost. This cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteClassDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteCurrentClass}>
                    Delete class
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
        {hasData && (
          <span className="text-sm text-muted-foreground">
            {archiveData.length} rushee{archiveData.length !== 1 ? "s" : ""} loaded
          </span>
        )}
      </div>

      <Dialog open={!!pendingImportData} onOpenChange={(open) => !open && handleCancelNewClass()}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Name your class</DialogTitle>
            <DialogDescription>
              Enter a name for this rush class (e.g. Eta, Theta). You can switch between classes using the dropdown.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="class-name">Class name</Label>
            <Input
              id="class-name"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="e.g. Eta"
              onKeyDown={(e) => e.key === "Enter" && handleConfirmNewClass()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelNewClass}>
              Cancel
            </Button>
            <Button onClick={handleConfirmNewClass}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {!hasData && !error && (
        <p className="text-muted-foreground">
          Import a JSON file (array of rushee objects with id, comments, note) to view the archive.
        </p>
      )}
      {hasData && (
        <ClientMembersView
          rushees={rushees}
          comments={comments}
          notes={notes}
          uniqname={uniqname}
          isAdmin={true}
          userReactions={{}}
          userStars={new Set()}
          archiveMode={true}
        />
      )}
    </div>
  );
}
