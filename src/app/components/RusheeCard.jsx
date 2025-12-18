import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormatPhoneNumber } from "./phone-number/format-phone-number";
import Image from "next/image";

export default function RusheeCard({ rushee }) {
    return (
        
        <Card className="flex flex-row gap-3 p-2.5 items-start shadow-sm rounded-xl border min-h-[175px] max-h-[195px] min-w-[340px] max-w-[340px]">
             { /* Card Setup */  }
            {rushee.profile_picture_url ? (
                <Image
                    src={rushee.profile_picture_url}
                    alt={`${rushee.name}'s profile picture`}
                    width={105}
                    height={151}
                    className="max-w-[105px] min-w-[105px] max-h-[150.75px] min-h-[150.75px] rounded-lg object-cover "
                />
            ) : (
                <div className="min-w-[105px] max-w-[105px] max-h-[150.75px] min-h-[150.75px] bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                    
                </div>
            )}

            { /* Inside Card */  }
            <div className="flex-1 space-y-2 w-full flex flex-col items-start">
                <div className="flex flex-col space-y-1 items-start justify-start w-full">
                    <h2 className="text-base font-semibold">{rushee.name}</h2>
                    <p className="text-xs text-muted-foreground leading-tight">{rushee.email_address}</p>
                </div>

                {/* description badges */}
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
                
                {/* like/dislike/star buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1 height-full justify-start w-full">
                    {rushee.like_count && (
                        <Button className="bg-green-100 text-green-800 text-[9.5px]">
                            {rushee.like_count}
                        </Button>
                    )}
                    {rushee.dislike_count && (
                        <Button className="bg-red-100 text-red-800 text-[9.5px]">
                            {rushee.dislike_count}
                        </Button>
                    )}
                    {rushee.star_count && (
                        <Button className="bg-yellow-100 text-yellow-800 text-[9.5px]">
                            {rushee.star_count}
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}
