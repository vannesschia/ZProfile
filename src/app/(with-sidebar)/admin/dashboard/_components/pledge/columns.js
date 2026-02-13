"use client"
import dynamic from "next/dynamic"
import { Badge } from "@/components/ui/badge"
import { XCircle, CheckCircle2, CircleDashed, Ellipsis } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CoffeeChatOffsetDialog } from "./coffee-chat-offset-dialog"
import { useState } from "react"

const EventsModal = dynamic(() => import("../events-modal"), { ssr: false })

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

      // Coffee Chats (target = cc + extra_needed + coffee_chat_offset)
      const aCC = a.coffee_chats || {}
      const bCC = b.coffee_chats || {}
      const aCCAcq = Number(aCC.acquired ?? 0)
      const bCCAcq = Number(bCC.acquired ?? 0)
      const aExtraNeeded = Number(aCC.extra_needed ?? 0) + Number(a.coffee_chat_offset ?? 0)
      const bExtraNeeded = Number(bCC.extra_needed ?? 0) + Number(b.coffee_chat_offset ?? 0)
      const needsCCA = aCCAcq < (cc + aExtraNeeded)
      const needsCCB = bCCAcq < (cc + bExtraNeeded)

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
      meta: { widthClass: "min-w-[100px]" },
      cell: ({ row, getValue }) => {
        const value = getValue();
        const coffeeChatOffset = Number(row.original.coffee_chat_offset ?? 0);
        const totalExtraNeeded = Number(value.extra_needed ?? 0) + coffeeChatOffset;
        const bg = levelBg(value.acquired, cc + totalExtraNeeded, row.original.status)
        return (
          <div className="flex flex-row gap-1 min-w-[150px] max-w-[150px]">
            <span className={cn("inline-block rounded-md border px-2 py-1 font-medium text-center min-w-[100px] w-full", bg)}>
              {value.acquired}
            </span>
            {totalExtraNeeded > 0 && <span className="inline-block rounded-md border px-2 py-1 font-medium text-center min-w-[50px]"> +{totalExtraNeeded}</span>}
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
    {
      id: "actions",
      header: "",
      meta: { widthClass: "min-w-[50px]" },
      cell: ({ row }) => {
        return <PledgeActionsCell pledge={row.original} />
      },
    },
  ]
}

function PledgeActionsCell({ pledge }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleMenuItemClick = (e) => {
    e.preventDefault();
    setDropdownOpen(false);
    // Use requestAnimationFrame to ensure dropdown closes before dialog opens
    requestAnimationFrame(() => {
      setDialogOpen(true);
    });
  };

  const handleDialogClose = (open) => {
    setDialogOpen(open);
    if (!open) {
      // Ensure dropdown is closed when dialog closes
      setDropdownOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <button 
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent"
            onClick={(e) => {
              // Prevent event bubbling
              e.stopPropagation();
            }}
          >
            <Ellipsis className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Allow closing when clicking outside
            setDropdownOpen(false);
          }}
        >
          <DropdownMenuItem 
            onSelect={handleMenuItemClick}
          >
            Manage Coffee Chat Requirement
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CoffeeChatOffsetDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        pledge={pledge}
      />
    </>
  );
}
