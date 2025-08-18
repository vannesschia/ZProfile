import AdminViewTable from "./table";
import { 
  getMilestones,
  getAllCommitteesAttendance,
  getInvCommitteeEventCount,
  getAllChapterAttendance,
  getAllPledgeEventsAttendance,
  getAllRushEventsAttendance,
  getAllStudyTablesAttendance,
  getPledgeAdminView,
  getBrotherAdminView,
  getBrotherRequirement
} from "@/lib/db/global"

export default async function AdminPledgeView() {
  const milestones = await getMilestones();
  const pledgeView = await getPledgeAdminView();
  const committeesAttendance = await getAllCommitteesAttendance();
  const indvCommitteeCount = await getInvCommitteeEventCount();
  const chapterAttendance = await getAllChapterAttendance();
  const pledgeEventAttendance = await getAllPledgeEventsAttendance();
  const rushEventsAttendance = await getAllRushEventsAttendance();
  const studyTableAttendance = await getAllStudyTablesAttendance();
  const brotherView = await getBrotherAdminView();
  const brotherRequirement  = await getBrotherRequirement();

  return (
    <>
      <AdminViewTable 
        milestones={milestones}
        pledgeProgress={pledgeView}
        committeesAttendance={committeesAttendance}
        indvCommitteeCount={indvCommitteeCount}
        chapterAttendance={chapterAttendance}
        pledgeEventAttendance={pledgeEventAttendance}
        rushEventsAttendance={rushEventsAttendance}
        studyTableAttendance={studyTableAttendance}
        brotherView={brotherView}
        brotherRequirement={brotherRequirement}
      />
    </>
  )
}