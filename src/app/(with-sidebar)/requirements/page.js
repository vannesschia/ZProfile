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
                        {/* Column A */}
                        <Accordion type="multiple" className="w-full space-y-2">
                            {/* Contacts & Links */}
                            <AccordionItem value="contacts">
                                <AccordionTrigger className="font-bold">Contacts and Links</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Nicky Nguyen: (224) 661-1514</li>
                                        <li>Abby Moomaw: (919) 308-6644</li>
                                        <li><u><strong><a href="https://docs.google.com/spreadsheets/d/1P_ZEDAmqf3oiJ2MvULH-J0jSNSv5z4Esqe895PSZjOk/edit?usp=sharing">Pledge Informational Sheets (Brother Contact, Coffee Chat Pairings, Cleanup Tracker)</a></strong></u></li>
                                        <li><u><strong><a href="https://join.photocircleapp.com/S0C7Z2ZBXA">PhotoCircle</a></strong></u></li>
                                        <li><u><strong><a href="https://calendar.google.com/calendar/embed?src=c_c813756b791ff495bc94dc7041d7e02a10136be55730bd669288ee8717a1bfd4%40group.calendar.google.com&ctz=America%2FNew_York">Google Calendar</a></strong></u></li>
                                        <li><u><strong><a href="./coffee-chat">Coffee Chat Form</a></strong></u></li>
                                        <li><u><strong><a href="https://drive.google.com/drive/folders/1_GnALj-7Gq_OYPatLA93B8vngQq5-v-8">Knowledgebase</a></strong></u></li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Pledge Events */}
                            <AccordionItem value="events">
                                <AccordionTrigger className="font-bold">Pledge Events</AccordionTrigger>
                                <AccordionContent className="space-y-2">
                                    <p>Weekly pledge events (~2 hours)</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>1 excused absence (notify Nicky or Abby ahead of time)</li>
                                        <li>
                                            Unexcused absences or &gt;1 excused absence must be made up with
                                            <span className="font-medium"> either 2 coffee chats or committee points</span>.
                                        </li>
                                        <li className="mt-1">Examples (any combo totaling 2 “points”):</li>
                                        <ul className="list-disc pl-8">
                                            <li>2 coffee chats</li>
                                            <li>2 committee events</li>
                                            <li>1 coffee chats + 1 committee event</li>
                                        </ul>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Chapters */}
                            <AccordionItem value="chapters">
                                <AccordionTrigger className="font-bold">Chapter Meetings</AccordionTrigger>
                                <AccordionContent className="space-y-2">
                                    <p>Monthly chapter meetings (~1 hour)</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>One free excused absence (notify Nicky or Abby ahead of time)</li>
                                        <li>Unexcused absence → 3 committee points</li>
                                        <li>More than one excused absence → 2 committee points (each)</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Committee Points */}
                            <AccordionItem value="committee">
                                <AccordionTrigger className="font-bold">Committee Points</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>6 committee points required before initiation</li>
                                        <li>
                                            Points must come from these committees (RAM excluded):
                                            <div className="ml-4 mt-1">
                                                Tech &amp; Projects, Professional Development, Marketing, Social, Fundraising
                                            </div>
                                        </li>
                                        <li>
                                            <span className="font-medium">Do not count</span>: parties, chapters, bid night, initiation night, pledge events
                                        </li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        {/* Column B */}
                        <Accordion type="multiple" className="w-full space-y-2">
                            {/* Coffee Chats */}
                            <AccordionItem value="coffee">
                                <AccordionTrigger className="font-bold">Coffee Chats</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>20 total before initiation</li>
                                        <li>5 randomly assigned, 15 of pledge’s choosing</li>
                                        <li>Each chat: 30+ minutes with a brother you don’t already know well</li>
                                        <li>Submit Google Form + selfie for it to count</li>
                                        <li className="italic">
                                            Tip: You can be assigned extra chats as penalties — start early!
                                        </li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Study Tables */}
                            <AccordionItem value="study">
                                <AccordionTrigger className="font-bold">Study Tables</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Attend Zeta Pi pledge study table once per week for ≥ 1 hour</li>
                                        <li>Held in Shapiro twice a week</li>
                                        <li>1 missed week allowed with no penalty (no notice required)</li>
                                        <li>
                                            &gt;1 missed week → make up with <span className="font-medium">1 committee point or 2 coffee chats</span>
                                        </li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Post-Party Cleanup */}
                            <AccordionItem value="cleanup">
                                <AccordionTrigger className="font-bold">Post-Party Cleanup</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Must clean after one party <span className="font-medium">in addition to</span> bid night cleanup</li>
                                        <li>Random assignment if not enough sign-ups</li>
                                        <li>Supplies provided</li>
                                        <li>Track cleanup points in the pledge attendance sheet (cleanup tracker)</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Milestones */}
                            <AccordionItem value="milestones">
                                <AccordionTrigger className="font-bold">Milestones</AccordionTrigger>
                                <AccordionContent className="space-y-2">
                                    <p>
                                        Deadlines to keep pledges on track. All requirements must be completed by initiation,
                                        but these checkpoints help avoid penalties (e.g., social probation).
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>
                                            <span className="font-semibold">Milestone 1:</span> 7 coffee chats · 2 committee points
                                        </li>
                                        <li>
                                            <span className="font-semibold">Milestone 2:</span> 14 coffee chats · 4 committee points
                                        </li>
                                        <li>
                                            <span className="font-semibold">Milestone 3:</span> 20 coffee chats · 6 committee points
                                        </li>
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
                                        <li><u><strong><a href="https://join.photocircleapp.com/S0C7Z2ZBXA">PhotoCircle</a></strong></u></li>
                                        <li><u><strong><a href="https://calendar.google.com/calendar/embed?src=c_c813756b791ff495bc94dc7041d7e02a10136be55730bd669288ee8717a1bfd4%40group.calendar.google.com&ctz=America%2FNew_York">Google Calendar</a></strong></u></li>
                                        <li><u><strong><a href="https://drive.google.com/drive/folders/1_GnALj-7Gq_OYPatLA93B8vngQq5-v-8">Knowledgebase</a></strong></u></li>
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
