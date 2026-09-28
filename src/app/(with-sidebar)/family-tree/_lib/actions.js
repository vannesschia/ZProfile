"use server";

import { getServerClient } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

export async function changeRelationship(big, little, remove = false) {
  if (
    typeof big !== "string" ||
    typeof little !== "string" ||
    !big ||
    !little ||
    big === little ||
    typeof remove !== "boolean"
  ) {
    return { error: "Choose two different members." };
  }
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Please sign in again." };
  const { data: canEdit, error: permissionError } = await supabase.rpc(
    "can_edit_family_tree",
  );
  if (permissionError) {
    console.error("Family-tree permission lookup failed:", permissionError);
    return { error: "Could not verify family-tree editing access." };
  }
  if (canEdit !== true)
    return { error: "You don't have permission to edit family relationships." };
  const { error } = await supabase.rpc("change_family_relationship", {
    p_big: big,
    p_little: little,
    p_remove: remove,
  });
  if (error) {
    if (error.code === "22023" || error.code === "42501")
      return { error: error.message };
    if (error.code === "23503")
      return {
        error: "A selected member no longer exists. Refresh and try again.",
      };
    console.error("Family relationship update failed:", error);
    return { error: "Could not save the relationship. Please try again." };
  }
  revalidatePath("/family-tree");
  return { success: true };
}

export async function replaceFamilyRelationship(
  oldBig,
  oldLittle,
  newBig,
  newLittle,
) {
  const endpoints = [oldBig, oldLittle, newBig, newLittle];
  if (
    endpoints.some(
      (value) => typeof value !== "string" || !value || value.length > 64,
    ) ||
    oldBig === oldLittle ||
    newBig === newLittle
  ) {
    return { error: "Choose two different people." };
  }

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Please sign in again." };
  const { data: canEdit, error: permissionError } = await supabase.rpc(
    "can_edit_family_tree",
  );
  if (permissionError) {
    console.error("Family-tree permission lookup failed:", permissionError);
    return { error: "Could not verify family-tree editing access." };
  }
  if (canEdit !== true)
    return { error: "You don't have permission to edit family relationships." };

  const { error } = await supabase.rpc("replace_family_relationship", {
    p_old_big: oldBig,
    p_old_little: oldLittle,
    p_new_big: newBig,
    p_new_little: newLittle,
  });
  if (error) {
    if (error.code === "22023" || error.code === "42501")
      return { error: error.message };
    if (error.code === "23503")
      return {
        error: "A selected person no longer exists. Refresh and try again.",
      };
    if (error.code === "23505")
      return { error: "This relationship already exists." };
    console.error("Family relationship replacement failed:", error);
    return { error: "Could not update the relationship. Please try again." };
  }
  revalidatePath("/family-tree");
  return { success: true };
}

export async function createFamilyTreePerson(name, className = "") {
  const normalizedName =
    typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
  const normalizedClass =
    typeof className === "string" ? className.trim() : "";
  if (className != null && typeof className !== "string") {
    return { error: "Choose a valid class." };
  }
  if (normalizedName.length < 2 || normalizedName.length > 120) {
    return { error: "Enter a full name between 2 and 120 characters." };
  }

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Please sign in again." };
  const { data: canEdit, error: permissionError } = await supabase.rpc(
    "can_edit_family_tree",
  );
  if (permissionError) {
    console.error("Family-tree permission lookup failed:", permissionError);
    return { error: "Could not verify family-tree editing access." };
  }
  if (canEdit !== true)
    return { error: "You don't have permission to add family-tree people." };

  const { data: personKey, error } = await supabase.rpc(
    "create_family_tree_person",
    { p_name: normalizedName, p_class_name: normalizedClass || null },
  );
  if (error) {
    if (error.code === "22023" || error.code === "42501")
      return { error: error.message };
    console.error("Family-tree-only person creation failed:", error);
    return { error: "Could not add this person. Please try again." };
  }
  revalidatePath("/family-tree");
  return {
    person: {
      uniqname: personKey,
      name: normalizedName,
      current_class_number: normalizedClass || null,
      isFamilyTreeOnly: true,
    },
  };
}

