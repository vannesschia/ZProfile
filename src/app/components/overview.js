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
  getChapterAttendance,
  getCoffeeChats,
  getPledgeEvents,
  getStudyTables
} from "@/lib/db/global";
import { CoffeeChatsTable } from "./pledge-overview/coffee-chats/data-table";
import { PledgeEventDataTable, StudyTableDataTable } from "./pledge-overview/study-table/data-table";

export async function Overview({ uniqname, role = "brother" }) {
  const events = await getCommitteeAndRushEvents(uniqname);
  const chapter = await getChapterAttendance(uniqname);

  return(
    <>
      {role == "pledge" ?
        <ProgressBlock title={"Other Events"} subtext={"Here are events for the entire faternity."}>
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
        :
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
      }
    </>
  )
}

export async function PledgeOverview({uniqname}) {
  const coffeeChats = await getCoffeeChats(uniqname);
  const pledgeEvents = await getPledgeEvents(uniqname);
  const studyTable = await getStudyTables(uniqname);
  console.log(pledgeEvents);
  console.log(studyTable);

  return (
    <ProgressBlock title={"Pledge Overview"} subtext={"Here are events specific to the pledge class."}>
      <Tabs defaultValue="coffeeChats">
        <TabsList>
          <TabsTrigger value="coffeeChats">Coffee Chats</TabsTrigger>
          <TabsTrigger value="pledgeEvents">Pledge Events</TabsTrigger>
          <TabsTrigger value="studyTables">Study Tables</TabsTrigger>
        </TabsList>
        <TabsContent value="coffeeChats">
          <CoffeeChatsTable data={coffeeChats} />
        </TabsContent>
        <TabsContent value="pledgeEvents">
          <ChapterDataTable data={pledgeEvents} />
        </TabsContent>
        <TabsContent value="studyTables">
          <StudyTableDataTable data={studyTable} />
        </TabsContent>
      </Tabs>
    </ProgressBlock>
  )
}