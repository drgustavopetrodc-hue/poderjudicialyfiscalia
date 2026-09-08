"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import { useEffect } from "react";

function SessionTabGuard() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    const sessionKey = "sesion-discord-activa";
    if (!window.sessionStorage.getItem(sessionKey)) {
      void signOut({ callbackUrl: "/login" });
      return;
    }

  }, [status]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider><SessionTabGuard />{children}</SessionProvider>;
}
