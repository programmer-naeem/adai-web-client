"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { readSession } from "@/lib/session";

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(readSession() ? "/dashboard" : "/login");
  }, [router]);
  return null;
}
