"use client"

import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { ArrowUpRight } from "lucide-react"
import OverviewBrowser from "../event-overview/overview-browser"
import PledgeOverviewBrowser from "../event-overview/pledge-overview-browser"

export default function EventsModalClient({ role = "pledge", uniqname, name }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <span className="cursor-pointer inline-flex items-center group">
          {name}
          <ArrowUpRight className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out" size={14} />
        </span>
      </DialogTrigger>
      <DialogContent className="max-w-[min(90vw,80rem)] max-h-[85vh] p-0 flex flex-col">
        <DialogTitle className="sr-only">{name}</DialogTitle>
        <div className="min-h-0 flex-1 overflow-y-auto p-10 flex flex-col gap-8">
          {role === "pledge" ? <PledgeOverviewBrowser uniqname={uniqname} /> : null}
          <OverviewBrowser uniqname={uniqname} role={role} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
