"use client"
import { useState, useMemo } from "react"
import { ProgressTabAdmin } from "@/app/components/progress-block"
import { PledgeOverviewAdminTable } from "@/app/components/admin-view/milestone/data-table"
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
import { ChevronDown, Milestone, Search } from "lucide-react"
import { formatMonthDayNumeric } from "@/lib/utils"

export default function AdminPledgeViewTable({ milestones, pledgeProgress }) {
  const [currentMilestone, setcurrentMilestone] = useState("1")
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("pledge")

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
    const base = withStatus
    if (!search) return base
    const term = search.toLowerCase()
    return base.filter(
      (row) => row.name.toLowerCase().includes(term) || row.uniqname.toLowerCase().includes(term)
    )
  }, [withStatus, search])

  const handleTabChange = (value) => {
    setActiveTab(value)
  }

  return (
    <Tabs defaultValue="pledge" className="gap-6" value={activeTab} onValueChange={handleTabChange}>
      <div className="flex sm:flex-row flex-col gap-2 justify-between">
        <TabsList>
          <TabsTrigger value="pledge">Pledge 
            <Badge variant="secondary" className="bg-muted-foreground/30 size-5 rounded-full px-1">{pledgeProgress.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="brother">Brother</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
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
                <Input
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </>
          )}

          {activeTab === "brother" && (
            <Button variant="outline">Brother's Action</Button>
          )}

          {activeTab === "events" && (
            <Button variant="outline">Event's Action</Button>
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
          <PledgeOverviewAdminTable data={filteredProgress} />
        </div>
      </TabsContent>

      <TabsContent value="brother">{/* Brother content here */}</TabsContent>
      <TabsContent value="events">{/* Event content here */}</TabsContent>
    </Tabs>
  )
}
