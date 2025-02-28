import { useState } from 'react';

export function useAdmin() {
  // Always return true for admin status since we simplified the role system
  const [isAdmin] = useState(true);
  const [loading] = useState(false);
  const [error] = useState<Error | null>(null);

  return { isAdmin, loading, error };
}