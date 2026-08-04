import { auth } from "@zomlab/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NotesView } from "@/features/core/crud/components/notes-view";

export const metadata = { title: "CRUD Demo — ZomLab" };

export default async function CrudDemoPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return <NotesView />;
}
