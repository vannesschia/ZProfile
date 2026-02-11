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
  getBrotherRequirement,
  getBrotherRushAttendanceCounts
} from "./_lib/queries";
import { getServerClient } from "@/lib/supabaseServer";

export default async function AdminPledgeView() {
  const supabase = await getServerClient();

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
    brotherRushAttendanceCounts,
  ] = await Promise.all([
    getMilestones(supabase),
    getPledgeAdminView(supabase),
    getAllCommitteesAttendance(supabase),
    getInvCommitteeEventCount(supabase),
    getAllChapterAttendance(supabase),
    getAllPledgeEventsAttendance(supabase),
    getAllRushEventsAttendance(supabase),
    getAllStudyTablesAttendance(supabase),
    getBrotherAdminView(supabase),
    getBrotherRequirement(supabase),
    getBrotherRushAttendanceCounts(supabase),
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
      brotherRushAttendanceCounts={brotherRushAttendanceCounts ?? {}}
    />
  );
}
