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
import { ThumbsUp, ThumbsDown, Star } from "lucide-react";
import Image from "next/image";

export default function RusheeCard({ rushee, userReaction, isStarred, onUpdate, openModal }) {
  const [currentReaction, setCurrentReaction] = useState(userReaction || 'none');
  const [currentStarred, setCurrentStarred] = useState(isStarred || false);
  const [likeCount, setLikeCount] = useState(rushee.like_count || 0);
  const [dislikeCount, setDislikeCount] = useState(rushee.dislike_count || 0);
  const [starCount, setStarCount] = useState(rushee.star_count || 0);

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
    <Card
      className="flex flex-col gap-3 p-2.5 items-start shadow-sm rounded-xl border min-w-[340px] max-w-[340px] hover:border-muted-foreground transition-colors duration-300"
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
  );
}
