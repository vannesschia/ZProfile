import { getServerClient } from "@/lib/supabaseServer";

export async function GET(req, { params }) {
  const supabase = await getServerClient();
}
