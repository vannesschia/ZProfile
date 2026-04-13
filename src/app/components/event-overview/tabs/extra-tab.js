import { getExtraTabData, getCompletedExtra } from "../../../(with-sidebar)/dashboard/_lib/queries";
import ExtraTabContent from "./extra-tab-content";

export default async function ExtraTab({ uniqname, role, supabase }) {
  const [data, completed] = await Promise.all([
    getExtraTabData(uniqname, supabase, role.role),
    getCompletedExtra(uniqname, supabase, role.role),
  ]);

  return <ExtraTabContent {...data} completedExtraPoints={completed} />;
}
