"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginUrl } from "@/lib/auth/redirect";
import type { Database } from "@/types/database";

type ReportReason = Database["public"]["Tables"]["reports"]["Row"]["reason"];

export async function toggleVote(venueId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(loginUrl(`/venues/${venueId}`));

  const { data: existing } = await supabase
    .from("votes")
    .select("venue_id")
    .eq("venue_id", venueId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("votes")
      .delete()
      .eq("venue_id", venueId)
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("votes")
      .insert({ venue_id: venueId, user_id: user.id });
  }

  revalidatePath(`/venues/${venueId}`);
  revalidatePath("/");
}

export async function submitReport(
  venueId: string,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(loginUrl(`/venues/${venueId}`));

  const reason = formData.get("reason") as ReportReason;
  const details = ((formData.get("details") as string) ?? "").trim();
  const validReasons: ReportReason[] = [
    "outdated",
    "wrong_info",
    "closed",
    "inappropriate",
    "other",
  ];
  if (!validReasons.includes(reason)) {
    return { ok: false, message: "Pick a reason for the report." };
  }

  const { error } = await supabase.from("reports").insert({
    id: crypto.randomUUID(),
    venue_id: venueId,
    user_id: user.id,
    reason,
    details: details.slice(0, 500),
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "You already reported this venue." };
    }
    return { ok: false, message: "Could not submit the report. Try again." };
  }

  revalidatePath(`/venues/${venueId}`);
  return {
    ok: true,
    message: "Thanks — the report has been recorded.",
  };
}
