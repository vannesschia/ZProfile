import { getFamilyTreePreviewSupabase } from "@/lib/family-tree-preview-supabase";
import { wouldCreateCycle } from "@/lib/family-tree.mjs";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

function json(body, status = 200) {
  return Response.json(body, { status });
}

function normalizeName(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normalizeClass(value) {
  return String(value || "").trim().toLowerCase();
}

export async function POST(request) {
  if (process.env.NODE_ENV !== "development")
    return new Response(null, { status: 404 });

  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const forwardedHost =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  const forwardedProto =
    request.headers.get("x-forwarded-proto")?.split(",")[0] ||
    requestUrl.protocol.slice(0, -1);
  const allowedOrigins = new Set([
    requestUrl.origin,
    forwardedHost ? `${forwardedProto}://${forwardedHost}` : null,
  ]);
  if (origin && !allowedOrigins.has(origin))
    return json({ error: "Cross-origin preview writes are not allowed." }, 403);
  if (requestUrl.searchParams.get("role") !== "admin")
    return json({ error: "Only the admin preview can edit relationships." }, 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  if (body?.action === "create_person") {
    const name = normalizeName(body.name);
    const requestedClass =
      typeof body.className === "string" ? body.className.trim() : "";
    if (name.length < 2 || name.length > 120)
      return json({ error: "Enter a full name between 2 and 120 characters." }, 400);
    if (body.className != null && typeof body.className !== "string")
      return json({ error: "Choose a valid class." }, 400);

    try {
      const supabase = await getFamilyTreePreviewSupabase();
      if (!supabase)
        return json({ error: "The preview database is not configured." }, 503);
      const [memberResult, peopleResult] = await Promise.all([
        supabase.from("members").select("name, current_class_number"),
        supabase.from("family_tree_people").select("name"),
      ]);
      if (memberResult.error || peopleResult.error) {
        console.error(
          "Local family-tree person lookup failed:",
          memberResult.error || peopleResult.error,
        );
        return json({ error: "Could not check the local family tree." }, 503);
      }
      const comparableName = name.toLocaleLowerCase();
      const availableClasses = new Map(
        (memberResult.data || [])
          .map((member) => String(member.current_class_number || "").trim())
          .filter((className) => className && normalizeClass(className) !== "theta")
          .map((className) => [normalizeClass(className), className]),
      );
      const className = requestedClass
        ? availableClasses.get(normalizeClass(requestedClass))
        : null;
      if (requestedClass && !className)
        return json({ error: "Choose a class from the available classes." }, 400);
      const duplicateMember = (memberResult.data || []).some(
        (member) =>
          normalizeClass(member.current_class_number) !== "theta" &&
          normalizeName(member.name).toLocaleLowerCase() === comparableName,
      );
      const duplicateTreePerson = (peopleResult.data || []).some(
        (person) => normalizeName(person.name).toLocaleLowerCase() === comparableName,
      );
      if (duplicateMember || duplicateTreePerson)
        return json(
          { error: "Someone with this name is already listed. Select them from the search results." },
          409,
        );

      const personKey = `__family_tree_person__:${randomUUID()}`;
      const { error } = await supabase
        .from("family_tree_people")
        .insert({ person_key: personKey, name, class_name: className })
        .select("person_key")
        .single();
      if (error) {
        console.error("Local family-tree person creation failed:", error);
        return json({ error: "Could not add this person." }, 500);
      }
      return json({
        person: {
          uniqname: personKey,
          name,
          current_class_number: className,
          isFamilyTreeOnly: true,
        },
      });
    } catch (error) {
      console.error("Could not create local family-tree person:", error);
      return json({ error: "Could not add this person." }, 500);
    }
  }

  if (body?.action === "update_person") {
    const personKey =
      typeof body.personKey === "string" ? body.personKey.trim() : "";
    const name = normalizeName(body.name);
    const requestedClass =
      typeof body.className === "string" ? body.className.trim() : "";
    if (!personKey.startsWith("__family_tree_person__:"))
      return json({ error: "Choose a family-tree-only person to edit." }, 400);
    if (name.length < 2 || name.length > 120)
      return json({ error: "Enter a full name between 2 and 120 characters." }, 400);
    if (body.className != null && typeof body.className !== "string")
      return json({ error: "Choose a valid class." }, 400);

    try {
      const supabase = await getFamilyTreePreviewSupabase();
      if (!supabase)
        return json({ error: "The preview database is not configured." }, 503);
      const [memberResult, personResult] = await Promise.all([
        supabase.from("members").select("current_class_number"),
        supabase
          .from("family_tree_people")
          .select("person_key")
          .eq("person_key", personKey)
          .maybeSingle(),
      ]);
      if (memberResult.error || personResult.error) {
        console.error(
          "Local family-tree person lookup failed:",
          memberResult.error || personResult.error,
        );
        return json({ error: "Could not load this family-tree-only person." }, 503);
      }
      if (!personResult.data)
        return json({ error: "This family-tree-only person no longer exists." }, 404);
      const availableClasses = new Map(
        (memberResult.data || [])
          .map((member) => String(member.current_class_number || "").trim())
          .filter((className) => className && normalizeClass(className) !== "theta")
          .map((className) => [normalizeClass(className), className]),
      );
      const className = requestedClass
        ? availableClasses.get(normalizeClass(requestedClass))
        : null;
      if (requestedClass && !className)
        return json({ error: "Choose a class from the available classes." }, 400);

      const { error } = await supabase
        .from("family_tree_people")
        .update({ name, class_name: className })
        .eq("person_key", personKey);
      if (error) {
        console.error("Local family-tree person update failed:", error);
        return json({ error: "Could not update this person." }, 500);
      }
      return json({
        person: {
          uniqname: personKey,
          name,
          current_class_number: className,
          isFamilyTreeOnly: true,
        },
      });
    } catch (error) {
      console.error("Could not update local family-tree person:", error);
      return json({ error: "Could not update this person." }, 500);
    }
  }

  if (body?.action === "update_member_class") {
    const memberKey =
      typeof body.memberKey === "string" ? body.memberKey.trim() : "";
    const requestedClass =
      typeof body.className === "string" ? body.className.trim() : "";
    if (
      !memberKey ||
      memberKey.startsWith("__family_tree_person__:") ||
      memberKey.length > 64
    ) {
      return json({ error: "Choose a ZProfile member to update." }, 400);
    }
    if (!requestedClass || requestedClass.length > 80)
      return json({ error: "Choose a class." }, 400);

    try {
      const supabase = await getFamilyTreePreviewSupabase();
      if (!supabase)
        return json({ error: "The preview database is not configured." }, 503);
      const [memberResult, classOrderResult, relationshipsResult] = await Promise.all([
        supabase
          .from("members")
          .select("uniqname, current_class_number")
          .eq("uniqname", memberKey)
          .maybeSingle(),
        supabase.from("class_order").select("class_name").order("id"),
        supabase
          .from("family_relationships")
          .select("big_uniqname, little_uniqname"),
      ]);
      if (memberResult.error || relationshipsResult.error) {
        console.error(
          "Local member class lookup failed:",
          memberResult.error || relationshipsResult.error,
        );
        return json({ error: "Could not load this member." }, 503);
      }
      if (!memberResult.data)
        return json({ error: "This ZProfile member no longer exists." }, 404);
      if (
        !(relationshipsResult.data || []).some(
          (edge) =>
            edge.big_uniqname === memberKey || edge.little_uniqname === memberKey,
        )
      )
        return json({ error: "This member is not connected to the family tree." }, 400);
      let classNames = (classOrderResult.error ? [] : classOrderResult.data || [])
        .map((row) => String(row.class_name || "").trim())
        .filter(Boolean);
      if (!classNames.length) {
        const rosterResult = await supabase
          .from("members")
          .select("current_class_number");
        if (rosterResult.error) {
          console.error("Local class list lookup failed:", rosterResult.error);
          return json({ error: "Could not load the available classes." }, 503);
        }
        classNames = (rosterResult.data || []).map((member) =>
          String(member.current_class_number || "").trim(),
        );
      }
      const availableClasses = new Map(
        classNames
          .filter((className) => className && normalizeClass(className) !== "theta")
          .map((className) => [normalizeClass(className), className]),
      );
      const className = availableClasses.get(normalizeClass(requestedClass));
      if (!className)
        return json({ error: "Choose a class from the available classes." }, 400);

      const { data: updatedMember, error } = await supabase
        .from("members")
        .update({ current_class_number: className })
        .eq("uniqname", memberKey)
        .select("uniqname, current_class_number")
        .maybeSingle();
      if (error) {
        console.error("Local member class update failed:", error);
        return json({ error: "Could not update this class." }, 500);
      }
      if (!updatedMember)
        return json({ error: "This member no longer exists." }, 404);
      return json({ member: updatedMember });
    } catch (error) {
      console.error("Could not update local member class:", error);
      return json({ error: "Could not update this class." }, 500);
    }
  }

  if (body?.action === "replace_relationship") {
    const oldBig =
      typeof body.old_big_uniqname === "string"
        ? body.old_big_uniqname.trim()
        : "";
    const oldLittle =
      typeof body.old_little_uniqname === "string"
        ? body.old_little_uniqname.trim()
        : "";
    const big =
      typeof body.big_uniqname === "string" ? body.big_uniqname.trim() : "";
    const little =
      typeof body.little_uniqname === "string"
        ? body.little_uniqname.trim()
        : "";
    if (
      [oldBig, oldLittle, big, little].some((id) => !id || id.length > 64) ||
      oldBig === oldLittle ||
      big === little
    ) {
      return json({ error: "Choose two different people." }, 400);
    }

    try {
      const supabase = await getFamilyTreePreviewSupabase();
      if (!supabase)
        return json({ error: "The preview database is not configured." }, 503);
      const [memberResult, familyTreePeopleResult, relationshipResult] =
        await Promise.all([
          supabase
            .from("members")
            .select("uniqname, current_class_number")
            .in("uniqname", [big, little]),
          supabase
            .from("family_tree_people")
            .select("person_key")
            .in("person_key", [big, little]),
          supabase
            .from("family_relationships")
            .select("big_uniqname, little_uniqname"),
        ]);
      if (
        memberResult.error ||
        familyTreePeopleResult.error ||
        relationshipResult.error
      ) {
        console.error(
          "Local family relationship replacement lookup failed:",
          memberResult.error ||
            familyTreePeopleResult.error ||
            relationshipResult.error,
        );
        return json({ error: "Could not load the local family tree." }, 503);
      }

      const validMembers = new Set(
        (memberResult.data || [])
          .filter(
            (member) =>
              String(member.current_class_number || "").trim().toLowerCase() !==
              "theta",
          )
          .map((member) => member.uniqname),
      );
      for (const person of familyTreePeopleResult.data || [])
        validMembers.add(person.person_key);
      if (!validMembers.has(big) || !validMembers.has(little))
        return json({ error: "A selected person no longer exists." }, 400);

      const relationships = relationshipResult.data || [];
      const oldExists = relationships.some(
        (edge) =>
          edge.big_uniqname === oldBig && edge.little_uniqname === oldLittle,
      );
      if (!oldExists)
        return json(
          { error: "This relationship no longer exists. Refresh and try again." },
          409,
        );
      if (oldBig === big && oldLittle === little)
        return json({ relationships });

      const remainingEdges = relationships.filter(
        (edge) =>
          edge.big_uniqname !== oldBig || edge.little_uniqname !== oldLittle,
      );
      if (
        remainingEdges.some(
          (edge) => edge.big_uniqname === big && edge.little_uniqname === little,
        )
      )
        return json({ error: "This relationship already exists." }, 409);
      if (wouldCreateCycle(remainingEdges, big, little))
        return json(
          { error: "This relationship would create a cycle." },
          409,
        );

      const replacement = await supabase
        .from("family_relationships")
        .update({ big_uniqname: big, little_uniqname: little })
        .eq("big_uniqname", oldBig)
        .eq("little_uniqname", oldLittle)
        .select("big_uniqname, little_uniqname")
        .maybeSingle();
      if (replacement.error) {
        if (replacement.error.code === "23505")
          return json({ error: "This relationship already exists." }, 409);
        console.error(
          "Local family relationship replacement failed:",
          replacement.error,
        );
        return json({ error: "Could not update this relationship." }, 500);
      }
      if (!replacement.data)
        return json(
          { error: "This relationship no longer exists. Refresh and try again." },
          409,
        );
      const result = await supabase
        .from("family_relationships")
        .select("big_uniqname, little_uniqname");
      if (result.error) {
        console.error(
          "Local family relationship refresh failed:",
          result.error,
        );
        return json({ error: "The relationship changed, but the tree could not refresh." }, 500);
      }
      return json({ relationships: result.data || [] });
    } catch (error) {
      console.error("Could not replace local family relationship:", error);
      return json({ error: "Could not update this relationship." }, 500);
    }
  }

  if (body?.action === "delete_person") {
    const personKey =
      typeof body.personKey === "string" ? body.personKey.trim() : "";
    if (!personKey.startsWith("__family_tree_person__:"))
      return json({ error: "Only a family-tree-only person can be deleted here." }, 400);

    try {
      const supabase = await getFamilyTreePreviewSupabase();
      if (!supabase)
        return json({ error: "The preview database is not configured." }, 503);
      const [memberResult, personResult] = await Promise.all([
        supabase
          .from("members")
          .select("uniqname")
          .eq("uniqname", personKey)
          .maybeSingle(),
        supabase
          .from("family_tree_people")
          .select("person_key")
          .eq("person_key", personKey)
          .maybeSingle(),
      ]);
      if (memberResult.error || personResult.error) {
        console.error(
          "Local family-tree person deletion lookup failed:",
          memberResult.error || personResult.error,
        );
        return json({ error: "Could not check this person." }, 503);
      }
      if (memberResult.data)
        return json({ error: "ZProfile member accounts cannot be deleted here." }, 400);
      if (!personResult.data)
        return json({ error: "This family-tree-only person no longer exists." }, 404);

      const relationshipDelete = await supabase
        .from("family_relationships")
        .delete()
        .or(`big_uniqname.eq.${personKey},little_uniqname.eq.${personKey}`);
      if (relationshipDelete.error) {
        console.error(
          "Local family-tree relationship deletion failed:",
          relationshipDelete.error,
        );
        return json({ error: "Could not remove this person's relationships." }, 500);
      }
      const personDelete = await supabase
        .from("family_tree_people")
        .delete()
        .eq("person_key", personKey);
      if (personDelete.error) {
        console.error("Local family-tree person deletion failed:", personDelete.error);
        return json({ error: "Could not delete this person." }, 500);
      }
      const relationshipResult = await supabase
        .from("family_relationships")
        .select("big_uniqname, little_uniqname");
      if (relationshipResult.error) {
        console.error(
          "Local family-tree refresh failed after person deletion:",
          relationshipResult.error,
        );
        return json({ error: "The person was deleted, but the tree could not refresh." }, 500);
      }
      return json({ success: true, relationships: relationshipResult.data || [] });
    } catch (error) {
      console.error("Could not delete local family-tree person:", error);
      return json({ error: "Could not delete this person." }, 500);
    }
  }

  const big =
    typeof body?.big_uniqname === "string" ? body.big_uniqname.trim() : "";
  const little =
    typeof body?.little_uniqname === "string"
      ? body.little_uniqname.trim()
      : "";
  const remove = body?.remove === true;
  if (
    !big ||
    !little ||
    big.length > 64 ||
    little.length > 64 ||
    big === little ||
    (body?.remove !== undefined && typeof body.remove !== "boolean")
  ) {
    return json({ error: "Choose two different members." }, 400);
  }

  try {
    const supabase = await getFamilyTreePreviewSupabase();
    if (!supabase)
      return json({ error: "The preview database is not configured." }, 503);

    const [memberResult, familyTreePeopleResult, relationshipResult] = await Promise.all([
      supabase
        .from("members")
        .select("uniqname, current_class_number")
        .in("uniqname", [big, little]),
      supabase
        .from("family_tree_people")
        .select("person_key")
        .in("person_key", [big, little]),
      supabase
        .from("family_relationships")
        .select("big_uniqname, little_uniqname"),
    ]);
    if (memberResult.error || familyTreePeopleResult.error || relationshipResult.error) {
      console.error(
        "Local family tree lookup failed:",
        memberResult.error || familyTreePeopleResult.error || relationshipResult.error,
      );
      return json({ error: "Could not load the local family tree." }, 503);
    }

    const validMembers = new Set(
      (memberResult.data || [])
        .filter(
          (member) =>
            String(member.current_class_number || "").trim().toLowerCase() !==
            "theta",
        )
        .map((member) => member.uniqname),
    );
    for (const person of familyTreePeopleResult.data || [])
      validMembers.add(person.person_key);
    if (!validMembers.has(big) || !validMembers.has(little))
      return json({ error: "A selected member no longer exists." }, 400);

    const relationships = relationshipResult.data || [];
    const exists = relationships.some(
      (edge) => edge.big_uniqname === big && edge.little_uniqname === little,
    );
    if (!remove && exists)
      return json({ error: "This relationship already exists." }, 409);
    if (!remove && wouldCreateCycle(relationships, big, little))
      return json(
        { error: "This relationship would create a cycle." },
        409,
      );

    const mutation = remove
      ? await supabase
          .from("family_relationships")
          .delete()
          .eq("big_uniqname", big)
          .eq("little_uniqname", little)
      : await supabase
          .from("family_relationships")
          .insert({ big_uniqname: big, little_uniqname: little });
    if (mutation.error) {
      console.error("Local family tree save failed:", mutation.error);
      return json({ error: "Could not save the local relationship." }, 500);
    }

    const result = await supabase
      .from("family_relationships")
      .select("big_uniqname, little_uniqname");
    if (result.error) {
      console.error("Local family tree refresh failed:", result.error);
      return json({ error: "The relationship saved, but could not refresh." }, 500);
    }
    return json({ relationships: result.data || [] });
  } catch (error) {
    console.error("Could not save local family-tree preview:", error);
    return json({ error: "Could not save the relationship." }, 500);
  }
}
