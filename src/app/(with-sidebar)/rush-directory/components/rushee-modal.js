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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RusheeCommentsCard from "./rushee-comments-card";
import RusheeNotesCard from "./rushee-notes-card";
import { ChevronLeft, ChevronRight, Star, ThumbsDown, ThumbsUp, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { updateRusheeLikelihood } from "../_lib/actions";
import { toast } from "sonner";

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
  likelihoods,
  setLikelihoods,
}) {
  const [isPhotoEnlarged, setIsPhotoEnlarged] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const likelihood = likelihoods.get(rushee.id);

  const timerRef = useRef(null);

  const changeLikelihood = (color) => {
    setLikelihoods(prev => {
      const newLikelihoods = new Map(prev);
      newLikelihoods.set(rushee.id, color);
      return newLikelihoods;
    });

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      try {
        await updateRusheeLikelihood(rushee.id, color);
        onUpdate();
      } catch (error) {
        toast.error("Failed to save likelihood");
      }
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCutStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/rushees/cut-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rushee_ids: [rushee.id],
          cut_status: newStatus
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update rushee status');
      }

      toast.success(`Successfully ${newStatus === "cut" ? "cut" : "reactivated"} ${rushee.name}`);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating rushee status:", error);
      toast.error(error.message || "Failed to update rushee status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DialogContent
      className={`h-[98%] sm:h-3/4 grid grid-rows-1 sm:grid-rows-none sm:grid-cols-2 max-h-full w-full sm:w-3/4 [&>button:last-child]:-m-2 overflow-visible border-3
        ${likelihood === "green" ? "border-green-700 hover:border-green-800" : ""}
        ${likelihood === "yellow" ? "border-yellow-700 hover:border-yellow-600" : ""}
        ${likelihood === "red" ? "border-red-700 hover:border-red-800" : ""}
      `}
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
            <div className={`relative group min-w-1/5 ${isPhotoEnlarged ? "w-full" : ""}`}>
              {rushee.profile_picture_url ? (
                <Image
                  src={rushee.profile_picture_url}
                  alt={`${rushee.name}'s profile picture`}
                  fill
                  className={`rounded-lg object-cover
                    ${isPhotoEnlarged
                      ? "h-full w-full"
                      : "h-full min-w-1/5"
                    }`}
                />
              ) : (
                <div className={`${isPhotoEnlarged ? "h-full w-auto" : "h-full min-w-1/5"} bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground`}>
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
              {isPhotoEnlarged && (
                <div className="absolute top-0 left-0 p-2 bg-black/50 backdrop-blur-sm rounded-br-lg">
                  {isAdmin ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className={`cursor-pointer text-white text-2xl w-fit px-1 font-semibold
                            ${likelihood === "green" ? "bg-green-700/80 hover:bg-green-800/80" : ""}
                            ${likelihood === "yellow" ? "bg-yellow-700/80 hover:bg-yellow-800/80" : ""}
                            ${likelihood === "red" ? "bg-red-700/80 hover:bg-red-800/80" : ""}
                            ${!likelihood ? "bg-primary/80 hover:bg-primary/90" : ""}
                          `}
                        >
                          {rushee.name}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-52">
                        <DropdownMenuRadioGroup value={likelihood} onValueChange={changeLikelihood}>
                          <DropdownMenuRadioItem value="green" className="text-green-700">Green</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="yellow" className="text-yellow-700">Yellow</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="red" className="text-red-700">Red</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button
                      className={`cursor-default text-white text-2xl w-fit px-1 font-semibold
                            ${likelihood === "green" ? "bg-green-700/80 hover:bg-green-700/80" : ""}
                            ${likelihood === "yellow" ? "bg-yellow-700/80 hover:bg-yellow-700/80" : ""}
                            ${likelihood === "red" ? "bg-red-700/80 hover:bg-red-700/80" : ""}
                            ${!likelihood ? "bg-primary/80 hover:bg-primary/80" : ""}
                          `}
                    >
                      {rushee.name}
                    </Button>
                  )}
                </div>
              )}
            </div>
            {!isPhotoEnlarged &&
              <>
                <div className="flex flex-col flex-1 text-left text-sm justify-between">
                  <div className="flex flex-row gap-2">
                    {isAdmin ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            className={`cursor-pointer text-primary text-2xl w-fit px-1
                              ${likelihood === "green" ? "bg-green-700 hover:bg-green-800" : ""}
                              ${likelihood === "yellow" ? "bg-yellow-700 hover:bg-yellow-800" : ""}
                              ${likelihood === "red" ? "bg-red-700 hover:bg-red-800" : ""}
                            `}
                          >
                            {rushee.name}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-52">
                          <DropdownMenuRadioGroup value={likelihood} onValueChange={changeLikelihood}>
                            <DropdownMenuRadioItem value="green" className="text-green-700">Green</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="yellow" className="text-yellow-700">Yellow</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="red" className="text-red-700">Red</DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button
                        className={`cursor-default text-primary text-2xl w-fit px-1
                              ${likelihood === "green" ? "bg-green-700 hover:bg-green-700" : ""}
                              ${likelihood === "yellow" ? "bg-yellow-700 hover:bg-yellow-700" : ""}
                              ${likelihood === "red" ? "bg-red-700 hover:bg-red-700" : ""}
                            `}
                      >
                        {rushee.name}
                      </Button>
                    )
                    }
                    <div className="flex ml-auto items-center gap-2">
                      {isAdmin && (
                        <>
                          {rushee.cut_status === 'active' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCutStatusChange('cut')}
                              disabled={isUpdating}
                              className="cursor-pointer bg-red-600 hover:bg-red-600 hover:opacity-80 transition-opacity"
                            >
                              Cut Rushee
                            </Button>
                          )}
                          {rushee.cut_status === 'cut' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleCutStatusChange('active')}
                              disabled={isUpdating}
                              className="bg-green-600 hover:bg-green-600 hover:opacity-80 transition-opacity"
                            >
                              Reactivate Rushee
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
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