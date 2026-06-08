import { getIsAdmin, getUser } from "@/lib/supabase/helpers";
import { SiteHeaderNav } from "./site-header-nav";

export async function SiteHeader() {
  const user = await getUser();
  const isAdmin = user ? await getIsAdmin() : false;

  return <SiteHeaderNav isLoggedIn={!!user} isAdmin={isAdmin} />;
}