export async function updateFamilyTreePerson(personKey, name, className = "") {
  const normalizedName =
    typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
  const normalizedClass =
    typeof className === "string" ? className.trim() : "";
  if (className != null && typeof className !== "string") {
    return { error: "Choose a valid class." };
  }
  if (
    typeof personKey !== "string" ||
    !personKey.startsWith("__family_tree_person__:")
  ) {
    return { error: "Choose a family-tree-only person to edit." };
  }
  if (normalizedName.length < 2 || normalizedName.length > 120) {
    return { error: "Enter a full name between 2 and 120 characters." };
  }

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Please sign in again." };
  const { data: canEdit, error: permissionError } = await supabase.rpc(
    "can_edit_family_tree",
  );
  if (permissionError) {
    console.error("Family-tree permission lookup failed:", permissionError);
    return { error: "Could not verify family-tree editing access." };
  }
  if (canEdit !== true)
    return { error: "You don't have permission to edit family-tree people." };

  const { error } = await supabase.rpc("update_family_tree_person", {
    p_person_key: personKey,
    p_name: normalizedName,
    p_class_name: normalizedClass || null,
  });
  if (error) {
    if (error.code === "22023" || error.code === "42501")
      return { error: error.message };
    console.error("Family-tree-only person update failed:", error);
    return { error: "Could not update this person. Please try again." };
  }
  revalidatePath("/family-tree");
  return {
    person: {
      uniqname: personKey,
      name: normalizedName,
      current_class_number: normalizedClass || null,
      isFamilyTreeOnly: true,
    },
  };
}

export async function updateFamilyTreeMemberClass(memberKey, className) {
  const normalizedClass =
    typeof className === "string" ? className.trim() : "";
  if (
    typeof memberKey !== "string" ||
    !memberKey ||
    memberKey.startsWith("__family_tree_person__:")
  ) {
    return { error: "Choose a ZProfile member to update." };
  }
  if (!normalizedClass) return { error: "Choose a class." };
  if (normalizedClass.length > 80) return { error: "Choose a valid class." };

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Please sign in again." };
  const { data: canEdit, error: permissionError } = await supabase.rpc(
    "can_edit_family_tree",
  );
  if (permissionError) {
    console.error("Family-tree permission lookup failed:", permissionError);
    return { error: "Could not verify family-tree editing access." };
  }
  if (canEdit !== true)
    return { error: "You don't have permission to edit family-tree classes." };

  const { data: updatedClass, error } = await supabase.rpc(
    "set_family_tree_member_class",
    { p_member_uniqname: memberKey, p_class_name: normalizedClass },
  );
  if (error) {
    if (error.code === "22023" || error.code === "42501")
      return { error: error.message };
    console.error("Family-tree member class update failed:", error);
    return { error: "Could not update this class. Please try again." };
  }
  revalidatePath("/family-tree");
  return {
    member: { uniqname: memberKey, current_class_number: updatedClass },
  };
}

export async function deleteFamilyTreePerson(personKey) {
  if (
    typeof personKey !== "string" ||
    !personKey.startsWith("__family_tree_person__:")
  ) {
    return { error: "Only a family-tree-only person can be deleted here." };
  }

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Please sign in again." };
  const { data: canEdit, error: permissionError } = await supabase.rpc(
    "can_edit_family_tree",
  );
  if (permissionError) {
    console.error("Family-tree permission lookup failed:", permissionError);
    return { error: "Could not verify family-tree editing access." };
  }
  if (canEdit !== true)
    return { error: "You don't have permission to delete family-tree people." };

  const { error } = await supabase.rpc("delete_family_tree_person", {
    p_person_key: personKey,
  });
  if (error) {
    if (error.code === "22023" || error.code === "42501")
      return { error: error.message };
    console.error("Family-tree-only person deletion failed:", error);
    return { error: "Could not delete this person. Please try again." };
  }
  revalidatePath("/family-tree");
  return { success: true };
}
