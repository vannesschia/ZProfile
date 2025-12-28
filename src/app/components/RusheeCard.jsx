"use client";

import { useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Star, MessageSquareMore, Send, Loader2Icon, NotebookPen } from "lucide-react";
import Image from "next/image";
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
import { Textarea } from "@/components/ui/textarea";
import SendRusheeComment from "../(with-sidebar)/rush-directory/_lib/actions";
import { getAnonymousName } from "../(with-sidebar)/rush-directory/_util/utils";
import 'react-quill-new/dist/quill.snow.css';
import dynamic from "next/dynamic";
import { Separator } from "@/components/ui/separator";

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <p>Loading Editor...</p>
});

export default function RusheeCard({ rushee, uniqname, isAdmin, comments, userReaction, isStarred, onUpdate }) {
  const [currentReaction, setCurrentReaction] = useState(userReaction || 'none');
  const [currentStarred, setCurrentStarred] = useState(isStarred || false);
  const [likeCount, setLikeCount] = useState(rushee.like_count || 0);
  const [dislikeCount, setDislikeCount] = useState(rushee.dislike_count || 0);
  const [starCount, setStarCount] = useState(rushee.star_count || 0);
  const [commentBody, setCommentBody] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [notes, setNotes] = useState("");

  const handleReaction = (reactionType) => {
    const newReaction = currentReaction === reactionType ? 'none' : reactionType;
    setCurrentReaction(newReaction);

    // Update local counts (framework only - no API calls)
    if (newReaction === 'like' && currentReaction !== 'like') {
      setLikeCount(prev => prev + 1);
      if (currentReaction === 'dislike') {
        setDislikeCount(prev => Math.max(0, prev - 1));
      }
    } else if (newReaction === 'dislike' && currentReaction !== 'dislike') {
      setDislikeCount(prev => prev + 1);
      if (currentReaction === 'like') {
        setLikeCount(prev => Math.max(0, prev - 1));
      }
    } else if (newReaction === 'none') {
      if (currentReaction === 'like') {
        setLikeCount(prev => Math.max(0, prev - 1));
      } else if (currentReaction === 'dislike') {
        setDislikeCount(prev => Math.max(0, prev - 1));
      }
    }

    if (onUpdate) onUpdate();
  };

  const handleStar = () => {
    const newStarred = !currentStarred;
    setCurrentStarred(newStarred);

    // Update local count (framework only - no API calls)
    if (newStarred) {
      setStarCount(prev => prev + 1);
    } else {
      setStarCount(prev => Math.max(0, prev - 1));
    }

    if (onUpdate) onUpdate();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="flex flex-col gap-3 p-2.5 items-start shadow-sm rounded-xl border min-w-[340px] max-w-[340px] hover:border-muted-foreground transition-colors duration-300">
          <div className="flex flex-row gap-3 w-full">
            {/* Profile Picture */}
            {rushee.profile_picture_url ? (
              <Image
                src={rushee.profile_picture_url}
                alt={`${rushee.name}'s profile picture`}
                width={105}
                height={151}
                className="max-w-[105px] min-w-[105px] max-h-[150.75px] min-h-[150.75px] rounded-lg object-cover"
              />
            ) : (
              <div className="min-w-[105px] max-w-[105px] max-h-[150.75px] min-h-[150.75px] bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                No Photo
              </div>
            )}

            {/* Card Content */}
            <div className="flex-1 space-y-2 w-full flex flex-col items-start">
              <div className="flex flex-col space-y-1 items-start justify-start w-full">
                <h2 className="text-base font-semibold">{rushee.name}</h2>
                <p className="text-xs text-muted-foreground leading-tight">{rushee.email_address}</p>
              </div>

              {/* Description badges */}
              <div className="flex flex-wrap gap-1.5 pt-1 height-full justify-start w-full">
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

              {/* Interactive reaction buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1 w-full items-center">
                <Button
                  size="sm"
                  variant={currentReaction === 'like' ? 'default' : 'outline'}
                  className={`text-[10px] h-7 px-2 ${currentReaction === 'like'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-green-50 hover:bg-green-100 text-green-800'
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReaction('like');
                  }}
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  {likeCount > 0 && likeCount}
                </Button>
                <Button
                  size="sm"
                  variant={currentReaction === 'dislike' ? 'default' : 'outline'}
                  className={`text-[10px] h-7 px-2 ${currentReaction === 'dislike'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-red-50 hover:bg-red-100 text-red-800'
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReaction('dislike');
                  }}
                >
                  <ThumbsDown className="h-3 w-3 mr-1" />
                  {dislikeCount > 0 && dislikeCount}
                </Button>
                <Button
                  size="sm"
                  variant={currentStarred ? 'default' : 'outline'}
                  className={`text-[10px] h-7 px-2 ${currentStarred
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-800'
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStar();
                  }}
                >
                  <Star className={`h-3 w-3 mr-1 ${currentStarred ? 'fill-current' : ''}`} />
                  {starCount > 0 && starCount}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </DialogTrigger>
      <DialogContent
        className="grid grid-rows-1 sm:grid-rows-none sm:grid-cols-2 max-h-full w-full sm:w-3/4 [&>button:last-child]:-m-2 overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-2">
          <DialogHeader>
            <DialogTitle className="flex flex-row gap-2">
              <ProfilePhoto />
              <div className="flex flex-col text-left text-sm justify-between">
                <div className="text-primary text-2xl">{rushee.name}</div>
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
          <Card className="gap-0 px-0 pt-2 pb-0">
            <CardHeader className="px-3">
              <div className="flex flex-row gap-2 pb-1 text-sm items-center">
                <MessageSquareMore className="w-5 h-5" /> Comments
                <Badge>{comments.length}</Badge>
              </div>
            </CardHeader>
            <Separator className="" />
            <CardContent className="px-0">
              <div className="flex flex-col">
                <div className="flex flex-col-reverse max-h-[200px] sm:max-h-[400px] overflow-y-scroll px-6">
                  {comments.map(comment => {
                    return (
                      <div key={comment.id} className="flex flex-col my-1">
                        <div className="flex flex-row">
                          <strong className="mr-1">{comment.author_name ?? getAnonymousName(comment.anon_handle.slice(8))}</strong>
                          <div className="font-light">
                            {new Date(comment.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </div>
                        </div>
                        <div className="break-words hyphens-auto" lang="en">
                          {comment.body}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="relative">
                  <Textarea
                    disabled={sendingComment}
                    placeholder="Add a comment..."
                    className="pr-12 text-sm border-b-0 border-x-0 rounded-t-none min-h-[40px] w-full resize-none shadow-none"
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                  />
                  <Button
                    disabled={sendingComment || commentBody.length === 0}
                    variant="ghost"
                    className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={async () => {
                      if (!commentBody.trim()) {
                        return;
                      }
                      setSendingComment(true);
                      try {
                        await SendRusheeComment({
                          rushee_id: rushee.id,
                          author_uniqname: uniqname,
                          body: commentBody,
                        });

                        setCommentBody("");
                        onUpdate();
                        setSendingComment(false);
                      } catch (error) {
                        console.error(`Failed to send comment, ${error}`);
                      }
                    }}
                  >
                    {sendingComment
                      ? <Loader2Icon className="animate-spin" />
                      : <Send className="h-5 w-5" />
                    }
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col bg-card shadow-sm rounded-xl text-card-foreground border">
          <Card className="flex flex-row gap-2 shadow-none pt-2 px-3 pb-2 text-sm items-center rounded-b-none border-t-0 border-x-0">
            <NotebookPen className="w-5 h-5" /> Notes
          </Card>
          <ReactQuill
            theme="snow"
            readOnly={!isAdmin}
            modules={{ toolbar: isAdmin }}
            value={notes}
            onChange={setNotes}
            placeholder={isAdmin ? "Add notes..." : "No notes available"}
          />
        </div>
      </DialogContent>
    </Dialog>
  );

  function ProfilePhoto() {
    return (
      rushee.profile_picture_url ? (
        <Image
          src={rushee.profile_picture_url}
          alt={`${rushee.name}'s profile picture`}
          width={105}
          height={151}
          className="max-w-[105px] min-w-[105px] max-h-[150.75px] min-h-[150.75px] rounded-lg object-cover"
        />
      ) : (
        <div className="min-w-[105px] max-w-[105px] max-h-[150.75px] min-h-[150.75px] bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
          No Photo
        </div>
      )
    )
  }
}
