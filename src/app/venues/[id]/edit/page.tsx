import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/helpers";
import { loginUrl } from "@/lib/auth/redirect";
import { EditForm } from "./edit-form";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: venue } = await supabase
    .from("venues")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  if (!venue) return { title: "Venue not found" };
  return { title: `Edit ${venue.name}` };
}

export default async function EditVenuePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getUser();

  if (!user) redirect(loginUrl(`/venues/${id}/edit`));

  const { data: venue } = await supabase
    .from("venues")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!venue) notFound();

  if (venue.created_by !== user.id) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="display text-2xl text-ink">Not your venue</h1>
        <p className="mt-2 text-sm text-ink-soft">
          You can only edit venues you created.
        </p>
      </main>
    );
  }

  const [{ data: matches }, { data: teams }] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff_utc"),
    supabase.from("teams").select("*").order("name"),
  ]);

  let screenedMatchIds: number[] = [];
  if (!venue.screens_all_matches) {
    const { data: vm } = await supabase
      .from("venue_matches")
      .select("match_id")
      .eq("venue_id", venue.id);
    screenedMatchIds = (vm ?? []).map((r) => r.match_id);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-deep">
        Edit
      </p>
      <h1 className="display text-2xl text-ink sm:text-3xl">Edit venue</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Update the details for {venue.name}.
      </p>
      <div className="rule my-6" />
      <EditForm
        venue={venue}
        matches={matches ?? []}
        teams={teams ?? []}
        screenedMatchIds={screenedMatchIds}
      />
    </main>
  );
}
