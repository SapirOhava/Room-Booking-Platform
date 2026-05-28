import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NavbarLogoutButton } from '@/components/layout/NavbarLogoutButton';

export async function Navbar() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  let user = null;
  if (token) {
    try {
      const res = await fetch(`${process.env.API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store', // always fresh — don't cache auth state
      });
      if (res.ok) user = await res.json();
    } catch {}
  }

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight">
          RoomBooking
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">
                Hello, {user.fullName}
              </span>
              <Link
                href="/favorites"
                className="text-xl leading-none"
                aria-label="My favorites"
              >
                🤍
              </Link>
              <NavbarLogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
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
            </>
          )}
          <Button asChild size="sm">
            <Link href="/search">Search</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
