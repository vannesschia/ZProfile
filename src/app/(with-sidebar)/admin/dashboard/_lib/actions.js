"use server";

import { getServerClient } from "@/lib/supabaseServer";

/**
 * Update coffee_chat_offset for a specific member
 * @param {string} uniqname - The uniqname of the member
 * @param {number} offset - The offset value to set (can be positive or negative)
 * @returns {Promise<{error: Error | null}>}
 */
export async function updateCoffeeChatOffset(uniqname, offset) {
  const supabase = await getServerClient();
  
  // Validate offset is a number
  const offsetValue = Number(offset);
  if (isNaN(offsetValue)) {
    return { error: new Error("Invalid offset value") };
  }

  const { error } = await supabase
    .from('members')
    .update({ coffee_chat_offset: offsetValue })
    .eq('uniqname', uniqname);

  if (error) {
    console.error("Error updating coffee_chat_offset:", error);
    return { error };
  }

  return { error: null };
}
