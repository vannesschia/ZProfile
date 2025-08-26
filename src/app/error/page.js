"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ErrorPage({ error, reset }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 m-auto text-center p-8">
      <p className="text-3xl md:text-7xl font-bold">Something went wrong!</p>
      <p className="text-sm md:text-base text-center text-foreground">
        Please report this bug through our dedicated form below, or reach out to our developers.
      </p>
      <Button onClick={() => router.push("/support")}>
        Report Bug
      </Button>
    </div>
  );
}