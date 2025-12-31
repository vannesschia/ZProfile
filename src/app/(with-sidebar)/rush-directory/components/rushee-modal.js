"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProfilePhoto from "./rushee-profile-photo";
import RusheeCommentsCard from "./rushee-comments-card";
import RusheeNotesCard from "./rushee-notes-card";
import { ChevronLeft, ChevronRight, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RusheeModal({
  rushee,
  uniqname,
  isAdmin,
  comments,
  notes,
  likeCount,
  dislikeCount,
  starCount,
  onUpdate,
  prevRushee,
  nextRushee,
}) {
  return (
    <DialogContent
      className="grid grid-rows-1 sm:grid-rows-none sm:grid-cols-2 max-h-full w-full sm:w-3/4 [&>button:last-child]:-m-2 overflow-visible"
      onOpenAutoFocus={(e) => e.preventDefault()}
      onEscapeKeyDown={(e) => { // to prevent bug with dropdownmenu
        if (document.querySelectorAll('[role="menu"], [data-radix-menu-content]').length > 0) {
          e.preventDefault();
        }
      }}
    >
      <Button
        variant="outline"
        className="hidden sm:flex items-center rounded-full w-12 h-12 absolute top-1/2 -left-16 -translate-y-1/2"
        onClick={() => prevRushee()}
      >
        <ChevronLeft />
      </Button>
      <Button
        variant="outline"
        className="hidden sm:flex items-center rounded-full w-12 h-12 absolute top-1/2 -right-16 -translate-y-1/2"
        onClick={() => nextRushee()}
      >
        <ChevronRight />
      </Button>
      <div className="flex flex-col gap-2">
        <DialogHeader>
          <DialogTitle className="flex flex-row gap-2">
            <ProfilePhoto rushee={rushee} />
            <div className="flex flex-col text-left text-sm justify-between">
              <div className="text-2xl">{rushee.name}</div>
              <div className="text-muted-foreground">{rushee.email_address}</div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {rushee.major?.map((m, i) => (
                  <Badge key={`major-${i}`} className="bg-blue-100 text-blue-900 text-[9.5px]">
                    {m.trim()}
                  </Badge>
                ))}
                {rushee.minor?.map((m, i) => (
                  <Badge key={`minor-${i}`} className="bg-purple-100 text-purple-900 text-[9.5px]">
                    {m.trim()}
                  </Badge>
                ))}
                {rushee.grade && (
                  <Badge className="bg-green-100 text-green-800 text-[9.5px]">
                    {rushee?.grade
                      ? rushee.grade.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
                      : ""
                    }
                  </Badge>
                )}
                {rushee.graduation_year && (
                  <Badge className="bg-red-100 text-red-800 text-[9.5px]">
                    {rushee.graduation_year}
                  </Badge>
                )}
              </div>
            </div>
            <div className="hidden sm:grid ml-auto min-w-16 grid-cols-2 gap-y-2 h-fit">
              <div className="justify-center items-center text-sm flex flex-row text-green-800">
                <ThumbsUp className="mr-1" />
              </div>
              <div className="justify-center items-center text-sm flex flex-row text-green-800">
                {likeCount}
              </div>
              <div className="justify-center items-center text-sm flex flex-row text-red-800">
                <ThumbsDown className="mr-1" />
              </div>
              <div className="justify-center items-center text-sm flex flex-row text-red-800">
                {dislikeCount}
              </div>
              <div className="justify-center items-center text-sm flex flex-row text-yellow-800">
                <Star className="mr-1" />
              </div>
              <div className="justify-center items-center text-sm flex flex-row text-yellow-800">
                {starCount}
              </div>
            </div>
          </DialogTitle>
          <div className="grid sm:hidden grid-cols-3 gap-2">
            <div className="justify-center items-center text-sm flex flex-row text-green-800">
              <ThumbsUp className="mr-1" />{likeCount}
            </div>
            <div className="justify-center items-center text-sm flex flex-row text-red-800">
              <ThumbsDown className="mr-1" />{dislikeCount}
            </div>
            <div className="justify-center items-center text-sm flex flex-row text-yellow-800">
              <Star className="mr-1" />{starCount}
            </div>
          </div>
        </DialogHeader>
        <RusheeCommentsCard
          rushee={rushee}
          uniqname={uniqname}
          isAdmin={isAdmin}
          comments={comments}
          onUpdate={onUpdate}
        />
      </div>
      <RusheeNotesCard
        rushee={rushee}
        isAdmin={isAdmin}
        notes={notes}
      />
    </DialogContent>
  )
}