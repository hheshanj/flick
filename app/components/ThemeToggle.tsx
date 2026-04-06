"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="fixed top-4 right-4 p-2 rounded-full bg-black/10 dark:bg-white/10 text-gray-900 dark:text-gray-100 hover:bg-black/20 dark:hover:bg-white/20 transition-all border border-transparent dark:border-white/10 z-50">
        <div className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="fixed top-4 right-4 p-2 rounded-full bg-black/5 dark:bg-white/10 text-gray-900 dark:text-gray-100 hover:bg-black/10 dark:hover:bg-white/20 transition-all border border-black/10 dark:border-white/10 shadow-sm z-50 group hover:shadow-md"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 dark:hidden block group-hover:scale-110 transition-transform" />
      <Moon className="h-5 w-5 hidden dark:block group-hover:scale-110 transition-transform" />
    </button>
  );
}
