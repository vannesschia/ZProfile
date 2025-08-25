"use client"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AttendanceQuickView({ eventId, children }) {

  return (
    <>
      <HoverCard className="w-full">
        <HoverCardTrigger asChild>
          <span>{children}</span>
        </HoverCardTrigger>
        <HoverCardContent>
          <p>{children}</p>
        </HoverCardContent>
      </HoverCard>
    </>
  )
}