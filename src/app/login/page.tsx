import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { FootballLoader } from "@/components/ui/football-loader";

export const metadata: Metadata = {
  title: "Sign in — WC26 Screenings",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <FootballLoader variant="roll" size="md" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
