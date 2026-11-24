"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/signup");
  }, [router]);
  return null;
}
