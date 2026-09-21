import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LandingClient } from "./_components/landing-client";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/home");
  return <LandingClient />;
}
