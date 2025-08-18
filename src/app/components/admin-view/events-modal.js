"use client"

import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import OverviewBrowser from "../event-overview/overview-browser"

export default function EventsModalClient({ role = "pledge", uniqname, name }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <p className="hover:decoration-1 cursor-pointer">{name}</p>
      </DialogTrigger>
      <DialogContent className="max-w-[min(90vw,80rem)] max-h-[85vh] p-0">
        <DialogTitle className="sr-only">{name}</DialogTitle>
        <div className="p-10 overflow-auto">
          <OverviewBrowser uniqname={uniqname} role={role} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
