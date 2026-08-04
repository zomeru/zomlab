import { auth } from "@zomlab/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NoteDetail } from "@/features/core/crud/components/note-detail";

export const metadata = { title: "CRUD Demo — ZomLab" };

export default async function CrudDemoNotePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  return <NoteDetail id={id} />;
}
