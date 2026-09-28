import "server-only";
import { getFamilyTreePreviewSupabase } from "@/lib/family-tree-preview-supabase";

const MEMBER_FIELDS =
  "uniqname, name, email_address, phone_number, major, minor, grade, current_class_number, graduation_year, profile_picture_url";

export async function localPreview() {
  if (process.env.NODE_ENV !== "development") return null;
  const supabase = await getFamilyTreePreviewSupabase();
  if (!supabase) return null;

  let membersResult;
  let familyTreePeopleResult;
  let relationshipsResult;
  let classOrderResult;
  try {
    [membersResult, familyTreePeopleResult, relationshipsResult, classOrderResult] = await Promise.all([
      supabase.from("members").select(MEMBER_FIELDS).order("name"),
      supabase
        .from("family_tree_people")
        .select("person_key, name, class_name")
        .order("name"),
      supabase
        .from("family_relationships")
        .select("big_uniqname, little_uniqname"),
      supabase.from("class_order").select("class_name").order("id"),
    ]);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch"))
      return null;
    throw error;
  }
  if (membersResult.error || familyTreePeopleResult.error || relationshipsResult.error) {
    const error =
      membersResult.error || familyTreePeopleResult.error || relationshipsResult.error;
    if (error.message?.includes("fetch failed")) return null;
    throw error;
  }

  const members = (membersResult.data || []).filter(
    (member) =>
      String(member.current_class_number || "").trim().toLowerCase() !==
      "theta",
  );
  members.push(
    ...(familyTreePeopleResult.data || []).map((person) => ({
      uniqname: person.person_key,
      name: person.name,
      current_class_number: person.class_name,
      isFamilyTreeOnly: true,
    })),
  );
  const classOrder = (classOrderResult?.data || [])
    .map((row) => String(row.class_name || "").trim())
    .filter(Boolean);
  const rosterClasses = [
    ...new Set(
      members
        .map((member) => String(member.current_class_number || "").trim())
        .filter((className) => className && className.toLowerCase() !== "theta"),
    ),
  ].sort((a, b) => a.localeCompare(b));
  const classOptions = (classOrder.length ? classOrder : rosterClasses).filter(
    (className) => className.toLowerCase() !== "theta",
  );
  members.sort((a, b) => (a.name || a.uniqname).localeCompare(b.name || b.uniqname));
  const ids = new Set(members.map((member) => member.uniqname));
  return {
    members,
    classOptions,
    classOrder,
    relationships: (relationshipsResult.data || []).filter(
      (edge) => ids.has(edge.big_uniqname) && ids.has(edge.little_uniqname),
    ),
  };
}
