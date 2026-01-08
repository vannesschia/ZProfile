"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import RusheeCard from "@/app/components/RusheeCard";
import { Book, BookOpenText, GraduationCap, ListFilter, Plus, School, Search, XIcon, Star } from "lucide-react";
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

  const safeRushees = Array.isArray(rushees) ? rushees : [];
  const safeUserStars = userStars instanceof Set ? userStars : new Set(Array.isArray(userStars) ? userStars : []);
  const userStarCount = safeUserStars.size;

  const handleUpdate = () => {
    // Refresh server data to get updated counts and user reactions
    router.refresh();
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
    .sort((a, b) => a.name.localeCompare(b.name));

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
            notes={notes.find(n => n.rushee_id === selectedRushee.id)?.body || ""}
            likeCount={selectedRushee.like_count}
            dislikeCount={selectedRushee.dislike_count}
            starCount={selectedRushee.star_count}
            onUpdate={handleUpdate}
            nextRushee={() => setSelectedModal(prev => (prev + 1) % filteredRushees.length)}
            prevRushee={() => setSelectedModal(prev => (prev - 1 + filteredRushees.length) % filteredRushees.length)}
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
              setIsModalOpen(true);
              setSelectedModal(index);
            }}
            userStarCount={userStarCount}
            safeUserStars={safeUserStars}
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