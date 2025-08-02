'use server'

import { getServerClient } from "@/lib/supabaseServer";

export async function getMembers() {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from('members')
    .select('uniqname, name, role')
    .order('name')
  if (error) throw error;
  return data;
}

export async function getPledges() {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from('members')
    .select('uniqname, name')
    .order('name')
    .eq('role', 'pledge')
  if (error) throw error;
  return data;
}