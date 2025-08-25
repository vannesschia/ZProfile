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
  const [
    milestones,
    pledgeView,
    committeesAttendance,
    indvCommitteeCount,
    chapterAttendance,
    pledgeEventAttendance,
    rushEventsAttendance,
    studyTableAttendance,
    brotherView,
    brotherRequirement,
  ] = await Promise.all([
    getMilestones(),
    getPledgeAdminView(),
    getAllCommitteesAttendance(),
    getInvCommitteeEventCount(),
    getAllChapterAttendance(),
    getAllPledgeEventsAttendance(),
    getAllRushEventsAttendance(),
    getAllStudyTablesAttendance(),
    getBrotherAdminView(),
    getBrotherRequirement(),
  ]);

  return (
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
  );
}
