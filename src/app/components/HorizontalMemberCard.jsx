import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormatPhoneNumber } from "./phone-number/format-phone-number";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function HorizontalMemberCard({
    member,
    showClass = false,
    showImageFallback = false,
    className,
}) {
    const [imageFailed, setImageFailed] = useState(false);
    const imageUrl = member.profile_picture_url;
    const initials = (member.name || member.uniqname || "?")
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    return (
        <Card className={cn(
            "flex min-h-[175px] max-h-[195px] min-w-[340px] max-w-[340px] flex-row items-start gap-3 rounded-xl border p-2.5 shadow-sm",
            className,
        )}>
            {imageUrl && !(showImageFallback && imageFailed) ? (
                <Image
                    src={imageUrl}
                    alt={`${member.name}'s profile picture`}
                    width={105}
                    height={151}
                    unoptimized={imageUrl.startsWith("/family-tree-preview/images/")}
                    onError={showImageFallback ? () => setImageFailed(true) : undefined}
                    className="max-w-[105px] min-w-[105px] max-h-[150.75px] min-h-[150.75px] rounded-lg object-cover "
                />
            ) : (
                <div className="min-w-[105px] max-w-[105px] max-h-[150.75px] min-h-[150.75px] bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                    {showImageFallback ? initials : null}
                </div>
            )}

            <div className="flex-1 space-y-2 w-full flex flex-col items-start">
                <div className="flex flex-col space-y-1 items-start justify-start w-full">
                    <h2 className="text-base font-semibold">{member.name}</h2>
                    <p className="text-xs text-muted-foreground leading-tight">{member.email_address}</p>
                    {member.phone_number && <p className="text-xs text-muted-foreground leading-tight">{FormatPhoneNumber(member.phone_number)}</p>}
                </div>

                {/* description badges */}
                <div className="flex flex-wrap gap-1.5 pt-1 height-full justify-start w-full">
                    {showClass && member.current_class_number && (
                        <Badge className="bg-secondary text-secondary-foreground text-[9.5px]">
                            {member.current_class_number}
                        </Badge>
                    )}
                    {member.major?.map((m, i) => (
                        <Badge key={`major-${i}`} className="bg-blue-100 text-blue-900 text-[9.5px]">
                            {m.trim()}
                        </Badge>
                    ))}
                    {member.minor?.map((m, i) => (
                        <Badge key={`minor-${i}`} className="bg-purple-100 text-purple-900 text-[9.5px]">
                            {m.trim()}
                        </Badge>
                    ))}
                    {member.grade && (
                        <Badge className="bg-green-100 text-green-800 text-[9.5px]">
                            {member?.grade
                                ? member.grade.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
                                : ""
                            }
                        </Badge>
                    )}
                    {member.graduation_year && (
                        <Badge className="bg-red-100 text-red-800 text-[9.5px]">
                            {member.graduation_year}
                        </Badge>
                    )}
                </div>
            </div>
        </Card>
    );
}
