"use client"

import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { ArrowUpRight } from "lucide-react"
import OverviewBrowser from "../../../../components/event-overview/overview-browser"
import PledgeOverviewBrowser from "../../../../components/event-overview/pledge-overview-browser"
import { Eye } from "lucide-react"
import { capitalizeFirstLetter } from "@/lib/utils"
import PledgeProgressBrowser from "@/app/components/event-overview/tabs/pledge-progress-browser"
import AbsencesBrowser from "@/app/components/event-overview/tabs/absences-browser"
import ExtraTabBrowser from "@/app/components/event-overview/tabs/extra-tab-browser"
import { getBrowserClient } from "@/lib/supbaseClient"

export default function EventsModalClient({ role = "pledge", uniqname, name }) {
  const supabase = getBrowserClient();
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
          <div className="flex flex-row items-center gap-2">
            <span className="bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-200 dark:border-cyan-700 border rounded-md px-2 py-0.5 text-xs items-center">
              <Eye className="inline-block mr-1 mb-0.5 size-3" />
              Viewing
            </span>
            <p className="text-2xl font-bold tracking-tight">{name}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-4 flex-wrap">
            {role === "pledge" ? <PledgeProgressBrowser uniqname={uniqname}/> : null}
            {role === "pledge" ? <ExtraTabBrowser uniqname={uniqname} memberRole={role} /> : null }
            <AbsencesBrowser uniqname={uniqname} memberRole={role} />
          </div>
          {role === "pledge" ? <PledgeOverviewBrowser uniqname={uniqname} /> : null}
          <OverviewBrowser uniqname={uniqname} role={role} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
