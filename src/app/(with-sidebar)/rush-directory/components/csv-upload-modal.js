import React from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { getBrowserClient } from "@/lib/supbaseClient";

const supabase = getBrowserClient()

const BUCKET = "rushee-profile-pictures";
const TABLE = "rushees"

function basenameNoExt(filename) {
  const name = String(filename || "").trim();
  const lastSlash = name.lastIndexOf("/");
  const justName = lastSlash >= 0 ? name.slice(lastSlash + 1) : name;
  const lastDot = justName.lastIndexOf(".");
  return lastDot > 0 ? justName.slice(0, lastDot) : justName;
}

function extLower(filename) {
  const name = String(filename || "").trim();
  const lastDot = name.lastIndexOf(".");
  return lastDot >= 0 ? name.slice(lastDot + 1).toLowerCase() : "jpg";
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

export default function ImportRusheesModal({ onImported }) {
  const [open, setOpen] = React.useState(false);

  const [imageFiles, setImageFiles] = React.useState([]);
  const [csvFile, setCsvFile] = React.useState(null);
  const [rows, setRows] = React.useState([]);

  const [globalErrors, setGlobalErrors] = React.useState([]);
  const [rowErrors, setRowErrors] = React.useState({});

  const [progress, setProgress] = React.useState(0);
  const [isImporting, setIsImporting] = React.useState(false);
  const [summary, setSummary] = React.useState(null);

  // Map images by uniqname using filename base (e.g., "vchia.jpg" -> "vchia")
  const imagesByUniqname = React.useMemo(() => {
    const m = new Map();
    for (const f of imageFiles) {
      const key = basenameNoExt(f.name);
      if (key) m.set(key, f);
    }
    return m;
  }, [imageFiles]);

  function resetState() {
    setImageFiles([]);
    setCsvFile(null);
    setRows([]);
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

  const canImport = React.useMemo(() => {
    // Allow import if there are CSV rows OR if there are images to process
    if (!rows.length && imageFiles.length === 0) return false;
    if (globalErrors.length) return false;
    return true;
  }, [rows, globalErrors, imageFiles.length]);

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
      
      // Find images that match existing rushees not in CSV
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
        setGlobalErrors((prev) => [...prev, "No matching rushees found for the uploaded images. Make sure image filenames match existing rushee uniqnames."]);
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
            const idx = rows.length + i;
            setRowErrors((prev) => ({
              ...prev,
              [idx]: `Image update failed for ${uniqname}: ${e?.message || "Unknown error"}`,
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
            Images should be named like <code>uniqname.jpg</code> to auto-match. Images can be added to existing rushees even if they're not in the CSV.
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
                Matching rule: <b>filename</b> must equal <code>uniqname</code>{" "}
                (e.g. <code>amoomaw.png</code> → <code>amoomaw</code>).
              </div>
              <div className="text-xs">
                Selected images: <b>{imageFiles.length}</b>
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

          {/* Preview */}
          {(rows.length > 0 || imageFiles.length > 0) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {rows.length > 0 ? `Preview (${rows.length} rows)` : `Images ready (${imageFiles.length} images)`}
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

              <div className="rounded-md border w-full">
                <ScrollArea className="h-[340px]">
                  <Table className="overflow-auto">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-14">#</TableHead>
                        <TableHead>uniqname</TableHead>
                        {rows.length > 0 && (
                          <>
                            <TableHead>name</TableHead>
                            <TableHead>major[]</TableHead>
                            <TableHead>minor[]</TableHead>
                            <TableHead>image match</TableHead>
                          </>
                        )}
                        {rows.length === 0 && <TableHead>image file</TableHead>}
                        <TableHead className="w-[240px] text-wrap">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.length > 0 ? (
                        rows.map((r, idx) => {
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
                              <TableCell className="text-sm">
                                {hasImg ? (
                                  <span className="text-muted-foreground">Yes</span>
                                ) : (
                                  <span className="text-muted-foreground">No</span>
                                )}
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
                        })
                      ) : (
                        Array.from(imagesByUniqname.entries()).map(([uniqname, file], idx) => {
                          const err = rowErrors[idx];

                          return (
                            <TableRow key={idx}>
                              <TableCell className="text-muted-foreground">
                                {idx + 1}
                              </TableCell>
                              <TableCell>{uniqname}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {file.name}
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
                        })
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

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
