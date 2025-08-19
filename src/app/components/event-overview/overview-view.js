import { ProgressBlock } from "../progress-block" 
import { DataTable } from "../committee-events/data-table"
import { ChapterDataTable } from "../chapter/data-table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function OverviewView({ role = "brother", events, chapter }) {
  return (
    <>
      {role === "pledge" ? (
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
      ) : (
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
      )}
    </>
  )
}
