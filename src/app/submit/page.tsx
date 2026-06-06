import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SubmitForm } from "./submit-form";

export const metadata: Metadata = {
  title: "Add a screening venue",
};

export default async function SubmitPage() {
  const supabase = await createClient();
  const [{ data: matches }, { data: teams }] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff_utc"),
    supabase.from("teams").select("*").order("name"),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="display text-2xl text-ink">Add a screening venue</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Know a fan zone, pub or plaza showing the matches? Add it below —
        submissions are reviewed before they appear publicly.
      </p>
      <div className="bauhaus-rule my-6" />
      <SubmitForm matches={matches ?? []} teams={teams ?? []} />
    </main>
  );
}
