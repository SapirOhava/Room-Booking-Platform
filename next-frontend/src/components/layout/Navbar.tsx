import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight">
          RoomBooking
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/signin"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>

          <Link
            href="/register"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Register
          </Link>

          <Button asChild size="sm">
            <Link href="/search">Search</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
