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
                                        <li><u><strong><a href="https://docs.google.com/spreadsheets/d/1pTNPSq05jP9e0i8IEr0orUWKv9z_msK0c6Y-XQ9nmQc/edit?usp=sharing">Pledge Informational Sheets (Brother Contact, Coffee Chat Pairings, Cleanup Tracker)</a></strong></u></li>
                                        <li><u><strong><a href="https://join.photocircleapp.com/S0C7Z2ZBXA">PhotoCircle</a></strong></u></li>
                                        <li><u><strong><a href="https://calendar.google.com/calendar/embed?src=c_c813756b791ff495bc94dc7041d7e02a10136be55730bd669288ee8717a1bfd4%40group.calendar.google.com&ctz=America%2FNew_York">Google Calendar</a></strong></u></li>
                                        <li><u><strong><a href="./coffee-chat">Coffee Chat Form</a></strong></u></li>
                                        <li><u><strong><a href="https://drive.google.com/drive/folders/1_GnALj-7Gq_OYPatLA93B8vngQq5-v-8">Knowledgebase</a></strong></u></li>
                                        <li><u><strong><a href="https://forms.gle/WfjH6i5gznAej1A87">Study Table Google Form</a></strong></u></li>
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
                                        <li className="mt-1">Examples (any combo totaling 3 “points”):</li>
                                        <ul className="list-disc pl-8">
                                            <li>3 coffee chats</li>
                                            <li>3 committee events</li>
                                            <li>2 coffee chats and 1 committee event</li>
                                            <li>2 committee events and 1 coffee chat</li>
                                            <li>Any combination of the two to add up to 3 extra &quot;points&quot;</li>
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
                                        <li>Coffee chat: 30+ minute meeting or hangout with a brother to get to know each other better</li>
                                        <li>20 coffee chats before initiation</li>
                                        <li>5 randomly assigned</li>
                                        <li>15 of pledge&apos;s choosing</li>
                                        <li>Submit coffee chat through the coffee chat submission page in ZProfile</li>
                                        <li>Coffee chat form can be found on pledge dashboard</li>
                                        <li className="italic"><strong>Hint:</strong> Be aware that you can be penalized and receive extra coffee chats so start on your coffee chats as soon as possible</li>
                                        <li className="italic"><strong>Hint:</strong> Getting coffee and studying together can be fun but keep in mind that it&apos;s more memorable to do interesting activities like baking together, painting together, going on a run, watching a show, etc.</li>
                                        <li className="italic"><strong>Hint:</strong> coffee chatting brothers you don&apos;t already know is tempting but won&apos;t help you in the long run while you look for a potential big</li>

                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Study Tables */}
                            <AccordionItem value="study">
                                <AccordionTrigger className="font-bold">Study Tables</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Must attend Zeta Pi pledge study table once a week for at least one hour</li>
                                        <li>Will be held in Shapiro Tuesday and Thursday evenings from 7pm to 10pm</li>
                                        <li>Pledges are in charge of finding a table or booking a room for the study session</li>
                                        <li>Submit proof of attending each week by submitting a selfie to the <strong><a href="https://forms.gle/WfjH6i5gznAej1A87">study table google form</a></strong></li>
                                        <li>Allowed to miss one week throughout the semester without notifying Nicky or Abby at no penalty</li>
                                        <li>More than one missed study table must be made up for with either 1 committee point or 2 coffee chats.</li>

                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Post-Party Cleanup */}
                            <AccordionItem value="cleanup">
                                <AccordionTrigger className="font-bold">Post-Party Cleanup</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Must clean after a party once in addition to cleaning up after bid night</li>
                                        <li>Will be randomly assigned if there are not enough pledges signed up</li>
                                        <li>Supplies will be provided at house</li>
                                        <li>View your cleanup points in the <strong><a href="https://docs.google.com/spreadsheets/d/17S7amIitZdCQx7JJhBYWi5hcAqG8UV2dOGO09GQFFVA/edit?usp=sharing">cleanup tracker</a></strong> in the pledge attendance sheet</li>
                                        <li>Failure to show up will result in additional coffee chats</li>
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
