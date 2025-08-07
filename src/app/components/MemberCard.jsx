import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function MemberCard({ member }) {
    return (
        <Card className="flex flex-col gap-4 p-4 items-center shadow-sm rounded-xl border max-w-[260px]">
            {member.profile_picture_url ? (
                <img 
                    src={member.profile_picture_url} 
                    alt={`${member.name}'s profile picture`}
                    className="w-[130px] h-[145px] rounded-lg object-cover border border-gray-200"
                />
            ) : (
                <div className="w-[130px] h-[145px] bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                    ...
                </div>
            )}

            <div className="flex-1 space-y-2 w-full flex flex-col items-center">
                {/* Name + Contact stacked vertically (centered) */}
                <div className="flex flex-col flex-1 space-y-1 items-center justify-center">
                    <h2 className="text-lg font-semibold">{member.name}</h2>
                    <p className="text-sm text-muted-foreground leading-tight">{member.email_address}</p>
                    <p className="text-sm text-muted-foreground leading-tight">{member.phone_number}</p>
                </div>

                {/* description badges */}
                <div className="flex flex-wrap gap-2 pt-2 justify-center">
                    {member.major?.map((m, i) => (
                        <Badge key={`major-${i}`} className="bg-blue-100 text-blue-900">
                            {m.trim()}
                        </Badge>
                    ))}
                    {member.minor?.map((m, i) => (
                        <Badge key={`minor-${i}`} className="bg-purple-100 text-purple-900">
                            {m.trim()}
                        </Badge>
                    ))}
                    {member.grade && (
                        <Badge className="bg-green-100 text-green-800">
                            {member.grade}
                        </Badge>
                    )}
                    {member.graduation_year && (
                        <Badge className="bg-red-100 text-red-800">
                            {member.graduation_year}
                        </Badge>
                    )}
                </div>
            </div>
        </Card>
    );
}
