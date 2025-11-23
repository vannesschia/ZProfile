"use client"
import dynamic from "next/dynamic"
import { Badge } from "@/components/ui/badge"
import { XCircle, CheckCircle2, CircleDashed } from "lucide-react"
import { cn } from "@/lib/utils"

const EventsModal = dynamic(() => import("../events-modal"), { ssr: false })

function checkStatus(status) {
  if (status === "completed") {
    return "bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700"
  }
  if (status === "on_track") {
    return "bg-neutral-50 text-neutral-800 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-200 dark:border-neutral-700"
  }
  return "bg-red-50 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700"
}

export function getColumns({data, requirement}) {
  return [
    {
      accessorKey: "name",
      header: "Name",
      meta: { widthClass: "min-w-[200px]" },

      sortingFn: (rowA, rowB) => {
        const a = rowA.original;
        const b = rowB.original;

        // 1) Active first
        if (a.active !== b.active) return a.active ? -1 : 1;

         // 2) Status order: late → on_track → completed
        const statusRank = { late: 0, on_track: 1, completed: 2 };
        const ra = statusRank[a.status] ?? 99;
        const rb = statusRank[b.status] ?? 99;
        if (ra !== rb) return ra - rb;

        // 3) Alphabetical by name
        return (a.name ?? "").localeCompare(b.name ?? "");
      },
      cell: ({ row }) => {
        const { name, uniqname, active } = row.original
        return (
          <div className="flex flex-row gap-3 items-center">
            {active ? 
              <div className="rounded-full h-2 w-2 bg-green-500"></div>
              : <div className="rounded-full h-2 w-2 bg-red-500"></div>
            }
            <EventsModal uniqname={uniqname} name={name} role="brother" />
          </div>
        )
      },
    },
    {
      accessorKey: "total_attendance_points",
      header: "Attendance Points",
      meta: { widthClass: "min-w-[100px]" },
      cell: ({ row, getValue }) => {
        const value = getValue()
        const bg2 = checkStatus(row.original.status)
        return (
          <span className={cn("inline-block rounded-md border px-2 py-1 font-medium min-w-[150px] max-w-[150px] text-center", bg2)}>
            {value}
          </span>
        )
      },
    },
    {
      accessorKey: "committee_points",
      header: "Committee Points",
      meta: { widthClass: "min-w-[100px]" },
      cell: ({ getValue }) => {
        const value = getValue();
        return (
          <div>
            <span>
              {value.acquired}
            </span>
            <span className="ml-1">
              {value.extra_needed > 0 && <Badge variant="outline"> +{value.extra_needed}</Badge>}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "chapters_attended",
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
