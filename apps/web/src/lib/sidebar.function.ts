import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { parseSidebarPreference } from "@zomlab/ui/lib/preferences";

export const getSidebarPreference = createServerFn({ method: "GET" }).handler(() =>
  parseSidebarPreference(getRequestHeader("cookie")),
);
