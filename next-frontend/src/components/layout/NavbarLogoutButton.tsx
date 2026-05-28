'use client';

import { useRouter } from 'next/navigation';
import api from '@/app/api/axios';
import { Button } from '@/components/ui/button';

export function NavbarLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await api.post('/auth/logout');
    router.refresh(); // re-renders server components including Navbar
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout}>
      Logout
    </Button>
  );
}
