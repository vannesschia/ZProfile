"use client";

import { useState, useRef } from "react";
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
import { ThumbsUp, ThumbsDown, Star } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function RusheeCard({ rushee, userReaction, isStarred, onUpdate, openModal, userStarCount, safeUserStars}) {
  const [currentReaction, setCurrentReaction] = useState(userReaction || 'none');
  const [currentStarred, setCurrentStarred] = useState(isStarred || false);
  const [likeCount, setLikeCount] = useState(rushee.like_count || 0);
  const [dislikeCount, setDislikeCount] = useState(rushee.dislike_count || 0);
  const [starCount, setStarCount] = useState(rushee.star_count || 0);
  const [loading, setLoading] = useState(false);
  
  // Debounce and coalesce rapid clicks (last intent wins)
  const debounceTimer = useRef(null);
  const pendingRequest = useRef(null);
  const optimisticState = useRef({ reaction: currentReaction, likeCount, dislikeCount });

  const handleReaction = (reactionType) => {
    // Disable button immediately
    setLoading(true);
    
    // Clear any pending debounce
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Cancel any pending request (last intent wins)
    if (pendingRequest.current) {
      // Note: We can't actually cancel fetch, but we'll ignore stale responses
      pendingRequest.current = null;
    }

    // Calculate new reaction
    const newReaction = currentReaction === reactionType ? 'none' : reactionType;
    
    // Optimistic UI update
    const oldReaction = optimisticState.current.reaction;
    let newLikeCount = optimisticState.current.likeCount;
    let newDislikeCount = optimisticState.current.dislikeCount;

    // Update optimistic counts
    if (oldReaction === 'like') {
      newLikeCount = Math.max(0, newLikeCount - 1);
    } else if (oldReaction === 'dislike') {
      newDislikeCount = Math.max(0, newDislikeCount - 1);
    }

    if (newReaction === 'like') {
      newLikeCount = newLikeCount + 1;
    } else if (newReaction === 'dislike') {
      newDislikeCount = newDislikeCount + 1;
    }

    // Apply optimistic update immediately
    setCurrentReaction(newReaction);
    setLikeCount(newLikeCount);
    setDislikeCount(newDislikeCount);
    optimisticState.current = { reaction: newReaction, likeCount: newLikeCount, dislikeCount: newDislikeCount };

    // Debounce the API call (300ms - coalesces rapid clicks)
    debounceTimer.current = setTimeout(async () => {
      const requestId = Date.now();
      pendingRequest.current = requestId;

      try {
        const response = await fetch('/api/rushees/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rushee_id: rushee.id,
            reaction_type: newReaction
          })
        });

        const data = await response.json();

        // Ignore stale responses (if a newer request was made)
        if (pendingRequest.current !== requestId) {
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update reaction');
        }

        // Update with server response (reconcile optimistic update)
        setCurrentReaction(data.reaction_type);
        setLikeCount(data.like_count);
        setDislikeCount(data.dislike_count);
        optimisticState.current = { 
          reaction: data.reaction_type, 
          likeCount: data.like_count, 
          dislikeCount: data.dislike_count 
        };
        
        if (onUpdate) onUpdate();
      } catch (error) {
        // Revert optimistic update on error
        setCurrentReaction(optimisticState.current.reaction);
        setLikeCount(optimisticState.current.likeCount);
        setDislikeCount(optimisticState.current.dislikeCount);
        
        console.error("Error updating reaction:", error);
        toast.error(error.message || "Failed to update reaction");
      } finally {
        if (pendingRequest.current === requestId) {
          pendingRequest.current = null;
        }
        setLoading(false);
      }
    }, 300);
  };

  const handleStar = () => {
    if (userStarCount === 3 && !currentStarred) return;
    
    const newStarred = !currentStarred;

    // Disable button immediately
    setLoading(true);
    
    // Clear any pending debounce
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Cancel any pending request (last intent wins)
    if (pendingRequest.current) {
      // Note: We can't actually cancel fetch, but we'll ignore stale responses
      pendingRequest.current = null;
    }

    // Apply optimistic update immediately
    setCurrentStarred(newStarred);

    // Update local count (framework only - no API calls)
    if (newStarred) {
      setStarCount(prev => prev + 1);
    } else {
      setStarCount(prev => Math.max(0, prev - 1));
    }

    // Debounce the API call (300ms - coalesces rapid clicks)
    debounceTimer.current = setTimeout(async () => {
      const requestId = Date.now();
      pendingRequest.current = requestId;

      try {
        const response = await fetch('/api/rushees/stars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rushee_id: rushee.id,
            starred: newStarred
          })
        });

        const data = await response.json();

        // Ignore stale responses (if a newer request was made)
        if (pendingRequest.current !== requestId) {
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update reaction');
        }

        // Update with server response (reconcile optimistic update)
        setCurrentStarred(data.starred);
        setStarCount(data.star_count === null ? starCount : data.star_count);
        
        if (onUpdate) onUpdate();
      } catch (error) {
        // Revert optimistic update on error
        setCurrentStarred(currentStarred);
        setStarCount(rushee.starCount);

        console.error("Error updating star:", error);
        toast.error(error.message || "Failed to update star");
      } finally {
        if (pendingRequest.current === requestId) {
          pendingRequest.current = null;
        }
        setLoading(false);
      }
    }, 300);

    

    if (onUpdate) onUpdate();
  };
  const isCut = rushee.cut_status === 'cut';
  return (
      
     <Card
      className={`flex flex-col gap-3 p-2.5 items-start shadow-sm rounded-xl border min-w-[340px] max-w-[340px] hover:border-muted-foreground transition-colors duration-300 ${
        isCut ? 'opacity-40 grayscale' : ''
      }`}
      onClick={openModal}
    >
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
          <div className="flex flex-wrap gap-1.5 pt-1 w-full h-full items-end">
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            >
              <Star className={`h-3 w-3 mr-1 ${currentStarred ? 'fill-current' : ''}`} />
              {starCount > 0 && starCount}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
