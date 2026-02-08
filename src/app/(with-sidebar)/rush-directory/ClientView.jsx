"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import RusheeCard from "@/app/components/RusheeCard";
import { Book, BookOpenText, GraduationCap, ListFilter, Plus, School, Search, XIcon, Star, Check, X, Medal, ThumbsUp, ThumbsDown, ArrowUpDown, MessageCircle, TrendingUp, UserX, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import handleMajorMinorSearch from "@/app/components/majors-api";
import MajorMinorMultiSelect from "@/app/components/MajorMinorMultiSelect";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import RusheeModal from "./components/rushee-modal";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import ImportMembersModal from "./components/csv-upload-modal";
import { htmlToReadableText } from "./_util/utils";

const GRADES = ["freshman", "sophomore", "junior", "senior", "graduate_student"]

const GRAD_YEAR = [2025, 2026, 2027, 2028, 2029]

export default function ClientMembersView({ rushees, comments, notes, uniqname, isAdmin, userReactions = {}, userStars = new Set(), archiveMode = false, showExportData = false }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [majorSearch, setMajorSearch] = useState("");
  const [minorSearch, setMinorSearch] = useState("");
  const [majorOptions, setMajorOptions] = useState([]);
  const [minorOptions, setMinorOptions] = useState([]);
  const [majorFilter, setMajorFilter] = useState([]);
  const [minorFilter, setMinorFilter] = useState([]);
  const majorSearchDebounce = useRef(null);
  const minorSearchDebounce = useRef(null);
  const [gradeFilter, setGradeFilter] = useState([]);
  const [gradYearFilter, setGradYearFilter] = useState([]);
  const [mainFilterOpen, setMainFilterOpen] = useState(false);
  const [subFilterOpen, setSubFilterOpen] = useState(false);
  const [filterList, setFilterList] = useState([]);
  const [hideFilter, setHideFilter] = useState(true);
  const [cutStatusFilter, setCutStatusFilter] = useState("active"); // "active" or "cut" or "all"
  const [selectedModalRusheeId, setSelectedModalRusheeId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(null); // "cut" or "reactivate" or null
  const [selectedRusheeIds, setSelectedRusheeIds] = useState(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [likelihoods, setLikelihoods] = useState(new Map(rushees.map(rushee => [rushee.id, rushee.likelihood])));
  const [sortBy, setSortBy] = useState("name"); // "name", "likelihood", "likes", "dislikes", "stars", "comments"
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [isClearingRushees, setIsClearingRushees] = useState(false);
  const [deleteRusheesDialogOpen, setDeleteRusheesDialogOpen] = useState(false);

  const safeRushees = Array.isArray(rushees) ? rushees : [];
  const safeUserStars = userStars instanceof Set ? userStars : new Set(Array.isArray(userStars) ? userStars : []);
  const userStarCount = safeUserStars.size;
  
  // Calculate comment counts per rushee (excluding deleted comments)
  const commentCounts = new Map();
  if (Array.isArray(comments)) {
    comments.forEach(comment => {
      // Only count non-deleted comments
      if (comment.rushee_id && !comment.deleted_at) {
        commentCounts.set(comment.rushee_id, (commentCounts.get(comment.rushee_id) || 0) + 1);
      }
    });
  }

  const handleUpdate = () => {
    router.refresh();
  };

  const handleDeleteAllRushees = async () => {
    setIsClearingRushees(true);
    try {
      const res = await fetch("/api/rushees/clear-all", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to delete rushees");
        return;
      }
      toast.success("All rushees deleted.");
      setDeleteRusheesDialogOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err.message || "Failed to delete rushees");
    } finally {
      setIsClearingRushees(false);
    }
  };

  const buildExportData = () => {
    return safeRushees.map(rushee => {
      const rusheeComments = (comments || []).filter(c => c.rushee_id === rushee.id && !c.deleted_at);
      const noteBody = (notes || []).find(n => n.rushee_id === rushee.id)?.body ?? "";
      return {
        ...rushee,
        comments: rusheeComments.map(({ id, author_uniqname, author_name, body, created_at }) => ({
          id,
          author_uniqname,
          author_name,
          body: htmlToReadableText(body),
          created_at,
        })),
        note: noteBody,
      };
    });
  };

  const handleExport = () => {
    const data = buildExportData();
    const timestamp = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rush-directory-export-${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as JSON");
  };

  const handleToggleSelectionMode = (mode) => {
    if (selectionMode === mode) {
      // If clicking the same button, confirm the action
      handleConfirmSelection();
    } else {
      // Enter selection mode
      setSelectionMode(mode);
      setSelectedRusheeIds(new Set());
    }
  };

  const handleCancelSelection = () => {
    setSelectionMode(null);
    setSelectedRusheeIds(new Set());
  };

  const handleToggleRusheeSelection = (rusheeId, rushee) => {
    if (!selectionMode) return;
    
    // Only allow selection based on mode
    if (selectionMode === "cut" && rushee.cut_status !== "active") return;
    if (selectionMode === "reactivate" && rushee.cut_status !== "cut") return;

    setSelectedRusheeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rusheeId)) {
        newSet.delete(rusheeId);
      } else {
        newSet.add(rusheeId);
      }
      return newSet;
    });
  };

  const handleConfirmSelection = async () => {
    if (selectedRusheeIds.size === 0) {
      setSelectionMode(null);
      return;
    }

    setIsUpdating(true);
    try {
      const cutStatus = selectionMode === "cut" ? "cut" : "active";
      const response = await fetch('/api/rushees/cut-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rushee_ids: Array.from(selectedRusheeIds),
          cut_status: cutStatus
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update rushee status');
      }

      // Reset selection mode and refresh
      setSelectionMode(null);
      setSelectedRusheeIds(new Set());
      toast.success(`Successfully ${selectionMode === "cut" ? "cut" : "reactivated"} ${selectedRusheeIds.size} rushee${selectedRusheeIds.size > 1 ? 's' : ''}`);
      router.refresh();
    } catch (error) {
      console.error("Error updating rushee status:", error);
      toast.error(error.message || "Failed to update rushee status");
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper function to get likelihood priority (lower number = higher priority)
  const getLikelihoodPriority = (likelihood) => {
    const likelihoodValue = likelihood || "none";
    const priorityMap = {
      "green": 0,
      "yellow": 1,
      "red": 2,
      "none": 3
    };
    return priorityMap[likelihoodValue] ?? 3;
  };

  // Filter and sort rushees - single consolidated list with all filters applied
  const filteredRushees = safeRushees
    .filter((rushee) => {
      // Filter by cut status
      if (cutStatusFilter !== "all" && rushee.cut_status !== cutStatusFilter) {
        return false;
      }
      // Filter by search and other criteria
      return (
        rushee.name.toLowerCase().includes(search.toLowerCase()) &&
        majorFilter.every(maj => rushee.major?.includes(maj)) &&
        minorFilter.every(min => rushee.minor?.includes(min)) &&
        (gradeFilter.length === 0 || gradeFilter.includes(rushee.grade)) &&
        (gradYearFilter.length === 0 || gradYearFilter.includes(rushee.graduation_year))
      );
    })
    .sort((a, b) => {
      // First priority: active vs cut (active first)
      const aCutStatus = a.cut_status === "active" ? 0 : 1;
      const bCutStatus = b.cut_status === "active" ? 0 : 1;
      if (aCutStatus !== bCutStatus) {
        return aCutStatus - bCutStatus;
      }

      // Second priority: sort by selected option
      if (sortBy === "name") {
        // When sorting by name, just sort alphabetically (no likelihood)
        return a.name.localeCompare(b.name);
      } else if (sortBy === "likelihood") {
        // Sort by likelihood (green, yellow, red, none), then name
        const aLikelihood = likelihoods.get(a.id) || a.likelihood || "none";
        const bLikelihood = likelihoods.get(b.id) || b.likelihood || "none";
        const aLikelihoodPriority = getLikelihoodPriority(aLikelihood);
        const bLikelihoodPriority = getLikelihoodPriority(bLikelihood);
        if (aLikelihoodPriority !== bLikelihoodPriority) {
          return aLikelihoodPriority - bLikelihoodPriority;
        }
        // Tie-breaker: name
        return a.name.localeCompare(b.name);
      } else if (sortBy === "likes") {
        const aLikes = a.like_count || 0;
        const bLikes = b.like_count || 0;
        if (aLikes !== bLikes) {
          return bLikes - aLikes; // Descending (most likes first)
        }
        // Tie-breaker: name
        return a.name.localeCompare(b.name);
      } else if (sortBy === "dislikes") {
        const aDislikes = a.dislike_count || 0;
        const bDislikes = b.dislike_count || 0;
        if (aDislikes !== bDislikes) {
          return bDislikes - aDislikes; // Descending (most dislikes first)
        }
        // Tie-breaker: name
        return a.name.localeCompare(b.name);
      } else if (sortBy === "stars") {
        const aStars = a.star_count || 0;
        const bStars = b.star_count || 0;
        if (aStars !== bStars) {
          return bStars - aStars; // Descending (most stars first)
        }
        // Tie-breaker: name
        return a.name.localeCompare(b.name);
      } else if (sortBy === "comments") {
        const aComments = commentCounts.get(a.id) || 0;
        const bComments = commentCounts.get(b.id) || 0;
        if (aComments !== bComments) {
          return bComments - aComments; // Descending (most comments first)
        }
        // Tie-breaker: name
        return a.name.localeCompare(b.name);
      }

      // Fallback: name (alphabetical)
      return a.name.localeCompare(b.name);
    });
    
  // Find selected rushee by ID
  const selectedRushee = selectedModalRusheeId !== null 
    ? filteredRushees.find(r => r.id === selectedModalRusheeId) || null
    : null;
  
  // Close modal if selected rushee is no longer in filtered list
  useEffect(() => {
    if (isModalOpen && selectedModalRusheeId && !selectedRushee) {
      setIsModalOpen(false);
      setSelectedModalRusheeId(null);
    }
  }, [isModalOpen, selectedModalRusheeId, selectedRushee]);
  
  // Helper functions for next/prev navigation by ID
  const getNextRusheeId = () => {
    if (!selectedModalRusheeId || filteredRushees.length === 0) return null;
    const currentIndex = filteredRushees.findIndex(r => r.id === selectedModalRusheeId);
    if (currentIndex === -1) return null;
    const nextIndex = (currentIndex + 1) % filteredRushees.length;
    return filteredRushees[nextIndex]?.id || null;
  };
  
  const getPrevRusheeId = () => {
    if (!selectedModalRusheeId || filteredRushees.length === 0) return null;
    const currentIndex = filteredRushees.findIndex(r => r.id === selectedModalRusheeId);
    if (currentIndex === -1) return null;
    const prevIndex = (currentIndex - 1 + filteredRushees.length) % filteredRushees.length;
    return filteredRushees[prevIndex]?.id || null;
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute pl-2 top-1/2 -translate-y-1/2" />
          <Input
            type="search"
            className="pl-8 text-sm"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={cutStatusFilter === "active" ? "default" : "outline"}
            onClick={() => setCutStatusFilter("active")}
          >
            Active
          </Button>
          <Button
            variant={cutStatusFilter === "cut" ? "default" : "outline"}
            onClick={() => setCutStatusFilter("cut")}
          >
            Cut
          </Button>
          <Button
            variant={cutStatusFilter === "all" ? "default" : "outline"}
            onClick={() => setCutStatusFilter("all")}
          >
            All
          </Button>
          <Popover open={mainFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="!text-muted-foreground cursor-pointer"
                onClick={() => {
                  if (filterList.length === 0) {
                    setMainFilterOpen(prev => !prev);
                  } else {
                    setHideFilter(prev => !prev);
                  }
                }}
              >
                <div className={`flex flex-row gap-2 items-center ${hideFilter && filterList.length !== 0 ? "text-green-500" : ""}`}>
                  <ListFilter />Filter
                </div>
              </Button>
            </PopoverTrigger>
            <FilterPopoverContent
              open={mainFilterOpen}
              setOpen={setMainFilterOpen}
              hideFilter={hideFilter}
              setHideFilter={setHideFilter}
              filterList={filterList}
              setFilterList={setFilterList}
            />
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="!text-muted-foreground cursor-pointer">
                <div className="flex flex-row gap-2 items-center">
                  <ArrowUpDown className="h-4 w-4" />
                  Sort: {sortBy === "name" ? "Name" : sortBy === "likelihood" ? "Likelihood" : sortBy === "likes" ? "Likes" : sortBy === "dislikes" ? "Dislikes" : sortBy === "stars" ? "Stars" : "Comments"}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                <DropdownMenuRadioItem value="name">
                  Name
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="likelihood">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    Likelihood
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="likes">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-3 w-3" />
                    Likes
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dislikes">
                  <div className="flex items-center gap-2">
                    <ThumbsDown className="h-3 w-3" />
                    Dislikes
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="stars">
                  <div className="flex items-center gap-2">
                    <Star className="h-3 w-3" />
                    Stars
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="comments">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-3 w-3" />
                    Comments
                  </div>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {!archiveMode && (
        <Card className="flex flex-row gap-2 shadow-none w-fit h-full pt-2 px-3 pb-2 text-sm items-center rounded-md">
          <Star className="h-[1em] w-[1em] fill-current text-yellow-500" /><p className="leading-tight">Remaining Stars: {3 - userStarCount || 0}</p>
        </Card>
        )}
      </div>
      <div>
        {isAdmin && !archiveMode && (
          <div className="flex gap-2 mb-4 w-full flex-wrap">
            <Button
              variant={selectionMode === "cut" ? "default" : "outline"}
              onClick={() => handleToggleSelectionMode("cut")}
              disabled={isUpdating}
              className={selectionMode === "cut" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
            >
              {selectionMode === "cut" ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Confirm Cut ({selectedRusheeIds.size})
                </>
              ) : (
                "Cut Rushees"
              )}
            </Button>
            <Button
              variant={selectionMode === "reactivate" ? "default" : "outline"}
              onClick={() => handleToggleSelectionMode("reactivate")}
              disabled={isUpdating}
              className={selectionMode === "reactivate" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
            >
              {selectionMode === "reactivate" ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Confirm Reactivate ({selectedRusheeIds.size})
                </>
              ) : (
                "Reactivate Rushees"
              )}
            </Button>
            {selectionMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelSelection}
                disabled={isUpdating}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
            <ImportMembersModal />
            <Button asChild variant="outline">
              <Link href="/admin/new-class?prefill=true">
                {/* <Medal />New Class */}
                Import New Class
              </Link>
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => setDeleteRusheesDialogOpen(true)}
              disabled={isClearingRushees}
            >
              <Trash2 className="h-4 w-4" />
              Delete rushees
            </Button>
            <Dialog open={deleteRusheesDialogOpen} onOpenChange={setDeleteRusheesDialogOpen}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Delete all rushees?</DialogTitle>
                  <DialogDescription>
                    This will permanently remove all rushees and their reactions, stars, comments, and notes from the Rush Directory. This cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteRusheesDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAllRushees}
                    disabled={isClearingRushees}
                  >
                    {isClearingRushees ? "Deleting…" : "Delete all"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {showExportData && (
            <Button variant="outline" className="gap-1.5" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export data
            </Button>
            )}
            <Button
              variant="outline"
              className={`gap-1.5 ${anonymousMode ? "bg-black text-white hover:bg-black/90 hover:text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 dark:hover:text-black" : ""}`}
              onClick={() => setAnonymousMode(prev => !prev)}
            >
              <UserX className="h-4 w-4" />
              Anonymous
            </Button>
          </div>
        )}
      </div>
      <div className={`flex flex-wrap flex-col sm:flex-row gap-4 mb-4 ${hideFilter ? "hidden" : ""}`}>
        {filterList.map(f => {
          // Filter Logic
          if (f === "major") { // Filter by major
            return (
              <div key="major" className="w-fit min-w-48">
                <MajorMinorMultiSelect
                  value={majorFilter}
                  onChange={setMajorFilter}
                  options={majorOptions}
                  input={majorSearch}
                  onInputChange={(input) => {
                    setMajorSearch(input);
                    if (majorSearchDebounce.current) {
                      clearTimeout(majorSearchDebounce.current);
                    }
                    majorSearchDebounce.current = setTimeout(() => {
                      handleMajorMinorSearch(input).then(setMajorOptions);
                    }, 300);
                  }}
                  placeholder="Filter by major"
                  removeFilter={() => {
                    setFilterList(prev => prev.filter(ff => ff != "major"));
                    setMajorFilter([]);
                    setSelectedRusheeIds(new Set());
                  }}
                />
              </div>
            )
          } else if (f === "minor") { // Filter by minor
            return (
              <div key="minor" className="w-fit min-w-48">
                <MajorMinorMultiSelect
                  value={minorFilter}
                  onChange={setMinorFilter}
                  options={minorOptions}
                  input={minorSearch}
                  onInputChange={(input) => {
                    setMinorSearch(input);
                    if (minorSearchDebounce.current) {
                      clearTimeout(minorSearchDebounce.current);
                    }
                    minorSearchDebounce.current = setTimeout(() => {
                      handleMajorMinorSearch(input).then(setMinorOptions);
                    }, 300);
                  }}
                  placeholder="Filter by minor"
                  removeFilter={() => {
                    setFilterList(prev => prev.filter(ff => ff != "minor"));
                    setMinorFilter([]);
                    setSelectedRusheeIds(new Set());
                  }}
                />
              </div>
            )
          } else if (f === "grade") { // Filter by grade
            return (
              <DropdownMenu key="grade">
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-48 [&_svg]:pointer-events-auto hover:text-muted-foreground justify-between cursor-pointer pl-3 !pr-2 text-muted-foreground font-normal">
                    <div className="flex w-full">
                      Filter by grade
                    </div>
                    <XIcon
                      className="h-4 cursor-pointer text-muted-foreground"
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={() => { 
                        setFilterList(prev => prev.filter(ff => ff != "grade"));
                        setGradeFilter([]);
                        setSelectedRusheeIds(new Set());
                      }}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 overflow-y-auto min-w-[12rem] w-[var(--radix-popover-trigger-width)]">
                  <DropdownMenuLabel>Select grades</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {GRADES.map((grade) => (
                    <DropdownMenuCheckboxItem
                      key={grade}
                      checked={gradeFilter.includes(grade)}
                      onCheckedChange={(checked) => {
                        setGradeFilter((prev) => {
                          if (checked) {
                            return [...prev, grade];
                          } else {
                            return prev.filter((t) => t !== grade);
                          }
                        })
                      }}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {grade.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          } else if (f === "grad_year") { // Filter by grad_year
            return (
              <DropdownMenu key="grad_year">
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-48 [&_svg]:pointer-events-auto hover:text-muted-foreground justify-between cursor-pointer pl-3 !pr-2 text-muted-foreground font-normal">
                    <div className="flex w-full">
                      Filter by grad year
                    </div>
                    <XIcon
                      className="h-4 cursor-pointer text-muted-foreground"
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setFilterList(prev => prev.filter(ff => ff != "grad_year"));
                        setGradYearFilter([]);
                        setSelectedRusheeIds(new Set());
                      }}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 overflow-y-auto min-w-[12rem] w-[var(--radix-popover-trigger-width)]">
                  <DropdownMenuLabel>Select grad years</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {GRAD_YEAR.map((grad) => (
                    <DropdownMenuCheckboxItem
                      key={grad}
                      checked={gradYearFilter.includes(grad)}
                      onCheckedChange={(checked) => {
                        setGradYearFilter((prev) => {
                          if (checked) {
                            return [...prev, grad];
                          } else {
                            return prev.filter((t) => t !== grad);
                          }
                        })
                      }}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {grad}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }
        })}


        <Popover open={subFilterOpen} onOpenChange={setSubFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={`w-24 !text-muted-foreground cursor-pointer ${filterList.length === 0 || filterList.length === 4 ? "hidden" : ""}`}
            >
              <div className="flex flex-row gap-2 items-center">
                <Plus />Filter
              </div>
            </Button>
          </PopoverTrigger>
          {filterList.length !== 0 && filterList.length !== 4 &&
            <FilterPopoverContent
              open={subFilterOpen}
              setOpen={setSubFilterOpen}
              hideFilter={hideFilter}
              setHideFilter={setHideFilter}
              filterList={filterList}
              setFilterList={setFilterList}
            />
          }
        </Popover>
      </div>
      <Dialog open={isModalOpen} onOpenChange={prev => setIsModalOpen(prev)}>
        {selectedRushee &&
          <RusheeModal
            rushee={selectedRushee}
            uniqname={uniqname}
            isAdmin={isAdmin}
            anonymousMode={anonymousMode}
            archiveMode={archiveMode}
            comments={comments.filter(c => c.rushee_id === selectedRushee.id)}
            notes={notes.find(n => n.rushee_id === selectedRushee.id)?.body || ""}
            likeCount={selectedRushee.like_count}
            dislikeCount={selectedRushee.dislike_count}
            starCount={selectedRushee.star_count}
            onUpdate={handleUpdate}
            nextRushee={() => {
              const nextId = getNextRusheeId();
              if (nextId) setSelectedModalRusheeId(nextId);
            }}
            prevRushee={() => {
              const prevId = getPrevRusheeId();
              if (prevId) setSelectedModalRusheeId(prevId);
            }}
            likelihoods={likelihoods}
            setLikelihoods={setLikelihoods}
          />
        }
      </Dialog>

      <div className="flex flex-wrap gap-4 justify-start items-start">
        {filteredRushees.map((rushee, index) => (
          <RusheeCard
            key={rushee.id || rushee.uniqname}
            rushee={rushee}
            userReaction={userReactions[rushee.id] || 'none'}
            isStarred={safeUserStars.has(rushee.id)}
            onUpdate={handleUpdate}
            openModal={() => {
              if (selectionMode) {
                handleToggleRusheeSelection(rushee.id, rushee);
              } else {
                setIsModalOpen(true);
                setSelectedModalRusheeId(rushee.id);
              }
            }}
            userStarCount={userStarCount}
            safeUserStars={safeUserStars}
            isSelected={selectedRusheeIds.has(rushee.id)}
            selectionMode={selectionMode}
            likelihood={likelihoods.get(rushee.id) || "green"}
            commentCount={commentCounts.get(rushee.id) || 0}
            archiveMode={archiveMode}
          />
        ))}
      </div>
    </div>
  );
}

function FilterPopoverContent({
  open,
  setOpen,
  hideFilter,
  setHideFilter,
  filterList,
  setFilterList,
}) {
  const toggleFilter = (name) => {
    setOpen(false);
    setHideFilter(false);
    setFilterList(prev => [...prev, name]);
  }
  return (
    <PopoverContent className="p-1" align="center">
      <div className="grid">
        <span className="font-medium text-sm m-3">Filter by...</span>
        <div className="flex flex-col">
          <Button
            variant="ghost"
            className={`cursor-pointer w-full justify-start ${filterList.includes("major") ? "hidden" : ""}`}
            onClick={() => toggleFilter("major")}
          >
            <BookOpenText />Major
          </Button>
          <Button
            variant="ghost"
            className={`cursor-pointer w-full justify-start ${filterList.includes("minor") ? "hidden" : ""}`}
            onClick={() => {
              setOpen(false);
              setHideFilter(false);
              setFilterList(prev => [...prev, "minor"]);
            }}
          >
            <Book />Minor
          </Button>
          <Button
            variant="ghost"
            className={`cursor-pointer w-full justify-start ${filterList.includes("grade") ? "hidden" : ""}`}
            onClick={() => {
              setOpen(false);
              setHideFilter(false);
              setFilterList(prev => [...prev, "grade"]);
            }}
          >
            <School />Grade
          </Button>
          <Button
            variant="ghost"
            className={`cursor-pointer w-full justify-start ${filterList.includes("grad_year") ? "hidden" : ""}`}
            onClick={() => {
              setOpen(false);
              setHideFilter(false);
              setFilterList(prev => [...prev, "grad_year"]);
            }}
          >
            <GraduationCap />Grad Year
          </Button>
        </div>
      </div>
    </PopoverContent>
  )
}