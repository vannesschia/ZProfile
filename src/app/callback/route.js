import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get("next") || "/";
  if (!next.startsWith("/")) {
    // if "next" is not a relative URL, use the default
    next = "/";
  }

  if (code) {
    const supabase = await getServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user?.email) {
        console.log("Second getUser error:", userError?.message);
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
      }

      console.log(user)
      const email = user.email;
      const domain = email.split("@")[1];
      if (domain != "umich.edu"){
        console.error('Please use their umich email');
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      const uniqname = email.split("@")[0];

      const { data: existingMember, error: fetchError } = await supabase
        .from('members')
        .select('email_address')
        .eq('uniqname', uniqname)
        .not('email_address', 'is', null)
        .neq('email_address', '');
      
      console.log(existingMember)

      if (error) {
        console.error('Error querying members:', error);
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
      } else if (existingMember.length === 0) {
        console.log(`${uniqname} does not have a filled email_address. Creating new account...`);
        const fullName = user.user_metadata?.full_name || uniqname;
        const { error: insertError } = await supabase.from("members").insert({
          uniqname,
          name: fullName,
          email_address: email,
        });

        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}/profile`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}/profile`);
        } else {
          return NextResponse.redirect(`${origin}/profile`);
        }
      } else {
        // data is an array of rows; if names are unique, you’ll get at most one row
        const saved_email = existingMember[0].email_address;
        console.log(saved_email)
        if (saved_email === email) {
          if (isLocalEnv) {
            return NextResponse.redirect(`${origin}${next}`);
          } else if (forwardedHost) {
            return NextResponse.redirect(`https://${forwardedHost}${next}`);
          } else {
            return NextResponse.redirect(`${origin}${next}`);
          }
        } else {
          console.error(`${uniqname} alredy has an email listed as: ${saved_email}`);
          return NextResponse.redirect(`${origin}/auth/auth-code-error`);
        }
      }
    }
  }
  console.log("help")
  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
