"use client";

import Image from "next/image";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function MemberAvatar({ member, className = "" }) {
  const [failed, setFailed] = useState(false);
  const src = member.profile_picture_url;
  const initials = (member.name || member.uniqname)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <Avatar className={className}>
      <AvatarFallback>{initials}</AvatarFallback>
      {src && !failed && (
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 768px) 88px, 105px"
          unoptimized={src.startsWith("/family-tree-preview/images/")}
          className="z-10 object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </Avatar>
  );
}
