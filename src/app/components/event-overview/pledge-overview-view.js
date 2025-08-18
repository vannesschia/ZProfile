import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ProgressBlock } from "../progress-block"
import { CoffeeChatsTable } from "../pledge-overview/coffee-chats/data-table"
import { ChapterDataTable } from "../chapter/data-table"
import { StudyTableDataTable } from "../pledge-overview/study-table/data-table"

export default function PledgeOverviewView({ coffeeChats, pledgeEvents, studyTable }) {
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
