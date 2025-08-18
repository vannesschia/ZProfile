"use client"
import dynamic from "next/dynamic"
import { Badge } from "@/components/ui/badge"
import { XCircle, CheckCircle2, CircleDashed } from "lucide-react"
import { cn } from "@/lib/utils"

const EventsModal = dynamic(() => import("../events-modal"), { ssr: false })

function getTargets(milestones, currentMilestone) {
  const map = {
    "1": { cc: milestones.first_milestone_cc,  cp: milestones.first_milestone_cp },
    "2": { cc: milestones.second_milestone_cc, cp: milestones.second_milestone_cp },
    "3": { cc: milestones.final_milestone_cc,  cp: milestones.final_milestone_cp },
  }
  return map[currentMilestone]
}

function levelBg(value, target) {
  if (value >= target) return "bg-green-50 border-green-200 text-green-800"
  if (value >= Math.max(target - 1, 0)) return "bg-amber-50 border-amber-200 text-amber-800"
  return "bg-red-50 border-red-200 text-red-800"
}

export function getColumns({milestones, currentMilestone}) {
  const { cc, cp } = getTargets(milestones, currentMilestone);
  return [
    {
      accessorKey: "name",
      header: "Name",
      meta: { widthClass: "min-w-[200px]" },
      cell: ({ row }) => {
        // safer than searching `data` each time
        const { name, uniqname } = row.original
        return <EventsModal uniqname={uniqname} name={name} role="pledge" />
      },
    },
    {
      accessorKey: "total_committee_points",
      header: "Committee Points",
      meta: { widthClass: "min-w-[200px]" },
      cell: ({ getValue }) => {
        const value = getValue()
        const bg = levelBg(value, cp)
        return (
          <span className={cn("inline-block rounded-md border px-2 py-1 font-medium w-full", bg)}>
            {value}
          </span>
        )
      },
    },
    {
      accessorKey: "total_coffee_chats",
      header: "Coffee Chats",
      meta: { widthClass: "min-w-[200px]" },
      cell: ({ getValue }) => {
        const value = getValue();
        const bg = levelBg(value, cc)
        return (
          <span className={cn("inline-block rounded-md border px-2 py-1 font-medium w-full", bg)}>
            {value}
          </span>
        )
      },
    },
    {
      accessorKey: "absences",
      header: "Absences",
      cell: ({ getValue }) => {
        const value = getValue()
        return (
          <div className="flex flex-row items-center gap-1">
            <Badge variant="outline">{value.excused} Excused</Badge>
            <Badge variant="outline">{value.unexcused} Unexcused</Badge>
          </div>
        )
      },
      meta: { widthClass: "min-w-[200px]" },
    },
    {
      accessorKey: "chapter_events_attended",
      header: "Chapters",
      meta: { widthClass: "min-w-[200px]" },
    },
    {
      accessorKey: "status",
      header: "Status",
      meta: { widthClass: "min-w-[200px]" },
      cell: ({ getValue }) => {
        const status = getValue()
        if (status === "late") {
          return (
            <Badge variant="outline">
              <XCircle className="text-red-700" /> Late
            </Badge>
          )
        } else if (status === "on_track") {
          return (
            <Badge variant="outline">
              <CircleDashed className="text-neutral-700" /> On Track
            </Badge>
          )
        } else {
          return (
            <Badge variant="outline">
              <CheckCircle2 className="text-green-700" /> Completed
            </Badge>
          )
        }
      },
    },
  ]
}
