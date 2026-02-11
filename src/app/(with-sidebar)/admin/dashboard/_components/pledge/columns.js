"use client"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { XCircle, CheckCircle2, CircleDashed, Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const EventsModal = dynamic(() => import("../events-modal"), { ssr: false })

function CoffeeChatsEditableCell({ acquired, stillNeeds, bg, onUpdate }) {
  const [localNeeds, setLocalNeeds] = useState(stillNeeds)
  const [isEditing, setIsEditing] = useState(false)
  useEffect(() => { setLocalNeeds(stillNeeds); }, [stillNeeds])
  const displayNeeds = isEditing ? localNeeds : stillNeeds

  const apply = (val) => {
    const n = Math.max(0, Math.floor(Number(val)))
    setLocalNeeds(n)
    onUpdate?.(n)
  }

  return (
    <div className={cn("flex flex-row items-center gap-1 min-w-[180px]", bg, "rounded-md border px-2 py-1")}>
      <span className="font-medium shrink-0">{acquired}</span>
      <span className="text-muted-foreground shrink-0">· need</span>
      {isEditing ? (
        <Input
          type="number"
          min={0}
          value={localNeeds}
          onChange={(e) => setLocalNeeds(Math.max(0, parseInt(e.target.value, 10) || 0))}
          onBlur={() => { apply(localNeeds); setIsEditing(false); }}
          onKeyDown={(e) => e.key === "Enter" && (apply(localNeeds), setIsEditing(false))}
          className="h-7 w-12 text-center py-0 px-1 shrink-0"
          autoFocus
        />
      ) : (
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => apply(displayNeeds - 1)}
            disabled={displayNeeds <= 0}
            aria-label="Decrease"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <button
            type="button"
            className="min-w-[1.5rem] font-medium text-center tabular-nums hover:underline"
            onClick={() => setIsEditing(true)}
            aria-label="Edit needs"
          >
            {displayNeeds}
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => apply(displayNeeds + 1)}
            aria-label="Increase"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

function getTargets(milestones, currentMilestone) {
  const map = {
    "1": { cc: milestones.first_milestone_cc,  cp: milestones.first_milestone_cp },
    "2": { cc: milestones.second_milestone_cc, cp: milestones.second_milestone_cp },
    "3": { cc: milestones.final_milestone_cc,  cp: milestones.final_milestone_cp },
  }
  return map[currentMilestone]
}

function levelBg(value, target, status) {
  if (value >= target) return "bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700"
  if (status === "on_track") return "bg-neutral-50 text-neutral-800 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-200 dark:border-neutral-700"
  return "bg-red-50 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700"
}

export function getColumns({ milestones, currentMilestone, ccOverrides = {}, onUpdateCCRequired }) {
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

      // Coffee Chats (target = cc + offset + 3*unexcused; offset applies to all milestones)
      const aCC = a.coffee_chats || {}
      const bCC = b.coffee_chats || {}
      const aCCAcq = Number(aCC.acquired ?? 0)
      const bCCAcq = Number(bCC.acquired ?? 0)
      const aUnexcused = Number(a.unexcused_absences ?? 0)
      const bUnexcused = Number(b.unexcused_absences ?? 0)
      const aRequired = cc + (Number(ccOverrides[a.uniqname]) || 0) + 3 * aUnexcused
      const bRequired = cc + (Number(ccOverrides[b.uniqname]) || 0) + 3 * bUnexcused
      const needsCCA = aCCAcq < aRequired
      const needsCCB = bCCAcq < bRequired

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
      cell: ({ row, getValue }) => {
        const value = getValue()
        const bg = levelBg(value, cp, row.original.status)
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
      meta: { widthClass: "min-w-[180px]" },
      cell: ({ row, getValue }) => {
        const value = getValue();
        const uniqname = row.original.uniqname;
        const acquired = Number(value?.acquired ?? 0);
        const unexcused = Number(row.original.unexcused_absences ?? 0);
        const offset = Number(ccOverrides[uniqname]) || 0;
        const effectiveRequired = cc + offset + 3 * unexcused;
        const stillNeeds = Math.max(0, effectiveRequired - acquired);
        const bg = levelBg(acquired, effectiveRequired, row.original.status);
        return (
          <CoffeeChatsEditableCell
            acquired={acquired}
            stillNeeds={stillNeeds}
            bg={bg}
            onUpdate={(newStillNeeds) => onUpdateCCRequired?.(uniqname, acquired, newStillNeeds, cc, unexcused)}
          />
        );
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
