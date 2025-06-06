import { handleSupabaseAuth } from "@supabase/auth-helpers-nextjs";

export const GET = handleSupabaseAuth({ logout: false });
export const POST = handleSupabaseAuth({ logout: false });