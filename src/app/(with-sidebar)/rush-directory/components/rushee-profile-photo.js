"use client";

export default function ProfilePhoto({ rushee }) {
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