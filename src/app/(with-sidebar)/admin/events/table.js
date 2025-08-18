"use client"
import { useState, useMemo } from "react"
import { ProgressTabAdmin } from "@/app/components/progress-block"
import { PledgeOverviewAdminTable } from "@/app/components/admin-view/pledge/data-table"
import { CommitteeEventsWithAttendance } from "@/app/components/admin-view/events/data-table"
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
import Link from "next/link"

export default function AdminEventViewTable({ committeesAttendance, indvCommitteeCount }) {

  return (
    <Tabs defaultValue="events" className="gap-6">
      <div className="flex sm:flex-row flex-col gap-2 justify-between">
        <TabsList>
          <TabsTrigger value="pledge">
            <Link href="/admin/pledge">Pledge</Link>
          </TabsTrigger>
          <TabsTrigger value="brother">Brother</TabsTrigger>
          <TabsTrigger value="events">
            Events
            <Badge variant="secondary" className="bg-muted-foreground/30 size-5 rounded-full px-1">0</Badge>
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-row items-center gap-2">
          <p>test</p>
        </div>
      </div>

      <TabsContent value="events">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 w-full">
            <ProgressTabAdmin title="Fundraising">{indvCommitteeCount.fundraising ? indvCommitteeCount.fundraising : 0}</ProgressTabAdmin>
            <ProgressTabAdmin title="Marketing">{indvCommitteeCount.marketing ? indvCommitteeCount.marketing : 0}</ProgressTabAdmin>
            <ProgressTabAdmin title="Prof Dev">{indvCommitteeCount.prof_dev ? indvCommitteeCount.prof_dev : 0}</ProgressTabAdmin>
            <ProgressTabAdmin title="RAM">{indvCommitteeCount.ram ? indvCommitteeCount.ram : 0}</ProgressTabAdmin>
            <ProgressTabAdmin title="Social">{indvCommitteeCount.social ? indvCommitteeCount.social : 0}</ProgressTabAdmin>
            <ProgressTabAdmin title="Technology">{indvCommitteeCount.technology ? indvCommitteeCount.technology : 0}</ProgressTabAdmin>
          </div>
          <CommitteeEventsWithAttendance data={committeesAttendance} />
        </div>
      </TabsContent>
    </Tabs>
  )
}
