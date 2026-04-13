import { getAbsenceCounts } from "../../../(with-sidebar)/dashboard/_lib/queries";
import AbsencesContent from "./absences-content";

export default async function Absences({ uniqname, role, supabase }) {
  const absences = await getAbsenceCounts(uniqname, supabase, role);

  return <AbsencesContent absences={absences} memberRole={role} />;
}
