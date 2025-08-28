import { getServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Link from "next/link";
import { termCodeToWords } from "../course-directory/term-functions";
import { FormatPhoneNumber } from "@/app/components/phone-number/format-phone-number";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await getServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  const email = session.user.email;
  const { data: member, error } = await supabase
    .from("members")
    .select(`*,
      brother_classes (
        *
      )`
    )
    .eq("email_address", email)
    .order("term_code", { ascending: true, referencedTable: "brother_classes" })
    .single();

  if (error && error.code !== "PGRST116") {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>Error loading profile</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem" }}>
      <main className="min-h-screen">
        <Card className="max-w-8xl">
          <CardHeader className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              {/* Profile Picture */}
              {member?.profile_picture_url ? (
                <img 
                  src={member.profile_picture_url} 
                  alt={`${member.name || 'User'}'s profile picture`}
                  className="w-32 h-36 rounded-sm object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-32 h-36 rounded-sm bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                  No Photo
                </div>
              )}
              <div>
                <CardTitle className="text-xl pt-2 pl-2">{member?.name || "Full Name"}</CardTitle>
                <CardDescription className="pl-2">
                  {member?.grade
                    ? member.grade.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
                    : "Grade"
                  }
                </CardDescription>
              </div>
            </div>
            <Link href="/profile/setup">
              <CardAction variant="default" className="bg-black text-white rounded-md px-4 py-2 transition duration-200 ease-in-out hover:bg-gray-700">
                Edit Profile
              </CardAction>
            </Link>
          </CardHeader>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6"> {/* left column */}
              <CardContent>
                <strong>Major</strong>
                <p>
                  {member?.major.length
                    ? member.major.join(", ")
                    : "Major"
                  }
                </p>
              </CardContent>
              <CardContent>
                <strong>Expected Graduation Year</strong>
                <p>{member?.graduation_year || "Graduation Year"}</p>
              </CardContent>
              <CardContent>
                <strong>Email</strong>
                <p>{member?.email_address || "Email"}</p>
              </CardContent>
            </div>
              <div className="space-y-6"> {/* right column */}
              <CardContent>
                <strong>Minor</strong>
                <p>
                  {member?.minor.length
                    ? member.minor.join(", ")
                    : "Minor"
                  }
                </p>
              </CardContent>
              <CardContent>
                <strong>Class</strong>
                <p>{member?.current_class_number || "Class"}</p>
              </CardContent>
              <CardContent>
                <strong>Phone Number</strong>
                <p>{FormatPhoneNumber(member?.phone_number) || "Phone Number"}</p>
              </CardContent>
            </div>
          </div>
          <CardContent>
            <strong>Courses</strong>
            {
              member
                ? <div className="flex flex-col">
                    {(() => {
                      const m = new Map();
                      for (const {term_code: t, class_name: c} of member.brother_classes) {
                        if (!m[t]) {
                          m[t] = [c];
                        } else {
                          m[t].push(c);
                        }
                      }
                      return Object.entries(m).map(([t, c]) => {
                        const class_text = c.map(cc => cc.replace(/([A-Za-z]+)(\d+)/, "$1 $2")).join(", ");
                        return (
                          <div key={t} className="flex flex-row">
                            <div className="italic">{`${termCodeToWords(t)}:`}</div>
                            <div className="flex flex-row ml-1 gap-1">
                              {class_text}
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                : <p>Courses</p>
            }
          </CardContent>
        </Card>
      </main>
    </main>
  );
}
