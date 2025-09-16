'use client'

import { Button } from "@/components/ui/button";
import { SunMoon } from "lucide-react";
import { useTheme } from "next-themes";

export default function ChangeThemeButton() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      onClick={() => resolvedTheme === "light" ? setTheme("dark") : setTheme("light")}
    >
      <SunMoon className="w-4 h-4" />
    </Button>
  )
}