"use client";

import { Button } from "@zomlab/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zomlab/ui/components/dropdown-menu";
import {
  resolveThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@zomlab/ui/lib/preferences";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";

const THEME_OPTIONS = [
  { icon: SunIcon, label: "Light", value: "light" },
  { icon: MoonIcon, label: "Dark", value: "dark" },
  { icon: MonitorIcon, label: "System", value: "system" },
] as const;

function readPreference(): ThemePreference {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

function applyPreference(preference: ThemePreference, systemPrefersDark: boolean) {
  const resolved = resolveThemePreference(preference, systemPrefersDark);
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(resolved);
  document.documentElement.style.colorScheme = resolved;
}

export function ThemeControl() {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const storedPreference = readPreference();
    setPreference(storedPreference);
    setHydrated(true);
    applyPreference(storedPreference, media.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      if (readPreference() === "system") applyPreference("system", event.matches);
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  function updatePreference(nextPreference: ThemePreference) {
    localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
    setPreference(nextPreference);
    applyPreference(nextPreference, window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  const SelectedIcon =
    THEME_OPTIONS.find((option) => option.value === preference)?.icon ?? MonitorIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          static
          disabled={!hydrated}
          aria-label="Change theme"
          title="Change theme"
        >
          <SelectedIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-44">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={preference}
          onValueChange={(value) => {
            if (value === "light" || value === "dark" || value === "system") {
              updatePreference(value);
            }
          }}
        >
          {THEME_OPTIONS.map(({ icon: Icon, label, value }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
