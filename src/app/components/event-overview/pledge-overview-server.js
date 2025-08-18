import { getCoffeeChats, getPledgeEvents, getStudyTables } from "@/lib/db/global"
import PledgeOverviewView from "./pledge-overview-view"

export default async function PledgeOverviewServer({ uniqname }) {
  const [coffeeChats, pledgeEvents, studyTable] = await Promise.all([
    getCoffeeChats(uniqname),
    getPledgeEvents(uniqname),
    getStudyTables(uniqname),
  ])
  return <PledgeOverviewView coffeeChats={coffeeChats} pledgeEvents={pledgeEvents} studyTable={studyTable} />
}
