import { getServerClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const supabase = await getServerClient();
    const {data: majors, error} = await supabase
      .from('majors_minors')
      .select('program_name')
      .order('program_name');

    if (error) {
      throw error;
    }

    return NextResponse.json(majors.map(m => m.program_name));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
