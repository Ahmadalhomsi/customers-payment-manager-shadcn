"use client";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cva } from "class-variance-authority";

const themeSwitchVariants = cva(
  "rounded-full hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
  // ... rest of the variant config
);

export function ThemeSwitch() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={themeSwitchVariants()}
      onClick={() => {
        if (theme === "dark") {
          setTheme("light");
        } else if (theme === "light") {
          setTheme("system");
        } else {
          setTheme("dark");
        }
      }}
    >
      {theme === "dark" ? (
        <Moon className="h-5 w-5 transition-all" />
      ) : theme === "light" ? (
        <Sun className="h-5 w-5 transition-all" />
      ) : (
        <Monitor className="h-5 w-5 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}