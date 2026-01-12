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
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import RusheeCommentsCard from "./rushee-comments-card";
import RusheeNotesCard from "./rushee-notes-card";
import { ChevronLeft, ChevronRight, Star, ThumbsDown, ThumbsUp, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Image from "next/image";
import { updateRusheeLikelihood } from "../_lib/actions";

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
  const [isPhotoEnlarged, setIsPhotoEnlarged] = useState(false);
  const [likelihood, setLikelihood] = useState(rushee.likelihood);

  useEffect(() => {
    if (likelihood === rushee.likelihood) return;

    const debounce = setTimeout(() => {
      updateRusheeLikelihood(rushee.id, likelihood);
    }, 300);

    return () => clearTimeout(debounce);
  }, [likelihood]);

  const changeLikelihood = (color) => setLikelihood(color);

  return (
    <DialogContent
      className="h-[98%] sm:h-3/4 grid grid-rows-1 sm:grid-rows-none sm:grid-cols-2 max-h-full w-full sm:w-3/4 [&>button:last-child]:-m-2 overflow-visible"
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
      <div className="flex flex-col overflow-hidden">
        <DialogHeader className={`${isPhotoEnlarged ? "h-full" : "h-1/4 pb-0 sm:pb-2"}`}>
          <DialogTitle className="flex flex-row gap-2 h-full">
            <div className={`relative group min-w-[105px] ${isPhotoEnlarged ? "w-full" : ""}`}>
              {rushee.profile_picture_url ? (
                <Image
                  src={rushee.profile_picture_url}
                  alt={`${rushee.name}'s profile picture`}
                  fill
                  className={`rounded-lg object-cover
                    ${isPhotoEnlarged
                      ? "h-full w-full"
                      : "h-full min-w-[105px]"
                    }`}
                />
              ) : (
                <div className={`${isPhotoEnlarged ? "h-full w-auto" : "h-full min-w-[105px]"} bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground`}>
                  No Photo
                </div>
              )}
              <Button
                variant="ghost"
                className="hidden group-hover:hidden sm:group-hover:block cursor-pointer absolute !p-1 h-6 w-6 top-0 right-0"
                onClick={() => setIsPhotoEnlarged(prev => !prev)}
              >
                {isPhotoEnlarged
                  ? <ZoomOut />
                  : <ZoomIn />
                }
              </Button>
            </div>
            {!isPhotoEnlarged &&
              <>
                <div className="flex flex-col text-left text-sm justify-between">
                  <ContextMenu>
                    <ContextMenuTrigger
                      className={`text-2xl w-fit px-1
                        ${likelihood === "green" ? "bg-green-700" : ""}
                        ${likelihood === "yellow" ? "bg-yellow-700" : ""}
                        ${likelihood === "red" ? "bg-red-700" : ""}
                      `}
                    >
                      {rushee.name}
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-52">
                      <ContextMenuRadioGroup value={likelihood} onValueChange={changeLikelihood}>
                        <ContextMenuRadioItem value="green" className="text-green-700">Green</ContextMenuRadioItem>
                        <ContextMenuRadioItem value="yellow" className="text-yellow-700">Yellow</ContextMenuRadioItem>
                        <ContextMenuRadioItem value="red" className="text-red-700">Red</ContextMenuRadioItem>
                      </ContextMenuRadioGroup>
                    </ContextMenuContent>
                  </ContextMenu>
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
              </>
            }
          </DialogTitle>
          <div className="grid sm:hidden grid-cols-3 gap-2 pb-2">
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
        {!isPhotoEnlarged &&
          <div className="h-3/4">
            <RusheeCommentsCard
              rushee={rushee}
              uniqname={uniqname}
              isAdmin={isAdmin}
              comments={comments}
              onUpdate={onUpdate}
            />
          </div>
        }
      </div>
      <RusheeNotesCard
        key={rushee.id}
        rushee={rushee}
        isAdmin={isAdmin}
        notes={notes}
        onUpdate={onUpdate}
      />
    </DialogContent>
  )
}