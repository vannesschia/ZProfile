import AdminPledgeViewTable from "./table";
import { 
  getMilestones,
  getPledgeProgressMilestones,
  getAllCommitteesAttendance,
  getInvCommitteeEventCount,
  getAllChapterAttendance,
  getAllPledgeEventsAttendance,
  getAllRushEventsAttendance,
  getAllStudyTablesAttendance
} from "@/lib/db/global"

export default async function AdminPledgeView() {
  const milestones = await getMilestones();
  const pledgeProgress = await getPledgeProgressMilestones();
  const committeesAttendance = await getAllCommitteesAttendance();
  const indvCommitteeCount = await getInvCommitteeEventCount();
  const chapterAttendance = await getAllChapterAttendance();
  const pledgeEventAttendance = await getAllPledgeEventsAttendance();
  const rushEventsAttendance = await getAllRushEventsAttendance();
  const studyTableAttendance = await getAllStudyTablesAttendance();

  return (
    <>
      <AdminPledgeViewTable 
        milestones={milestones}
        pledgeProgress={pledgeProgress}
        committeesAttendance={committeesAttendance}
        indvCommitteeCount={indvCommitteeCount}
        chapterAttendance={chapterAttendance}
        pledgeEventAttendance={pledgeEventAttendance}
        rushEventsAttendance={rushEventsAttendance}
        studyTableAttendance={studyTableAttendance}
      />
    </>
  )
}