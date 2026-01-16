async function getNextClass(supabase) {
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
  return nextClassLetter;
}

export async function getActiveRushees(supabase) {
  const { data, error } = await supabase
    .from("rushees")
    .select('*')
    .eq("cut_status", "active");
  if (error) console.error(error);
  return data;
}

export async function setRusheeToPledges(supabase) {
  const nextClassLetter = await getNextClass(supabase)
  const { data, error } = await supabase.rpc('promote_rushees_to_pledges', {next_class: nextClassLetter})
  return error;
}