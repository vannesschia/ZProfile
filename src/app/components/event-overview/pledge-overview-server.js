import { getCoffeeChats, getPledgeEvents, getStudyTables } from "@/lib/db/events/queries"
import PledgeOverviewView from "./pledge-overview-view"
import { getServerClient } from "@/lib/supabaseServer"

export default async function PledgeOverviewServer({ uniqname }) {
  const supabase = await getServerClient();
  const [coffeeChats, pledgeEvents, studyTable] = await Promise.all([
    getCoffeeChats(uniqname, supabase),
    getPledgeEvents(uniqname, supabase),
    getStudyTables(uniqname, supabase),
  ])
  return <PledgeOverviewView coffeeChats={coffeeChats} pledgeEvents={pledgeEvents} studyTable={studyTable} />
}
