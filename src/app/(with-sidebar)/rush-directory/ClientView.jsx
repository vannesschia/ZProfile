"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import RusheeCard from "@/app/components/RusheeCard";
import { Book, BookOpenText, GraduationCap, ListFilter, Plus, School, Search, XIcon, Star, Check, X } from "lucide-react";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import RusheeModal from "./components/rushee-modal";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const GRADES = ["freshman", "sophomore", "junior", "senior", "graduate_student"]

const GRAD_YEAR = [2025, 2026, 2027, 2028, 2029]

export default function ClientMembersView({ rushees, comments, notes, uniqname, isAdmin, userReactions = {}, userStars = new Set() }) {
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
  const [selectedModal, setSelectedModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(null); // "cut" or "reactivate" or null
  const [selectedRusheeIds, setSelectedRusheeIds] = useState(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [likelihoods, setLikelihoods] = useState(new Map(rushees.map(rushee => [rushee.id, rushee.likelihood])));

  const safeRushees = Array.isArray(rushees) ? rushees : [];
  const safeUserStars = userStars instanceof Set ? userStars : new Set(Array.isArray(userStars) ? userStars : []);
  const userStarCount = safeUserStars.size;

  const handleUpdate = () => {
    // Refresh server data to get updated counts and user reactions
    router.refresh();
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
      if (a.cut_status === b.cut_status) {
        return a.name.localeCompare(b.name);
      }
      return a.cut_status.localeCompare(b.cut_status);
    });
    
  const selectedRushee = selectedModal !== null ? filteredRushees[selectedModal] : null;

  return (
    <div>
      <div className="flex flex-row items-center gap-2 mb-4">
        <div className="relative w-full lg:w-1/2 xl:w-1/4">
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
            size="sm"
            onClick={() => setCutStatusFilter("active")}
          >
            Active
          </Button>
          <Button
            variant={cutStatusFilter === "cut" ? "default" : "outline"}
            size="sm"
            onClick={() => setCutStatusFilter("cut")}
          >
            Cut
          </Button>
          <Button
            variant={cutStatusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setCutStatusFilter("all")}
          >
            All
          </Button>
        </div>
        <Popover open={mainFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="!text-muted-foreground ml-4 cursor-pointer"
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
        {isAdmin && (
          <div className="flex gap-2 ml-4">
            <Button
              variant={selectionMode === "cut" ? "default" : "outline"}
              size="sm"
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
              size="sm"
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
          </div>
        )}
        <Card className="flex flex-row ml-auto mr-17 h-9.5 gap-2 shadow-none pt-2 px-3 pb-2 text-sm items-center">
              <Star className="h-5 w-5 fill-current text-yellow-500" /><p>Remaining Stars: {3 - userStarCount || 0}</p>
        </Card>
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
            comments={comments.filter(c => c.rushee_id === selectedRushee.id)}
            notes={notes.find(n => n.rushee_id === selectedRushee.id)?.body || ""}
            likeCount={selectedRushee.like_count}
            dislikeCount={selectedRushee.dislike_count}
            starCount={selectedRushee.star_count}
            onUpdate={handleUpdate}
            nextRushee={() => setSelectedModal(prev => (prev + 1) % filteredRushees.length)}
            prevRushee={() => setSelectedModal(prev => (prev - 1 + filteredRushees.length) % filteredRushees.length)}
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
                setSelectedModal(index);
              }
            }}
            userStarCount={userStarCount}
            safeUserStars={safeUserStars}
            isSelected={selectedRusheeIds.has(rushee.id)}
            selectionMode={selectionMode}
            likelihood={likelihoods.get(rushee.id) || "green"}
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
    <PopoverContent className="p-1">
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