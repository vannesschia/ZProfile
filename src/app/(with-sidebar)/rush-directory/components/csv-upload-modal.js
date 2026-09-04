import React from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { getBrowserClient } from "@/lib/supbaseClient";
import {
  extractNameFromFilename,
  matchImageToTargets,
} from "../_util/utils";

const supabase = getBrowserClient()

const BUCKET = "rushee-profile-pictures";
const TABLE = "rushees"

function extLower(filename) {
  const name = String(filename || "").trim();
  const lastDot = name.lastIndexOf(".");
  return lastDot >= 0 ? name.slice(lastDot + 1).toLowerCase() : "jpg";
}

// Stable identity for a File across re-renders.
function fileKey(f) {
  return `${f.name}__${f.size}__${f.lastModified}`;
}

// Parses strings like "{Computer Science}" or "{Cognitive Science, User Experience Design}"
// into ["Computer Science"] or ["Cognitive Science", "User Experience Design"]
function parseBraceListToArray(value) {
  if (value == null) return [];
  let s = String(value).trim();
  if (!s) return [];

  // If wrapped in { }, strip them
  if (s.startsWith("{") && s.endsWith("}")) {
    s = s.slice(1, -1).trim();
  }

  if (!s) return [];

  // split by comma
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function toIntOrNull(value) {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function normalizeGrade(value) {
  if (value == null) return null;
  const s = String(value).trim().toLowerCase();
  return s || null;
}

function normalizeRow(raw) {
  return {
    uniqname: String(raw?.uniqname ?? "").trim(),
    name: String(raw?.name ?? "").trim(),
    email_address: String(raw?.email_address ?? "").trim() || null,
    major: parseBraceListToArray(raw?.major),
    minor: parseBraceListToArray(raw?.minor),
    grade: normalizeGrade(raw?.grade),
    graduation_year: toIntOrNull(raw?.graduation_year),
    // CSV might have this column but we will overwrite it from image upload when available
    profile_picture_url: String(raw?.profile_picture_url ?? "").trim() || null,
  };
}

// Searchable rushee picker for correcting/confirming a fuzzy image match.
function RusheeCombobox({ value, targets, onChange, disabled }) {
  const [open, setOpen] = React.useState(false);
  const selected = targets.find((t) => t.uniqname === value) || null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-[220px] justify-between font-normal"
        >
          <span className="truncate">
            {selected ? `${selected.name} (${selected.uniqname})` : "Select rushee…"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search rushee…" />
          <CommandList>
            <CommandEmpty>No rushee found.</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  value="__unassign__"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Unassign
                </CommandItem>
              )}
              {targets.map((t) => (
                <CommandItem
                  key={t.uniqname}
                  value={`${t.name} ${t.uniqname}`}
                  onSelect={() => {
                    onChange(t.uniqname);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${value === t.uniqname ? "opacity-100" : "opacity-0"}`}
                  />
                  <span className="truncate">
                    {t.name}{" "}
                    <span className="text-muted-foreground">({t.uniqname})</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function ImportRusheesModal({ onImported }) {
  const [open, setOpen] = React.useState(false);

  const [imageFiles, setImageFiles] = React.useState([]);
  const [csvFile, setCsvFile] = React.useState(null);
  const [rows, setRows] = React.useState([]);

  // Roster of existing rushees (fetched on open) used as fuzzy-match targets.
  const [roster, setRoster] = React.useState(null);
  const [rosterLoading, setRosterLoading] = React.useState(false);
  const [rosterError, setRosterError] = React.useState(null);

  // Per-image match state (parallel data, keyed by fileKey), user-editable.
  const [matches, setMatches] = React.useState([]);
  const matchesRef = React.useRef([]);

  const [globalErrors, setGlobalErrors] = React.useState([]);
  const [rowErrors, setRowErrors] = React.useState({});

  const [progress, setProgress] = React.useState(0);
  const [isImporting, setIsImporting] = React.useState(false);
  const [summary, setSummary] = React.useState(null);

  React.useEffect(() => {
    matchesRef.current = matches;
  }, [matches]);

  // Fetch the roster once the dialog is opened.
  React.useEffect(() => {
    if (!open || roster !== null) return;
    let cancelled = false;
    (async () => {
      setRosterLoading(true);
      setRosterError(null);
      const { data, error } = await supabase
        .from(TABLE)
        .select("id, uniqname, name");
      if (cancelled) return;
      if (error) {
        setRosterError(error.message || "Failed to load rushees.");
        setRoster([]);
      } else {
        setRoster(data || []);
      }
      setRosterLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, roster]);

  // Match targets = existing rushees plus any new rushees from the CSV.
  const matchTargets = React.useMemo(() => {
    const map = new Map();
    for (const t of roster || []) {
      if (t?.uniqname) {
        map.set(t.uniqname, { uniqname: t.uniqname, name: t.name || "", id: t.id });
      }
    }
    for (const r of rows) {
      if (r?.uniqname && !map.has(r.uniqname)) {
        map.set(r.uniqname, { uniqname: r.uniqname, name: r.name || "" });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      String(a.name).localeCompare(String(b.name))
    );
  }, [roster, rows]);

  // (Re)build per-image matches whenever the files or targets change,
  // preserving any assignments the user has manually edited.
  React.useEffect(() => {
    const prevByKey = new Map((matchesRef.current || []).map((m) => [m.key, m]));
    const next = imageFiles.map((file) => {
      const key = fileKey(file);
      const prior = prevByKey.get(key);
      if (prior && prior.userEdited) {
        return { ...prior, file };
      }
      const res = matchImageToTargets(file.name, matchTargets);
      return {
        key,
        file,
        extractedName: extractNameFromFilename(file.name),
        method: res.method,
        uniqname: res.uniqname,
        score: res.score,
        confidence: res.confidence,
        candidates: res.candidates,
        confirmed: res.confidence === "high" && !!res.uniqname,
        userEdited: false,
      };
    });
    setMatches(next);
    matchesRef.current = next;
  }, [imageFiles, matchTargets]);

  function assignMatch(key, uniqname) {
    setMatches((prev) =>
      prev.map((m) =>
        m.key === key
          ? {
              ...m,
              uniqname,
              confirmed: !!uniqname,
              method: uniqname ? "manual" : "none",
              userEdited: true,
            }
          : m
      )
    );
  }

  function acceptAllSuggestions() {
    setMatches((prev) =>
      prev.map((m) =>
        m.uniqname && !m.confirmed
          ? { ...m, confirmed: true, userEdited: true }
          : m
      )
    );
  }

  // uniqname -> File for confirmed matches only.
  const imagesByUniqname = React.useMemo(() => {
    const m = new Map();
    for (const mt of matches) {
      if (mt.confirmed && mt.uniqname) m.set(mt.uniqname, mt.file);
    }
    return m;
  }, [matches]);

  // uniqnames that more than one confirmed image points at (last-wins on import).
  const duplicateUniqnames = React.useMemo(() => {
    const count = new Map();
    for (const mt of matches) {
      if (mt.confirmed && mt.uniqname) {
        count.set(mt.uniqname, (count.get(mt.uniqname) || 0) + 1);
      }
    }
    return new Set(
      Array.from(count.entries())
        .filter(([, c]) => c > 1)
        .map(([u]) => u)
    );
  }, [matches]);

  const matchStats = React.useMemo(() => {
    let confirmed = 0;
    let needsReview = 0;
    let unmatched = 0;
    for (const m of matches) {
      if (m.confirmed && m.uniqname) confirmed++;
      else if (m.uniqname) needsReview++;
      else unmatched++;
    }
    return { confirmed, needsReview, unmatched };
  }, [matches]);

  function resetState() {
    setImageFiles([]);
    setCsvFile(null);
    setRows([]);
    setMatches([]);
    matchesRef.current = [];
    setRoster(null);
    setRosterError(null);
    setGlobalErrors([]);
    setRowErrors({});
    setProgress(0);
    setIsImporting(false);
    setSummary(null);
  }

  async function parseCsv(file) {
    setGlobalErrors([]);
    setRowErrors({});
    setRows([]);
    setSummary(null);

    const text = await file.text();
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    if (parsed.errors && parsed.errors.length) {
      setGlobalErrors(
        parsed.errors.map((e) => `${e.code}: ${e.message} (row ${e.row})`)
      );
      return;
    }

    const cleaned = (parsed.data || [])
      .map(normalizeRow)
      .filter((r) => r.uniqname && r.name);

    if (!cleaned.length) {
      setGlobalErrors([
        'No valid rows found. Required columns: "uniqname", "name".',
      ]);
      return;
    }

    // Handle duplicates by uniqname: keep the last occurrence of each uniqname
    // This allows updates when the same uniqname appears multiple times
    const seen = new Map();
    for (const r of cleaned) {
      seen.set(r.uniqname, r);
    }
    const deduplicated = Array.from(seen.values());

    setRows(deduplicated);
  }

  async function uploadImageAndGetPublicUrl(uniqname, file) {
    const ext = extLower(file.name);
    const objectKey = `${uniqname}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectKey, file, {
        cacheControl: '31536000',
        upsert: true // Allow overwriting existing images
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectKey);
    const publicUrl = data?.publicUrl;

    if (!publicUrl) throw new Error("Failed to generate public URL.");
    return publicUrl;
  }

  const confirmedImageCount = matchStats.confirmed;

  const canImport = React.useMemo(() => {
    if (globalErrors.length) return false;
    if (rows.length > 0) return true; // CSV can be imported on its own
    return confirmedImageCount > 0; // image-only import needs ≥1 confirmed match
  }, [rows.length, confirmedImageCount, globalErrors]);

  async function runImport() {
    setIsImporting(true);
    setProgress(0);
    setRowErrors({});
    setSummary(null);

    let success = 0;
    let failed = 0;
    let imagesProcessed = 0;

    try {
      // Get all uniqnames from CSV rows (if any)
      const csvUniqnames = new Set(rows.map(r => r.uniqname));

      // Confirmed image matches that point at rushees not in the CSV.
      const imageUniqnames = Array.from(imagesByUniqname.keys());
      const uniqnamesToCheck = imageUniqnames.filter(u => !csvUniqnames.has(u));

      // Fetch existing rushees for images not in CSV (or all images if no CSV)
      let existingRushees = [];
      if (uniqnamesToCheck.length > 0) {
        const { data, error } = await supabase
          .from(TABLE)
          .select('uniqname')
          .in('uniqname', uniqnamesToCheck);

        if (!error && data) {
          existingRushees = data.map(r => r.uniqname);
        }
      }

      // Total items to process: CSV rows + existing rushees with images
      const total = rows.length + existingRushees.length;

      // If no rows and no existing rushees to update, nothing to do
      if (total === 0) {
        setGlobalErrors((prev) => [...prev, "No matching rushees found for the uploaded images. Confirm at least one image match before importing."]);
        setIsImporting(false);
        return;
      }

      // Process CSV rows first
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];

        try {
          const imgFile = imagesByUniqname.get(r.uniqname) || null;

          // Check if rushee with this uniqname already exists
          const { data: existingRushee } = await supabase
            .from(TABLE)
            .select('*')
            .eq('uniqname', r.uniqname)
            .maybeSingle();

          // Build payload - only include fields with actual values
          const payload = {
            uniqname: r.uniqname,
            name: r.name, // Always required
          };

          // Only include fields that have values (don't overwrite with null/empty)
          if (r.email_address) {
            payload.email_address = r.email_address;
          }
          if (r.major && r.major.length > 0) {
            payload.major = r.major;
          }
          if (r.minor && r.minor.length > 0) {
            payload.minor = r.minor;
          }
          if (r.grade) {
            payload.grade = r.grade;
          }
          if (r.graduation_year != null) {
            payload.graduation_year = r.graduation_year;
          }

          // Handle profile picture: only update if we have a new image or valid URL from CSV
          if (imgFile) {
            // New image file takes priority
            payload.profile_picture_url = await uploadImageAndGetPublicUrl(r.uniqname, imgFile);
          } else if (r.profile_picture_url) {
            // Use URL from CSV if provided
            payload.profile_picture_url = r.profile_picture_url;
          }
          // If neither image file nor CSV URL, don't include profile_picture_url in payload
          // This preserves existing profile picture

          let error;
          if (existingRushee) {
            // Update existing rushee - only update fields that are in payload
            ({ error } = await supabase
              .from(TABLE)
              .update(payload)
              .eq('uniqname', r.uniqname));
          } else {
            // Insert new rushee - include all fields (some may be null)
            const insertPayload = {
              ...payload,
              email_address: r.email_address || null,
              major: r.major || [],
              minor: r.minor || [],
              grade: r.grade || null,
              graduation_year: r.graduation_year || null,
              profile_picture_url: payload.profile_picture_url || null,
            };
            ({ error } = await supabase
              .from(TABLE)
              .insert(insertPayload));
          }

          if (error) throw error;

          success++;
        } catch (e) {
          failed++;
          setRowErrors((prev) => ({
            ...prev,
            [i]: e?.message || "Row failed",
          }));
        } finally {
          setProgress(Math.round(((i + 1) / total) * 100));
        }
      }

      // Process images for existing rushees not in CSV
      for (let i = 0; i < existingRushees.length; i++) {
        const uniqname = existingRushees[i];
        const imgFile = imagesByUniqname.get(uniqname);

        if (imgFile) {
          try {
            const profileUrl = await uploadImageAndGetPublicUrl(uniqname, imgFile);

            // Update only the profile picture for existing rushees
            const { error } = await supabase
              .from(TABLE)
              .update({ profile_picture_url: profileUrl })
              .eq('uniqname', uniqname);

            if (error) throw error;

            imagesProcessed++;
            success++;
          } catch (e) {
            failed++;
            setRowErrors((prev) => ({
              ...prev,
              [`img:${uniqname}`]: `Image update failed for ${uniqname}: ${e?.message || "Unknown error"}`,
            }));
          }
        }

        setProgress(Math.round(((rows.length + i + 1) / total) * 100));
      }

      setSummary({
        total: rows.length || imagesProcessed,
        success,
        failed,
        imagesProcessed: imagesProcessed > 0 ? imagesProcessed : undefined,
        imageOnly: rows.length === 0 && imagesProcessed > 0
      });
      if (onImported) onImported();
    } catch (e) {
      setGlobalErrors((prev) => [...prev, e?.message || "Import failed."]);
    } finally {
      setIsImporting(false);
    }
  }

  function confidenceBadge(m) {
    if (!m.uniqname) {
      return <Badge className="bg-red-100 text-red-800">No match</Badge>;
    }
    if (m.method === "manual") {
      return <Badge className="bg-blue-100 text-blue-900">Manual</Badge>;
    }
    if (m.method === "exact") {
      return <Badge className="bg-green-100 text-green-800">Exact</Badge>;
    }
    const pct = Math.round((m.score || 0) * 100);
    if (m.confidence === "high") {
      return <Badge className="bg-green-100 text-green-800">Auto · {pct}%</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-900">Review · {pct}%</Badge>;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isImporting) return;
        setOpen(next);
        if (!next) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Import Rushees</Button>
      </DialogTrigger>

      <DialogContent
        className="max-w-5xl"
        onEscapeKeyDown={(e) => isImporting && e.preventDefault()}
        onPointerDownOutside={(e) => isImporting && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Import Rushees (CSV + Profile Pictures)</DialogTitle>
          <DialogDescription>
            CSV columns expected: <code>uniqname</code>, <code>name</code>,{" "}
            <code>major</code>, <code>minor</code>, <code>grade</code>,{" "}
            <code>graduation_year</code>, <code>email_address</code>,{" "}
            <code>profile_picture_url</code>. <br />
            Duplicate uniqnames in CSV will update existing rushees with the last occurrence.{" "}
            You can also import just images without a CSV to update profile pictures for existing rushees.{" "}
            Images are auto-matched as long as the rushee&apos;s <b>full name appears in the
            filename</b> (e.g. <code>IMG_1959 - Michael Vu.jpeg</code>); a filename that is just the{" "}
            <code>uniqname.jpg</code> also works. Review and confirm matches before importing.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Inputs */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm font-medium">Images (optional)</div>
              <label
                  htmlFor="image-upload"
                  className={`
                    inline-flex items-center justify-center
                    rounded-md border border-input
                    bg-background px-4 py-2
                    text-sm font-medium
                    hover:bg-accent hover:text-accent-foreground
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-ring focus-visible:ring-offset-2
                    cursor-pointer
                    disabled:pointer-events-none disabled:opacity-50
                  `}
                >
                  Choose Images
                </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                disabled={isImporting}
                onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                className="sr-only"
              />
              <div className="text-xs text-muted-foreground">
                Matched as long as the rushee&apos;s <b>full name is in the filename</b>{" "}
                (<code>… - Amir Moomaw.png</code>); a bare <code>uniqname.png</code> works too.
              </div>
              <div className="text-xs">
                Selected images: <b>{imageFiles.length}</b>
                {rosterLoading && (
                  <span className="text-muted-foreground"> · loading rushees…</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">CSV</div>
                <label
                  htmlFor="csv-upload"
                  className={`
                    inline-flex items-center justify-center
                    rounded-md border border-input
                    bg-background px-4 py-2
                    text-sm font-medium
                    hover:bg-accent hover:text-accent-foreground
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-ring focus-visible:ring-offset-2
                    cursor-pointer
                    disabled:pointer-events-none disabled:opacity-50
                  `}
                >
                  Choose File
                </label>

                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv,text/csv"
                  disabled={isImporting}
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setCsvFile(f);
                    if (f) parseCsv(f);
                  }}
                  className="sr-only"
                />
              <div className="text-xs">
                Selected CSV: <b>{csvFile?.name ?? "None"}</b>
              </div>
            </div>
          </div>

          {/* Errors */}
          {globalErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTitle>Fix these before importing</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5">
                  {globalErrors.map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {rosterError && (
            <Alert variant="destructive">
              <AlertTitle>Could not load rushees for matching</AlertTitle>
              <AlertDescription>{rosterError}</AlertDescription>
            </Alert>
          )}

          {/* Preview + review */}
          {(rows.length > 0 || imageFiles.length > 0) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {rows.length > 0
                    ? `CSV preview (${rows.length} rows)`
                    : `Images ready (${imageFiles.length} images)`}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    disabled={isImporting}
                    onClick={resetState}
                  >
                    Reset
                  </Button>

                  <Button disabled={!canImport || isImporting} onClick={runImport}>
                    {isImporting ? "Importing…" : "Import"}
                  </Button>
                </div>
              </div>

              {/* CSV rows table */}
              {rows.length > 0 && (
                <div className="rounded-md border w-full">
                  <ScrollArea className="h-[240px]">
                    <Table className="overflow-auto">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-14">#</TableHead>
                          <TableHead>uniqname</TableHead>
                          <TableHead>name</TableHead>
                          <TableHead>major[]</TableHead>
                          <TableHead>minor[]</TableHead>
                          <TableHead>image match</TableHead>
                          <TableHead className="w-[240px] text-wrap">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((r, idx) => {
                          const hasImg = imagesByUniqname.has(r.uniqname);
                          const err = rowErrors[idx];

                          return (
                            <TableRow key={idx}>
                              <TableCell className="text-muted-foreground">
                                {idx + 1}
                              </TableCell>
                              <TableCell>{r.uniqname}</TableCell>
                              <TableCell>{r.name}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {r.major.join(", ")}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {r.minor.join(", ")}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {hasImg ? "Yes" : "No"}
                              </TableCell>
                              <TableCell className="text-sm">
                                {err ? (
                                  <span className="text-destructive text-wrap">{err}</span>
                                ) : (
                                  <span className="text-muted-foreground">Ready</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}

              {/* Image matching review */}
              {imageFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="text-sm font-medium">
                      Image matches ({imageFiles.length})
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-green-700">
                        {matchStats.confirmed} confirmed
                      </span>
                      <span className="text-yellow-700">
                        {matchStats.needsReview} to review
                      </span>
                      <span className="text-red-700">
                        {matchStats.unmatched} unmatched
                      </span>
                      {matchStats.needsReview > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isImporting}
                          onClick={acceptAllSuggestions}
                        >
                          Accept all suggestions
                        </Button>
                      )}
                    </div>
                  </div>

                  {matchStats.needsReview > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Lower-confidence matches must be confirmed (pick the rushee) or
                      they will be skipped.
                    </p>
                  )}

                  <div className="rounded-md border w-full">
                    <ScrollArea className="h-[320px]">
                      <Table className="overflow-auto">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-14">#</TableHead>
                            <TableHead>file / detected name</TableHead>
                            <TableHead>matched rushee</TableHead>
                            <TableHead className="w-28">confidence</TableHead>
                            <TableHead className="w-[200px]">status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {matches.map((m, idx) => {
                            const err = rowErrors[`img:${m.uniqname}`];
                            const isDup = m.uniqname && duplicateUniqnames.has(m.uniqname);
                            return (
                              <TableRow key={m.key}>
                                <TableCell className="text-muted-foreground">
                                  {idx + 1}
                                </TableCell>
                                <TableCell className="text-sm">
                                  <div className="truncate max-w-[220px]" title={m.file.name}>
                                    {m.file.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {m.extractedName || "—"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <RusheeCombobox
                                    value={m.uniqname}
                                    targets={matchTargets}
                                    disabled={isImporting || matchTargets.length === 0}
                                    onChange={(u) => assignMatch(m.key, u)}
                                  />
                                </TableCell>
                                <TableCell>{confidenceBadge(m)}</TableCell>
                                <TableCell className="text-sm">
                                  {err ? (
                                    <span className="text-destructive text-wrap">{err}</span>
                                  ) : isDup ? (
                                    <span className="text-yellow-700">
                                      Duplicate — another image also targets{" "}
                                      {m.uniqname}
                                    </span>
                                  ) : m.confirmed && m.uniqname ? (
                                    <span className="text-green-700">Will import</span>
                                  ) : m.uniqname ? (
                                    <span className="text-yellow-700">Needs confirmation</span>
                                  ) : (
                                    <span className="text-muted-foreground">Skipped</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Progress value={progress} />
                </div>
                <div className="w-12 text-right text-sm tabular-nums">
                  {progress}%
                </div>
              </div>

              {summary && (
                <Alert>
                  <AlertTitle>Import complete</AlertTitle>
                  <AlertDescription className="flex flex-col">
                    {summary.imageOnly ? (
                      <p>
                        Images processed: <strong>{summary.total}</strong>
                      </p>
                    ) : (
                      <p>
                        CSV rows processed: <strong>{summary.total}</strong>
                      </p>
                    )}
                    <p>
                      Successfully updated: <strong>{summary.success}</strong>
                    </p>
                    {summary.imagesProcessed && (
                      <p>
                        Images added to existing rushees: <strong>{summary.imagesProcessed}</strong>
                      </p>
                    )}
                    <p>
                      Failed: <strong>{summary.failed}</strong>
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
