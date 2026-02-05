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
                                        <li>Ananthu Nair: (734) 218-5735</li>
                                        <li>Zachary Gammo: (248) 977-7628</li>
                                        <li><u><strong><a href="https://docs.google.com/spreadsheets/d/1UonCbKMuklj9wzJTwvyKLXolxOviOu5VVU8WId56igo/edit?usp=sharing" target="_blank" rel="noopener noreferrer">Pledge Attendance Tracker</a></strong></u></li>
                                        <li><u><strong><a href="https://join.photocircleapp.com/3JFJHJDHXX" target="_blank" rel="noopener noreferrer">PhotoCircle</a></strong></u></li>
                                        <li><u><strong><a href="https://calendar.google.com/calendar/embed?src=c_c813756b791ff495bc94dc7041d7e02a10136be55730bd669288ee8717a1bfd4%40group.calendar.google.com&ctz=America%2FNew_York" target="_blank" rel="noopener noreferrer">Google Calendar</a></strong></u></li>
                                        <li><u><strong><a href="https://www.zprofile.tech/coffee-chat" target="_blank" rel="noopener noreferrer">Coffee Chat Form</a></strong></u></li>
                                        <li><u><strong><a href="https://drive.google.com/drive/folders/1_GnALj-7Gq_OYPatLA93B8vngQq5-v-8" target="_blank" rel="noopener noreferrer">Knowledgebase</a></strong></u></li>
                                        <li><u><strong><a href="https://forms.gle/bYJL1jPgd18fhaLv5" target="_blank" rel="noopener noreferrer">Study table google form</a></strong></u></li>
                                        <li><u><strong><a href="https://groupme.com/join_group/110523698/OGCBP7U0" target="_blank" rel="noopener noreferrer">ZP Groupme</a></strong></u></li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Pledge Events */}
                            <AccordionItem value="events">
                                <AccordionTrigger className="font-bold">Pledge Events</AccordionTrigger>
                                <AccordionContent className="space-y-2">
                                    <p>Weekly pledge events (~2 hours)</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>1 excused absence from pledge events</li>
                                        <li>Must notify Ananthu or Zach ahead of time to use excused absence</li>
                                        <li>
                                            Unexcused absences and more than one excused absence must be made up for with either 3 coffee chats or committee points.
                                        </li>
                                        <li className="mt-1">This means you can do (any combination of the two to add up to 3 extra &quot;“points”):</li>
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
                                        <li>One free excused absence from chapter meetings</li>
                                        <li>Must notify Ananthu or Zach ahead of time to use excused absence</li>
                                        <li>Unexcused absence must be made up for with 3 committee points</li>
                                        <li>More than one excused absence must be made up for with 2 committee points</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Committee Points */}
                            <AccordionItem value="committee">
                                <AccordionTrigger className="font-bold">Committee Points</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>6 committee points before initiation across all 5 committees apart from RAM: Tech &amp; Projects, Professional Development, Marketing, Social, Fundraising</li>
                                        <li>
                                            <span className="font-medium">Do not count</span>: parties, chapters, bid night, initiation night, and pledge events
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
                                        <li>Will be held in Shapiro Tuesday and Wednesday evenings from 7pm to 10pm</li>
                                        <li>Submit proof of attending each week by submitting a selfie to the <strong><a href="https://forms.gle/bYJL1jPgd18fhaLv5">study table google form</a></strong></li>
                                        <li>Allowed to miss one week throughout the semester without notifying Ananthu or Zach at no penalty</li>
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
                                        <li>View your cleanup points in the cleanup tracker in the <strong><a href="https://docs.google.com/spreadsheets/d/1UonCbKMuklj9wzJTwvyKLXolxOviOu5VVU8WId56igo/edit?usp=sharing" target="_blank" rel="noopener noreferrer">pledge attendance sheet</a></strong></li>
                                        <li>Failure to show up will result in additional coffee chats</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Milestones */}
                            <AccordionItem value="milestones">
                                <AccordionTrigger className="font-bold">Milestones</AccordionTrigger>
                                <AccordionContent className="space-y-2">
                                    <p>
                                        Deadlines by which pledges must fulfill certain requirements in order to avoid varying levels of punishments like social probation.
                                        All requirements must be fulfilled by initiation but these milestones are created to keep pledges on track throughout their pledge semester.
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>
                                            <span className="font-semibold">Milestone 1 - February 27:</span> 7 coffee chats · 2 committee points
                                        </li>
                                        <li>
                                            <span className="font-semibold">Milestone 2 - March 27:</span> 14 coffee chats · 4 committee points
                                        </li>
                                        <li>
                                            <span className="font-semibold">Milestone 3 - April 21:</span> 20 coffee chats · 6 committee points
                                        </li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Pledge Class President */}
                            <AccordionItem value="pcp">
                                <AccordionTrigger className="font-bold">Pledge Class President</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>One pledge will have the chance to be elected as PCP during an election that will be held after UGLI Challenge on Zoom: Wednesday 2/18</li>
                                        <li>Sends hype messages for stables, pledge events, parties</li>
                                        <li>Eboard Meetings: Call in for 20 minutes and act as voice for pledges</li>
                                        <li>Ask questions/express concerns on behalf of PC</li>
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
                                        <li>Ananthu Nair: (734) 218-5735</li>
                                        <li>Zachary Gammo: (248) 977-7628</li>
                                        <li><u><strong><a href="https://join.photocircleapp.com/3JFJHJDHXX" target="_blank" rel="noopener noreferrer">PhotoCircle</a></strong></u></li>
                                        <li><u><strong><a href="https://calendar.google.com/calendar/embed?src=c_c813756b791ff495bc94dc7041d7e02a10136be55730bd669288ee8717a1bfd4%40group.calendar.google.com&ctz=America%2FNew_York" target="_blank" rel="noopener noreferrer">Google Calendar</a></strong></u></li>
                                        <li><u><strong><a href="https://drive.google.com/drive/folders/1_GnALj-7Gq_OYPatLA93B8vngQq5-v-8" target="_blank" rel="noopener noreferrer">Knowledgebase</a></strong></u></li>
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
