"use client"
import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ProgressTabAdmin } from "@/app/components/progress-block"
import { PledgeOverviewAdminTable } from "@/app/components/admin-view/pledge/data-table"
import { BrotherOverviewAdminTable } from "@/app/components/admin-view/brother/data-table"
import { CommitteeEventsWithAttendance, ChapterWithAttendance, DefaultEventsWithAttendance } from "@/app/components/admin-view/events/data-table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs2"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Milestone, Search, CalendarSearch, Plus, Medal } from "lucide-react"
import { formatMonthDayNumeric, capitalizeFirstLetter } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function AdminViewTable({
  milestones,
  pledgeProgress,
  committeesAttendance,
  indvCommitteeCount,
  chapterAttendance,
  pledgeEventAttendance,
  rushEventsAttendance,
  studyTableAttendance,
  brotherView,
  brotherRequirement
}) {
  // General Tabs Logic
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "pledge";
  const [activeTab, setActiveTab] = useState(initialTab)

  const handleTabChange = (value) => {
    setActiveTab(value);
  }

  useEffect(() => {
    const tab = searchParams.get("tab") ?? "pledge";
    if (tab !== activeTab) setActiveTab(tab);
  }, [searchParams]);

  // Pledge States
  const [currentMilestone, setcurrentMilestone] = useState("1")
  const [search, setSearch] = useState("")

  const stats = useMemo(() => {
    const keyMap = {
      "1": { cc: "first_milestone_cc", cp: "first_milestone_cp", due: "first_milestone_due_date", statusKey: "first_status" },
      "2": { cc: "second_milestone_cc", cp: "second_milestone_cp", due: "second_milestone_due_date", statusKey: "second_status" },
      "3": { cc: "final_milestone_cc", cp: "final_milestone_cp", due: "final_milestone_due_date", statusKey: "final_status" },
    };
    const { cc, cp, due, statusKey } = keyMap[currentMilestone];
    const coffeeChats = Number(milestones[cc]);
    const committeePoints = Number(milestones[cp]);
    const dueBy = formatMonthDayNumeric(milestones[due]);
    const statusCounts = pledgeProgress.reduce(
      (acc, row) => {
        const status = row[statusKey];
        if (status === "completed") acc.completed += 1;
        if (status === "on_track") acc.onTrack += 1;
        if (status === "late") acc.late += 1;
        return acc;
      },
      { completed: 0, onTrack: 0, late: 0 }
    );
    return { coffeeChats, committeePoints, dueBy, ...statusCounts };
  }, [currentMilestone, milestones, pledgeProgress]);

  const withStatus = useMemo(() => {
    return pledgeProgress.map((row) => {
      let status
      if (currentMilestone === "1") status = row.first_status
      else if (currentMilestone === "2") status = row.second_status
      else status = row.final_status
      return { ...row, status }
    })
  }, [pledgeProgress, currentMilestone])

  const filteredProgress = useMemo(() => {
    if (!search) return withStatus
    const term = search.toLowerCase()
    return withStatus.filter(
      (row) => row.name.toLowerCase().includes(term) || row.uniqname.toLowerCase().includes(term)
    )
  }, [withStatus, search])

  // Events States
  const EVENT_TYPES = ["committee_event", "chapter", "rush_event", "pledge_event", "study_table"];
  const [eventType, setEventType] = useState("committee_event")
  const [searchByType, setSearchByType] = useState({
    committee_event: "",
    chapter: "",
    rush_event: "",
    pledge_event: "",
    study_table: "",
  });

  const setActiveSearch = (val) =>
    setSearchByType((prev) => ({ ...prev, [eventType]: val }));

  const eventMap = {
    committee_event: committeesAttendance,
    chapter: chapterAttendance,
    rush_event: rushEventsAttendance,
    pledge_event: pledgeEventAttendance,
    study_table: studyTableAttendance,
  };

  const filterFns = {
    committee_event: (row, t) => row.name?.toLowerCase().includes(t),
    chapter: (row, t) => row.name?.toLowerCase().includes(t),
    rush_event: (row, t) => row.name?.toLowerCase().includes(t),
    pledge_event: (row, t) => row.name?.toLowerCase().includes(t),
    study_table: (row, t) => row.name?.toLowerCase().includes(t),
  };

  const filteredEventsMap = useMemo(() => {
    const out = {};
    for (const type of EVENT_TYPES) {
      const base = eventMap[type] ?? [];
      const term = (searchByType[type] || "").toLowerCase().trim();
      out[type] = term ? base.filter((row) => filterFns[type](row, term)) : base;
    }
    return out;
  }, [
    committeesAttendance,
    chapterAttendance,
    rushEventsAttendance,
    pledgeEventAttendance,
    studyTableAttendance,
    searchByType,
  ]);

  // Brother States
  const [searchBrother, setSearchBrother] = useState("");

  const filteredBrothers = useMemo(() => {
    if (!searchBrother) return brotherView
    const brother = searchBrother.toLowerCase()
    return brotherView.filter(
      (row) => row.name.toLowerCase().includes(brother) || row.uniqname.toLowerCase().includes(brother)
    )
  }, [brotherView, searchBrother])

  const brotherStats = brotherView.reduce(
    (acc, row) => {
      const status = row.status;
      if (status === "completed") acc.completed += 1;
      if (status === "on_track") acc.onTrack += 1;
      if (status === "late") acc.late += 1;
      return acc;
    },
    { completed: 0, onTrack: 0, late: 0 }
  );

  return (
    <Tabs defaultValue="pledge" className="gap-6" value={activeTab} onValueChange={handleTabChange}>
      <div className="flex sm:flex-row flex-col gap-2 justify-between">
        <TabsList>
          <TabsTrigger value="pledge">Pledge
            <Badge variant="secondary" className="bg-muted-foreground/30 size-5 rounded-full px-1">{pledgeProgress.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="brother">Brother
            <Badge variant="secondary" className="bg-muted-foreground/30 size-5 rounded-full px-1">{brotherView.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="events">Events
            <Badge variant="secondary" className="bg-muted-foreground/30 size-5 rounded-full px-1">
              {eventType === "committee_event" && committeesAttendance.length}
              {eventType === "chapter" && chapterAttendance.length}
              {eventType === "rush_event" && rushEventsAttendance.length}
              {eventType === "pledge_event" && pledgeEventAttendance.length}
              {eventType === "study_table" && pledgeEventAttendance.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-row items-center gap-2">
          {activeTab === "pledge" && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Milestone /> Milestone #{currentMilestone} <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuRadioGroup value={currentMilestone} onValueChange={(val) => setcurrentMilestone(val)}>
                    <DropdownMenuRadioItem value="1">Milestone #1</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="2">Milestone #2</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="3">Milestone #3</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="relative sm:w-64 w-full">
                <Search className="text-muted-foreground pointer-events-none absolute pl-2 top-1/2 -translate-y-1/2" />
                <Input
                  type="search"
                  className="pl-8 text-sm"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button className="gap-1" asChild>
                <Link href="/admin/initiation">
                  <Medal/>Initiate
                </Link>
              </Button>
            </>
          )}

          {activeTab === "brother" && (
            <div className="relative sm:w-64 w-full">
              <Search className="text-muted-foreground pointer-events-none absolute pl-2 top-1/2 -translate-y-1/2" />
              <Input
                type="search"
                className="pl-8 text-sm"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          {activeTab === "events" && (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex flex-row gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <CalendarSearch /> {capitalizeFirstLetter(eventType)} <ChevronDown />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuRadioGroup value={eventType} onValueChange={(val) => setEventType(val)} className="min-w-[175px]">
                      <DropdownMenuRadioItem value="committee_event">Committee Event</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="chapter">Chapter</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="rush_event">Rush Event</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="pledge_event">Pledge Event</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="study_table">Study Table</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="relative sm:w-64 w-full">
                  <Search className="text-muted-foreground pointer-events-none absolute pl-2 top-1/2 -translate-y-1/2" />
                  <Input
                    type="search"
                    className="pl-8 text-sm"
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <Button className="gap-1 !pl-2 pr-3" asChild>
                <Link href="/admin/events/create">
                  <Plus/>Create Event
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Conditional content for each tab */}
      <TabsContent value="pledge">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 w-full">
            <ProgressTabAdmin title="Coffee Chats">{stats.coffeeChats}</ProgressTabAdmin>
            <ProgressTabAdmin title="Committee Points">{stats.committeePoints}</ProgressTabAdmin>
            <ProgressTabAdmin title="Due by">{stats.dueBy}</ProgressTabAdmin>
            <ProgressTabAdmin title="Completed">{stats.completed}</ProgressTabAdmin>
            <ProgressTabAdmin title="On Track">{stats.onTrack}</ProgressTabAdmin>
            <ProgressTabAdmin title="Late">{stats.late}</ProgressTabAdmin>
          </div>
          <PledgeOverviewAdminTable
            data={filteredProgress}
            milestones={milestones}
            currentMilestone={currentMilestone}
          />
        </div>
      </TabsContent>

      <TabsContent value="brother">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 w-full">
            <ProgressTabAdmin title="Requirements">{brotherRequirement[0].brother_committee_pts_req}</ProgressTabAdmin>
            <ProgressTabAdmin title="Due by">{formatMonthDayNumeric(brotherRequirement[0].semester_last_day)}</ProgressTabAdmin>
            <ProgressTabAdmin title="Completed">{brotherStats.completed}</ProgressTabAdmin>
            <ProgressTabAdmin title="On Track">{brotherStats.onTrack}</ProgressTabAdmin>
            <ProgressTabAdmin title="Late">{brotherStats.late}</ProgressTabAdmin>
          </div>
          <BrotherOverviewAdminTable data={filteredBrothers} requirement={brotherRequirement[0].brother_committee_pts_req}/>
        </div>
      </TabsContent>

      <TabsContent value="events">
        <div className="flex flex-col gap-4">
          {eventType === "committee_event" &&
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 w-full">
              <ProgressTabAdmin title="Fundraising">{indvCommitteeCount.fundraising ?? 0}</ProgressTabAdmin>
              <ProgressTabAdmin title="Marketing">{indvCommitteeCount.marketing ?? 0}</ProgressTabAdmin>
              <ProgressTabAdmin title="Prof Dev">{indvCommitteeCount.prof_dev ?? 0}</ProgressTabAdmin>
              <ProgressTabAdmin title="RAM">{indvCommitteeCount.ram ?? 0}</ProgressTabAdmin>
              <ProgressTabAdmin title="Social">{indvCommitteeCount.social ?? 0}</ProgressTabAdmin>
              <ProgressTabAdmin title="Technology">{indvCommitteeCount.technology ?? 0}</ProgressTabAdmin>
            </div>
          }
          {eventType === "committee_event" && <CommitteeEventsWithAttendance data={filteredEventsMap.committee_event} />}
          {eventType === "chapter" && <ChapterWithAttendance data={filteredEventsMap.chapter} />}
          {eventType === "rush_event" && <DefaultEventsWithAttendance data={filteredEventsMap.rush_event} />}
          {eventType === "pledge_event" && <DefaultEventsWithAttendance data={filteredEventsMap.pledge_event} />}
          {eventType === "study_table" && <DefaultEventsWithAttendance data={filteredEventsMap.study_table} />}
        </div>
      </TabsContent>
    </Tabs>
  )
}
