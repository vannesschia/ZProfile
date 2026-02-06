"use client";

import { useState, useEffect } from "react";
import { deleteRusheeComment, sendRusheeComment } from "../_lib/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Ellipsis, Eye, EyeOff, Loader2Icon, MessageSquareMore, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getAnonymousName } from "../_util/utils";

export default function RusheeCommentsCard({
  rushee,
  uniqname,
  isAdmin,
  anonymousMode = false,
  comments,
  onUpdate,
}) {
  const [clientComments, setClientComments] = useState(comments);
  const [commentBody, setCommentBody] = useState("");
  const [deletedCommentsVisible, setDeletedCommentsVisible] = useState(false);

  useEffect(() => {
    setClientComments(comments);
  }, [comments]);

  const notDeletedComments = clientComments.filter(c => c.deleted_at === null);

  return (
    <Card className="h-full flex flex-col gap-0 px-0 pt-2 pb-0">
      <CardHeader className="px-3">
        <div className="flex flex-row gap-2 pb-1 text-sm items-center">
          <MessageSquareMore className="w-5 h-5" /> Comments
          <Badge>
            {isAdmin
              ? deletedCommentsVisible
                ? clientComments.length
                : notDeletedComments.length
              : clientComments.length
            }
          </Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              {isAdmin &&
                <Button
                  variant="ghost"
                  className="ml-auto h-6 w-12"
                  onClick={() => {
                    setDeletedCommentsVisible(prev => !prev);
                  }}
                >
                  <div className="flex flex-row gap-1 items-center">
                    {deletedCommentsVisible
                      ? <Eye />
                      : <EyeOff />
                    }
                    {clientComments.filter(c => c.deleted_at !== null).length}
                  </div>
                </Button>
              }
            </TooltipTrigger>
            <TooltipContent>
              <p>{`${deletedCommentsVisible ? "Hide" : "Show"} deleted comments`}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="px-0 flex flex-col flex-1 min-h-0" onWheel={(e) => e.stopPropagation()}>
        <div className="flex flex-col h-full">
          <div className="flex flex-col-reverse flex-1 overflow-y-scroll px-6">
            {clientComments.map(comment => {
              if (isAdmin && comment.deleted_at !== null && !deletedCommentsVisible) {
                return;
              }
              const isDeleted = comment.deleted_at !== null;
              const isOptimizedComment = typeof comment.id === "string";
              return (
                <div key={comment.id} className="flex flex-col my-1">
                  <div className="flex flex-row">
                    <strong className="mr-1">
                      {comment.isMine
                        ? "You"
                        : isAdmin && anonymousMode
                          ? getAnonymousName(comment.author_uniqname ?? comment.id?.toString() ?? "")
                          : isAdmin
                            ? comment.author_name
                            : getAnonymousName(comment.anon_handle?.slice(8) ?? "")
                      }
                    </strong>
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
                    {((isAdmin && !isDeleted) || (!isAdmin && comment.isMine)) &&
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            disabled={isOptimizedComment}
                            variant="ghost"
                            className="ml-auto w-6 h-6"
                          >
                            {isOptimizedComment
                              ? <Loader2Icon className="animate-spin" />
                              : <Ellipsis />
                            }
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="left">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={async () => {
                              const originalComments = [...clientComments];
                              setClientComments(prev => prev.filter(c => c.id !== comment.id));
                              try {
                                await deleteRusheeComment(comment.id);
                                onUpdate();
                              } catch (error) {
                                toast.error("Failed to delete comment.");
                                console.error("Failed to delete comment:", error);
                                setClientComments(originalComments);
                              }
                            }}
                          >
                            Delete Comment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    }
                  </div>
                  <div
                    lang="en"
                    className={cn(
                      "break-words hyphens-auto",
                      isOptimizedComment ? "text-muted-foreground" : "",
                      isDeleted && deletedCommentsVisible ? "text-red-500" : "")}
                  >
                    {comment.body}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="relative">
            <Textarea
              placeholder="Add a comment..."
              className="pr-12 text-sm border-b-0 border-x-0 rounded-t-none min-h-[40px] w-full resize-none shadow-none"
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
            />
            <Button
              disabled={commentBody.length === 0}
              variant="ghost"
              className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={async () => {
                if (!commentBody.trim()) {
                  return;
                }

                const originalCommentBody = commentBody;
                const tempId = `${Date.now()}`;

                const postAnonymous = isAdmin && anonymousMode;
                setClientComments(prev => [
                  {
                    id: tempId,
                    rushee_id: rushee.id,
                    body: commentBody,
                    created_at: new Date().toISOString(),
                    deleted_at: null,
                    isMine: true,
                    is_anonymous: postAnonymous,
                  }, ...prev]);
                setCommentBody("");
                try {
                  await sendRusheeComment({
                    rushee_id: rushee.id,
                    author_uniqname: uniqname,
                    body: commentBody,
                    is_anonymous: postAnonymous,
                  });
                  onUpdate();
                } catch (error) {
                  toast.error("Failed to send comment.");
                  console.error(`Failed to send comment, ${error}`);
                  setClientComments(prev => prev.filter(c => c.id !== tempId));
                  setCommentBody(originalCommentBody);
                }
              }}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}