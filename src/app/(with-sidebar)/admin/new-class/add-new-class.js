"use server";

import { getServerClient } from "@/lib/supabaseServer";

export async function addNewClass(values) {
  const supabase = await getServerClient();

  const { data: currentClassLetterData, error: currentClassLetterError } =
    await supabase
      .from("requirements")
      .select("current_class")
      .single();

  const currentClassLetter = currentClassLetterData.current_class;

  if (currentClassLetterError) {
    console.error("Failed to fetch current class letter.");
    return currentClassLetterError;
  }

  const { data: classLettersTable, error: classLettersTableError } =
    await supabase
      .from("class_order")
      .select("class_name");

  if (classLettersTableError) {
    console.error("Failed to fetch class letters table.");
    return classLettersTableError;
  }

  const classLetters = classLettersTable.map(l => l.class_name);

  let nextClassLetter = "";

  for (let i = 0; i < classLetters.length; ++i) {
    if (classLetters[i] === currentClassLetter && i !== classLetters.length - 1) {
      nextClassLetter = classLetters[i + 1];
      break;
    }
  }

  if (nextClassLetter === "") {
    console.error("Failed to fetch next class letter.");
    return 1;
  }

  const { error: insertError } =
    await supabase
      .from("members")
      .insert(
        values.map(member => ({
          uniqname: member.uniqname,
          name: member.name,
          email_address: `${member.uniqname}@umich.edu`,
          current_class_number: nextClassLetter,
          role: "pledge",
          active: true,
          admin: false
        }))
      );

  const { error: updateClassLetterError } =
    await supabase
      .from("requirements")
      .update({ current_class: nextClassLetter })
      .eq("id", true)

  if (updateClassLetterError) {
    console.error("Failed to update class letter.");
    return updateClassLetterError;
  }

  return insertError;
}