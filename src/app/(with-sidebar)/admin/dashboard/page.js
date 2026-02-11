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
  getBrotherRushAttendanceCounts,
  getPledgeCoffeeChatRequirements,
  getPledgeEventAbsenceCounts,
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
    ccRequirementsRaw,
    absenceCounts,
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
    getPledgeCoffeeChatRequirements(supabase),
    getPledgeEventAbsenceCounts(supabase),
  ]);

  const requirementOverrides = (ccRequirementsRaw || []).reduce((acc, row) => {
    acc[row.uniqname] = row.required_offset;
    return acc;
  }, {});

  const pledgeProgress = (pledgeView || []).map((row) => ({
    ...row,
    excused_absences: absenceCounts[row.uniqname]?.excused ?? 0,
    unexcused_absences: absenceCounts[row.uniqname]?.unexcused ?? 0,
  }));

  return (
    <AdminViewTable
      milestones={milestones}
      pledgeProgress={pledgeProgress}
      requirementOverrides={requirementOverrides}
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
