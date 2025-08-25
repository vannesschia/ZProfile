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
  // if (value >= Math.max(target - 1, 0)) return "bg-amber-50 border-amber-200 text-amber-800"
  return "bg-red-50 border-red-200 text-red-800"
}

export function getColumns({milestones, currentMilestone}) {
  const { cc, cp } = getTargets(milestones, currentMilestone);

  function makeNeedsThenNameSorter({ cc, cp }) {
    return (rowA, rowB) => {
      const a = rowA.original || {}
      const b = rowB.original || {}

      // Committee Points
      const aCP = Number(a.total_committee_points ?? 0)
      const bCP = Number(b.total_committee_points ?? 0)
      const needsCPA = aCP < cp
      const needsCPB = bCP < cp

      // Coffee Chats (target = cc + extra_needed)
      const aCC = a.coffee_chats || {}
      const bCC = b.coffee_chats || {}
      const aCCAcq = Number(aCC.acquired ?? 0)
      const bCCAcq = Number(bCC.acquired ?? 0)
      const needsCCA = aCCAcq < (cc + Number(aCC.extra_needed ?? 0))
      const needsCCB = bCCAcq < (cc + Number(bCC.extra_needed ?? 0))

      // Priority: both unmet (2) > one unmet (1) > none (0)
      const prioA = (needsCPA ? 1 : 0) + (needsCCA ? 1 : 0)
      const prioB = (needsCPB ? 1 : 0) + (needsCCB ? 1 : 0)
      if (prioA !== prioB) return prioB - prioA // higher first

      // Tie-break: alphabetical by name
      const nameA = a.name ?? ""
      const nameB = b.name ?? ""
      return nameA.localeCompare(nameB, undefined, { sensitivity: "base" })
    }
  }


  return [
    {
      accessorKey: "name",
      header: "Name",
      meta: { widthClass: "min-w-[200px]" },
      sortingFn: makeNeedsThenNameSorter( { cc, cp }),
      cell: ({ row }) => {
        const { name, uniqname } = row.original
        return <EventsModal uniqname={uniqname} name={name} role="pledge" />
      },
    },
    {
      accessorKey: "total_committee_points",
      header: "Committee Points",
      meta: { widthClass: "min-w-[100px]" },
      cell: ({ getValue }) => {
        const value = getValue()
        const bg = levelBg(value, cp)
        return (
          <span className={cn("inline-block rounded-md border px-2 py-1 font-medium min-w-[150px] max-w-[150px] text-center", bg)}>
            {value}
          </span>
        )
      },
    },
    {
      accessorKey: "coffee_chats",
      header: "Coffee Chats",
      meta: { widthClass: "min-w-[100px]" },
      cell: ({ getValue }) => {
        const value = getValue();
        const bg = levelBg(value.acquired, cc + value.extra_needed)
        return (
          <div className="flex flex-row gap-1 min-w-[150px] max-w-[150px]">
            <span className={cn("inline-block rounded-md border px-2 py-1 font-medium text-center min-w-[100px] w-full", bg)}>
              {value.acquired}
            </span>
            {value.extra_needed > 0 && <span className="inline-block rounded-md border px-2 py-1 font-medium text-center min-w-[50px]"> +{value.extra_needed}</span>}
          </div>
        )
      },
    },
    {
      accessorKey: "chapter_events_attended",
      header: "Chapters",
      meta: { widthClass: "min-w-[100px]" },
    },
    {
      accessorKey: "excused_absences",
      header: "Excused",
      meta: { widthClass: "min-w-[100px]" },
    },
    {
      accessorKey: "unexcused_absences",
      header: "Unexcused",
      meta: { widthClass: "min-w-[100px]" },
    },
    {
      accessorKey: "status",
      header: "Status",
      meta: { widthClass: "min-w-[100px]" },
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
