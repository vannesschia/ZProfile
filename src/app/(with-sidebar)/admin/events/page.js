import AdminEventViewTable from "./table";
import { 
  getAllCommitteesAttendance,
  getInvCommitteeEventCount,
  getAllChapterAttendance,
  getAllPledgeEventsAttendance,
  getAllRushEventsAttendance,
  getAllStudyTablesAttendance
} from "@/lib/db/global"

export default async function AdminPledgeView() {
  const committeesAttendance = await getAllCommitteesAttendance();
  const indvCommitteeCount = await getInvCommitteeEventCount();
  const chapterAttendance = await getAllChapterAttendance();
  const pledgeEventAttendance = await getAllPledgeEventsAttendance();
  const rushEventsAttendance = await getAllRushEventsAttendance();
  const studyTableAttendance = await getAllStudyTablesAttendance();

  return (
    <>
      <AdminEventViewTable 
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