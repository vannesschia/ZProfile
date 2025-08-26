"use client";

import { GalleryVerticalEnd } from "lucide-react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supbaseClient";
import { Button } from "../components/ui/button";

export default function LoginPage() {
  const supabase = getBrowserClient();
  const router = useRouter();

  // Google OAuth
  async function handleGoogleSignIn() {
    console.log(`${window.location.origin}/callback`);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/sign-in?next=/dashboard`,
      },
    });
    if (error) {
      console.log(error)
    }
  }

  return (
    <>
      <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-6">
            <form>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-2">
                  <a
                    href="#"
                    className="flex flex-col items-center gap-2 font-medium"
                  >
                    <div className="flex size-8 items-center justify-center rounded-md">
                      <GalleryVerticalEnd className="size-6" />
                    </div>
                    <span className="sr-only">ZProfiles</span>
                  </a>
                  <h1 className="text-xl font-bold">Welcome to ZProfiles</h1>
                  {/* <div className="text-center text-sm">
                    Don&apos;t have an account?{" "}
                    <a href="#" className="underline underline-offset-4">
                      Sign up
                    </a>
                  </div> */}
                </div>
                <div className="flex flex-col gap-2 text-center">
                  <Button type="button" className="w-full" onClick={handleGoogleSignIn}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                      />
                    </svg>
                    Sign in
                  </Button>
                  <p className="text-muted-foreground text-sm">Please sign in with your umich email.</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
