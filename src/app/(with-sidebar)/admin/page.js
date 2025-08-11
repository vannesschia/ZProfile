import AdminPledgeViewTable from "./table";
import { getMilestones, getPledgeProgressMilestones } from "@/lib/db/global"

export default async function AdminPledgeView() {
  const milestones = await getMilestones();
  const pledgeProgress = await getPledgeProgressMilestones();

  return (
    <>
      <AdminPledgeViewTable milestones={milestones} pledgeProgress={pledgeProgress} />
    </>
  )
}