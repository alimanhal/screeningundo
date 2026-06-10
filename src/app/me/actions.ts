"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateFavoriteTeam(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const raw = (formData.get("favorite_team") as string) || "";
  const favorite = /^[A-Z]{3}$/.test(raw) ? raw : null;


  
  await supabase
    .from("profiles")
    .upsert({ id: user.id, favorite_team: favorite });

  revalidatePath("/");
  revalidatePath("/me");
  revalidatePath("/matches");
}
