export const GREEK_LETTERS = [
  "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta",
  "Iota", "Kappa", "Lambda", "Mu", "Nu", "Xi", "Omicron", "Pi",
  "Rho", "Sigma", "Tau", "Upsilon", "Phi", "Chi", "Psi", "Omega",
];

// Class name for the nth class (0-indexed): Alpha..Omega, then Alpha Alpha,
// Alpha Beta, ..., Omega Omega.
export function classNameAt(index) {
  const n = GREEK_LETTERS.length;
  if (index < n) return GREEK_LETTERS[index];
  const i = index - n;
  return `${GREEK_LETTERS[Math.floor(i / n) % n]} ${GREEK_LETTERS[i % n]}`;
}

export function classIndex(className) {
  const name = (className || "").trim().toLowerCase();
  for (let i = 0; i < GREEK_LETTERS.length * (GREEK_LETTERS.length + 1); ++i) {
    if (classNameAt(i).toLowerCase() === name) return i;
  }
  return -1;
}

export function nextClassName(currentClass) {
  const i = classIndex(currentClass);
  return i === -1 ? null : classNameAt(i + 1);
}

// Every class from Alpha through `currentClass`, inclusive.
export function classesThrough(currentClass) {
  const i = classIndex(currentClass);
  return Array.from({ length: i + 1 }, (_, k) => classNameAt(k));
}

// Reads requirements.current_class and returns the class that follows it.
export async function getNextClass(supabase) {
  const { data, error } = await supabase
    .from("requirements")
    .select("current_class")
    .single();

  if (error) return { error };

  const next = nextClassName(data.current_class);
  if (!next) {
    return { error: new Error(`Unrecognized current class "${data.current_class}".`) };
  }
  return { next, current: data.current_class };
}

// members.current_class_number and requirements.current_class are foreign keys
// to class_order, so a class must have a row there before anyone is put in it.
// get_attendance_requirements subtracts class_order ids to tell how many classes
// apart two classes are, so the new row's id must be exactly one past the
// previous class's id.
export async function ensureClassExists(supabase, className, previousClass) {
  const { data: rows, error } = await supabase
    .from("class_order")
    .select("id, class_name")
    .in("class_name", [className, previousClass]);
  if (error) return error;

  if (rows.some((r) => r.class_name === className)) return null;

  const previous = rows.find((r) => r.class_name === previousClass);
  if (!previous) return new Error(`Class "${previousClass}" is missing from class_order.`);

  const { error: insertError } = await supabase
    .from("class_order")
    .insert({ id: previous.id + 1, class_name: className });
  return insertError;
}

// Records `className` as the current class so the next import advances past it.
export async function setCurrentClass(supabase, className) {
  const { error } = await supabase
    .from("requirements")
    .update({ current_class: className })
    .eq("id", true);
  return error;
}
