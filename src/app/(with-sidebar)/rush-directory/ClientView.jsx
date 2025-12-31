"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import RusheeCard from "@/app/components/RusheeCard";
import { Book, BookOpenText, GraduationCap, ListFilter, Plus, School, Search, XIcon } from "lucide-react";
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

const GRADES = ["freshman", "sophomore", "junior", "senior", "graduate_student"]

const GRAD_YEAR = [2025, 2026, 2027, 2028, 2029]

const GREEK_ORDER = [ //will need to be changed years later 
  //                     when class names are "alpha beta", etc 
  "alpha", "beta", "gamma", "delta", "epsilon",
  "zeta", "eta", "theta", "iota", "kappa",
  "lambda", "mu", "nu", "xi", "omicron",
  "pi", "rho", "sigma", "tau", "upsilon",
  "phi", "chi", "psi", "omega",
];

const greekIndex = Object.fromEntries(
  GREEK_ORDER.map((g, i) => [g, i]) // alpha=0, beta=1, ...
);

function sectionComparator([aKey], [bKey]) {
  const a = String(aKey ?? "").trim().toLowerCase();
  const b = String(bKey ?? "").trim().toLowerCase();
  return (greekIndex[b] ?? Infinity) - (greekIndex[a] ?? Infinity);
}

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

  const safeRushees = Array.isArray(rushees) ? rushees : [];
  const safeUserStars = userStars instanceof Set ? userStars : new Set(Array.isArray(userStars) ? userStars : []);

  const handleUpdate = () => {
    // Refresh server data to get updated counts and user reactions
    router.refresh();
  };

  // Group rushees by class_name (default to "eta" if not set)
  const grouped = safeRushees
    .filter((rushee) => {
      if (cutStatusFilter === "all") return true;
      return rushee.cut_status === cutStatusFilter;
    })
    .reduce((acc, rushee) => {
      const className = (rushee.class_name || "eta").trim().toLowerCase();
      if (!className) return acc; // skip empty class names
      if (!acc[className]) acc[className] = [];
      acc[className].push(rushee);
      return acc;
    }, {});

  // Sort each class by name
  Object.values(grouped).forEach((classMembers) => {
    classMembers.sort((a, b) => a.name.localeCompare(b.name));
  });

  const filteredRushees = Object.entries(grouped)
    .sort(sectionComparator) // α → β → γ → …
    .flatMap(([_, rushees]) =>
      rushees.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) &&
        cutStatusFilter === "all" || r.cut_status === cutStatusFilter
      )
    );

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
                      onClick={() => { setFilterList(prev => prev.filter(ff => ff != "grade")) }}
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
                      onClick={() => setFilterList(prev => prev.filter(ff => ff != "grad_year"))}
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
            notes={notes.filter(n => n.rushee_id === selectedRushee.id)}
            likeCount={selectedRushee.like_count}
            dislikeCount={selectedRushee.dislike_count}
            starCount={selectedRushee.star_count}
            onUpdate={handleUpdate}
            nextRushee={() => setSelectedModal(prev => (prev + 1) % filteredRushees.length)}
            prevRushee={() => setSelectedModal(prev => (prev - 1 + filteredRushees.length) % filteredRushees.length)}
          />
        }
      </Dialog>

      {Object.entries(grouped)
        .sort(sectionComparator) // α → β → γ → …
        .map(([className, classMembers]) => {
          const filtered = classMembers.filter((m) =>
            m.name.toLowerCase().includes(search.toLowerCase()) &&
            majorFilter.every(maj => m.major.includes(maj)) &&
            minorFilter.every(min => m.minor.includes(min)) &&
            (gradeFilter.length === 0 || gradeFilter.includes(m.grade)) &&
            (gradYearFilter.length === 0 || gradYearFilter.includes(m.graduation_year))
          );
          if (filtered.length === 0) return null;

          return (
            <section key={className} className="mb-10">
              <h2 className="text-xl font-semibold mb-4">
                {className}
              </h2>
              <div className="flex flex-wrap gap-4 justify-start items-start">
                {filtered.map((rushee) => {
                  const filteredIndex = filteredRushees.findIndex(r => r.id === rushee.id);
                  return (
                    <RusheeCard
                      key={rushee.id || rushee.uniqname}
                      rushee={rushee}
                      userReaction={userReactions[rushee.id] || 'none'}
                      isStarred={safeUserStars.has(rushee.id)}
                      onUpdate={handleUpdate}
                      openModal={() => {
                        setIsModalOpen(true);
                        setSelectedModal(filteredIndex);
                      }}
                    />
                  )
                })}
              </div>
            </section>
          );
        })}
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