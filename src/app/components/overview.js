import { ProgressBlock } from "./progress-block";
import { DataTable } from "./committee-events/data-table";
import { ChapterDataTable } from "./chapter/data-table";
import { 
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";
import { 
  getCommitteeAndRushEvents,
  tallyCategories,
  getAttendanceRequirements,
  getChapterAttendance
} from "@/lib/db/global";

export async function Overview({ uniqname }) {
  const events = await getCommitteeAndRushEvents(uniqname);
  // const tallyEvents = Object.entries(tallyCategories(events));
  // const attendanceRequirements = await getAttendanceRequirements(uniqname);
  // const totalPoints = Math.max(attendanceRequirements, tallyEvents.length);
  const chapter = await getChapterAttendance(uniqname);
  
  // const colors = ["bg-[#004b23]", "bg-[#006400]", "bg-[#007200]", "bg-[#008000]", "bg-[#38b000]", "bg-[#70e000]", "bg-[#9ef01a]"]
  // const breakpoints = [
  //   {
  //     title: "Milestone #1",
  //     committeePoints: 2,
  //     dueDate: "6/1",
  //     coffeeChats: 0,
  //   },
  //   {
  //     title: "Milestone #2",
  //     committeePoints: 4,
  //     dueDate: "6/15",
  //     coffeeChats: 0,
  //   },
  //   {
  //     title: "Final Milestone",
  //     committeePoints: 6,
  //     dueDate: "7/5",
  //     coffeeChats: 0,
  //   },
  //   {
  //     title: "Extra Points",
  //     committeePoints: 8,
  //     dueDate: "7/23",
  //     coffeeChats: 0,
  //   }
  // ]
  // const fillPct = (events.length / totalPoints) * 100;

  return(
    <ProgressBlock title={"Brother Overview"}>
      <Tabs defaultValue="committee_points">
        <TabsList>
          <TabsTrigger value="committee_points">Committee Points</TabsTrigger>
          <TabsTrigger value="chapter">Chapter</TabsTrigger>
        </TabsList>
        <TabsContent value="committee_points">
          <DataTable data={events} />
        </TabsContent>
        <TabsContent value="chapter">
          <ChapterDataTable data={chapter} />
        </TabsContent>
      </Tabs>
    </ProgressBlock>
  )
}