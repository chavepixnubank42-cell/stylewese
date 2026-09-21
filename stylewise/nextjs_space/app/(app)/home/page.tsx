import { auth } from "@/auth";
import { HomeClient } from "./_components/home-client";

export default async function HomePage() {
  const session = await auth();
  return <HomeClient userName={session?.user?.name ?? null} />;
}
