import { getUser } from "@/lib/supabase/helpers";
import { SiteHeaderNav } from "./site-header-nav";

export async function SiteHeader() {
  const user = await getUser();

  return <SiteHeaderNav isLoggedIn={!!user} />;
}
