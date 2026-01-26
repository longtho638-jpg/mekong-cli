import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-6 max-w-2xl px-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Antigravity Auth PRO
        </h1>
        <p className="text-lg text-muted-foreground">
          Enterprise-grade authentication system with MFA, Multi-Tenancy, and
          Advanced Security features. Built for Next.js and Supabase.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/auth/signin">
            <Button size="lg">Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button variant="outline" size="lg">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
