"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getIsAdmin, getUser } from "@/lib/supabase/helpers";

async function requireAdmin() {
  const user = await getUser();
  if (!user || !(await getIsAdmin())) redirect("/");
  return user;
}

function revalidateVenuePages(venueId: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/venues/${venueId}`);
}

export async function approveVenue(venueId: string) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("venues")
    .update({
      status: "approved",
      approved_by: admin.id,
      approved_at: new Date().toISOString(),
      rejected_by: null,
      rejected_at: null,
      rejection_note: null,
      hidden_reason: null,
    })
    .eq("id", venueId);
  revalidateVenuePages(venueId);
}

export async function rejectVenue(venueId: string, formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const note = ((formData.get("note") as string) ?? "").trim().slice(0, 500);
  await supabase
    .from("venues")
    .update({
      status: "rejected",
      rejected_by: admin.id,
      rejected_at: new Date().toISOString(),
      rejection_note: note || null,
      approved_by: null,
      approved_at: null,
      hidden_reason: null,
    })
    .eq("id", venueId);
  revalidateVenuePages(venueId);
}

/** Pull an approved venue back to pending (e.g. confirmed reports). */
export async function unpublishVenue(venueId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const reason = ((formData.get("reason") as string) ?? "")
    .trim()
    .slice(0, 500);
  await supabase
    .from("venues")
    .update({ status: "pending", hidden_reason: reason || "Under re-review" })
    .eq("id", venueId);
  revalidateVenuePages(venueId);
}

export async function resolveVenueReports(venueId: string) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("reports")
    .update({ status: "resolved" })
    .eq("venue_id", venueId)
    .eq("status", "open");
  revalidatePath("/admin");
}
