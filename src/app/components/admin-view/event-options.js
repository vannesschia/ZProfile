"use client"

import { useRouter } from "next/navigation"
import { useState, startTransition } from "react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Ellipsis } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { getBrowserClient } from "@/lib/supbaseClient"

async function deleteEvent(eventId) {
  const supabase = await getBrowserClient()
  const { error } = await supabase.from("events").delete().eq("id", eventId)
  if (error) throw error
}

export default function EventOptions({ eventId, eventName }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pending, setPending] = useState(false)

  const onDelete = async () => {
    try {
      setPending(true)
      await deleteEvent(eventId)
      // close the dialog FIRST so no overlay/focus trap lingers
      setDialogOpen(false)
      toast.success("Event deleted")

      // Do ONE of these:
      startTransition(() => {
        router.replace("/admin/dashboard?tab=events") // navigate
        // or: router.refresh() if staying on same route
      })
    } catch (e) {
      toast.error("Failed to delete event")
      console.error(e)
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
            <Ellipsis className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="left">
          <DropdownMenuItem onSelect={() => router.push(`/admin/events/edit/${eventId}`)}>
            Edit Event
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            // IMPORTANT: prevent the menu's default select (which would close after bubbling)
            onSelect={(e) => {
              e.preventDefault()
              setMenuOpen(false)    // make sure the menu is closed
              setDialogOpen(true)   // then open the dialog
            }}
          >
            Delete Event
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[470px]">
          <DialogHeader>
            <DialogTitle>Delete “{eventName}”?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The event and related attendance data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={pending}>Go Back</Button>
            <Button variant="destructive" onClick={onDelete} disabled={pending}>
              {pending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
