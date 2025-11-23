"use client"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CoffeeChatsTable } from "./pledge-overview/coffee-chats/data-table";
import { ChapterDataTable } from "./member-overview/chapter/data-table";
import { StudyTableDataTable } from "./pledge-overview/study-table/data-table";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PledgeOverviewView({
  coffeeChats,
  pledgeEvents,
  studyTable,
  adminView = false,
}) {
  console.log(coffeeChats);
  const router = useRouter();
  return (
    <div className="w-full bg-background border-2 border-secondary p-6 rounded-lg">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold tracking-tight">Pledge Overview</h2>
            <p className="text-sm tracking-tight">
              Here are events specific to the pledge class.
            </p>
          </div>
          {adminView ? null :
            <Button onClick={() => router.push('/coffee-chat')}>
              Submit Coffee Chat <ArrowUpRight />
            </Button>
          }
        </div>
        <div>
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
        </div>
      </div>
    </div>
  );
}
