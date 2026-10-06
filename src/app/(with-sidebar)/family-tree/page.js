import { getServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import FamilyTree from "./ClientView";
import {
  changeRelationship,
  replaceFamilyRelationship,
} from "./_lib/actions";

export default async function FamilyTreePage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/");

  const viewerUniqname = user.email.split("@")[0];
  const { data: viewer } = await supabase
    .from("members")
    .select("uniqname, admin")
    .ilike("uniqname", viewerUniqname)
    .single();
  if (!viewer)
    return (
      <p role="alert">
        Your member profile could not be loaded. Please contact an admin.
      </p>
    );

  const [members, relationships, familyTreePeople, classOrder, requirements] =
    await Promise.all([
      supabase
        .from("members")
        .select(
          "uniqname, name, email_address, phone_number, major, minor, grade, current_class_number, graduation_year, profile_picture_url",
        )
        .order("name"),
      supabase
        .from("family_relationships")
        .select("big_uniqname, little_uniqname"),
      supabase
        .from("family_tree_people")
        .select("person_key, name, class_name")
        .order("name"),
      supabase.from("class_order").select("id, class_name").order("id"),
      supabase.from("requirements").select("current_class").single(),
    ]);

  if (
    members.error ||
    relationships.error ||
    familyTreePeople.error ||
    classOrder.error ||
    requirements.error
  ) {
    console.error(
      "Family tree load failed:",
      members.error ||
        relationships.error ||
        familyTreePeople.error ||
        classOrder.error ||
        requirements.error,
    );
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Family Tree</h1>
        <p role="alert" className="mt-4">
          The family tree is unavailable. Please try again later or contact an
          admin.
        </p>
      </div>
    );
  }

  const people = [
    ...members.data,
    ...(familyTreePeople.data || []).map((person) => ({
      uniqname: person.person_key,
      name: person.name,
      current_class_number: person.class_name,
      isFamilyTreeOnly: true,
    })),
  ];
  const orderedClasses = (classOrder.data || [])
    .map((row) => String(row.class_name || "").trim())
    .filter(Boolean);
  const currentClass = String(requirements.data.current_class || "").trim();
  const classOptions = orderedClasses.filter(
    (className) => className.toLowerCase() !== currentClass.toLowerCase(),
  );

  return (
    <FamilyTree
      members={people}
      relationships={relationships.data}
      classOptions={classOptions}
      classOrder={orderedClasses}
      canEdit={viewer.admin === true}
      onChangeRelationship={changeRelationship}
      onReplaceRelationship={replaceFamilyRelationship}
    />
  );
}
