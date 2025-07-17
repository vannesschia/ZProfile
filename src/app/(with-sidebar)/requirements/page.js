import { getServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export default async function MembersPage() {
    const supabase = await getServerClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) redirect("/");

    return (
        <main className="min-h-screen px-6 py-4">
            <Card className="w-full max-w-6xl mx-auto mb-8">
                <CardHeader>
                    <CardTitle className="text-xl">Pledge Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Accordion type="multiple" className="w-full space-y-2">
                            <AccordionItem value="contacts">
                                <AccordionTrigger className="font-bold">Contacts and Links</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Nicky Nguyen: (224) 661-1514</li>
                                        <li>Abby Moomaw: (919) 308-6644</li>
                                        {/* <li>
                                            <a href="https://docs.google.com/spreadsheets/d/1P_ZEDAmqf3oiJ2MvULH-J0jSNSv5z4Esqe895PSZjOk/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Pledge Attendance Tracker</a>
                                        </li>
                                        <li>Coffee Chat Tracker</li>
                                        <li>Brother Contact Info</li> */}
                                        <li>Random Pairings</li>
                                        <li>Cleanup Tracker</li>
                                        <li>PhotoCircle</li>
                                        <li>
                                            <a href="https://calendar.google.com/calendar/embed?src=c_c813756b791ff495bc94dc7041d7e02a10136be55730bd669288ee8717a1bfd4%40group.calendar.google.com&ctz=America%2FNew_York" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Calendar</a>
                                        </li>
                                        <li>Zeta Class Group Chat</li>
                                        {/* <li>Coffee Chat Google Form</li> */}
                                        <li>Knowledgebase</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="events">
                                <AccordionTrigger className="font-bold">Pledge Events</AccordionTrigger>
                                <AccordionContent>
                                    <p>Weekly (~2 hrs), 1 excused absence allowed</p>
                                    <p>Unexcused/more absences → ____ coffee chats</p>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="chapters">
                                <AccordionTrigger className="font-bold">Chapter Meetings</AccordionTrigger>
                                <AccordionContent>
                                    <p>Monthly (~2 hrs)</p>
                                    <ul className="list-disc pl-5">
                                        <li>1 excused absence</li>
                                        <li>Unexcused = 5 committee points</li>
                                        <li>More than 1 excused = 3 points each</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="committee">
                                <AccordionTrigger className="font-bold">Committee Points</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc pl-5">
                                        <li>6 total before initiation</li>
                                        <li>Only from Tech, Prof Dev, Marketing, Social, Fundraising</li>
                                        <li>Chapters/Parties don’t count</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        <Accordion type="multiple" className="w-full space-y-2">
                            <AccordionItem value="coffee">
                                <AccordionTrigger className="font-bold">Coffee Chats</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc pl-5">
                                        <li>20 total — 5 random, 15 chosen</li>
                                        <li>30+ min w/ bros you don’t know</li>
                                        <li>Selfie + Google Form required</li>
                                        <li>Late start = extra required chats</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="study">
                                <AccordionTrigger className="font-bold">Study Tables</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc pl-5">
                                        <li>Attend 1/week (Mon & Wed 6–10PM)</li>
                                        <li>1 miss allowed → no penalty</li>
                                        <li>More than 1 = ____ committee points</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="cleanup">
                                <AccordionTrigger className="font-bold">Post-Party Cleanup</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc pl-5">
                                        <li>Must clean after 1 party</li>
                                        <li>Random assignment if not enough</li>
                                        <li>Supplies provided</li>
                                        <li>Track in cleanup tracker</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="milestones">
                                <AccordionTrigger className="font-bold">Milestones</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc pl-5">
                                        <li><strong>Milestone 1:</strong> 7 chats, 2 points</li>
                                        <li><strong>Milestone 2:</strong> 14 chats, 4 points</li>
                                        <li><strong>Milestone 3:</strong> 20 chats, 6 points</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </CardContent>
            </Card>

            <Card className="w-full max-w-6xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-xl">Brother Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Accordion type="multiple" className="w-full space-y-2">
                            <AccordionItem value="contacts">
                                <AccordionTrigger className="font-bold">Contacts and Links</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Nicky Nguyen: (224) 661-1514</li>
                                        <li>Abby Moomaw: (919) 308-6644</li>
                                        {/* <li>
                                            <a href="https://docs.google.com/spreadsheets/d/1P_ZEDAmqf3oiJ2MvULH-J0jSNSv5z4Esqe895PSZjOk/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Pledge Attendance Tracker</a>
                                        </li>
                                        <li>Coffee Chat Tracker</li>
                                        <li>Brother Contact Info</li> */}
                                        <li>Random Pairings</li>
                                        <li>PhotoCircle</li>
                                        <li>
                                            <a href="https://calendar.google.com/calendar/embed?src=c_c813756b791ff495bc94dc7041d7e02a10136be55730bd669288ee8717a1bfd4%40group.calendar.google.com&ctz=America%2FNew_York" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Calendar</a>
                                        </li>
                                        {/* <li>Coffee Chat Google Form</li> */}
                                        <li>Knowledgebase</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="chapters">
                                <AccordionTrigger className="font-bold">Chapter Meetings</AccordionTrigger>
                                <AccordionContent>
                                    <p>Monthly (~2 hrs)</p>
                                    <ul className="list-disc pl-5">
                                        <li>1 excused absence</li>
                                        <li>Unexcused = 5 attendance points</li>
                                        <li>More than 1 excused = 3 points each</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        <Accordion type="multiple" className="w-full space-y-2">
                            <AccordionItem value="committee">
                                <AccordionTrigger className="font-bold">Attendance Points</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc pl-5">
                                        <li>5 required by the end of the semester</li>
                                        <li>Chapters, rush events, and pledge events all count</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="coffee">
                                <AccordionTrigger className="font-bold">Coffee Chats</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc pl-5">
                                        <li>2 randomly assigned (do not ghost the pledges)</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </CardContent>

            </Card>
        </main>
    );
}
