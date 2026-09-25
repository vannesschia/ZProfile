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
  return { next };
}

// Records `className` as the current class so the next import advances past it.
export async function setCurrentClass(supabase, className) {
  const { error } = await supabase
    .from("requirements")
    .update({ current_class: className })
    .eq("id", true);
  return error;
}
