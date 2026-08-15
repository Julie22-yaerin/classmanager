"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { getUserProfile } from "@/lib/firestore/profile";
import LaurelAvatar from "@/components/LaurelAvatar";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    (async () => {
      const profile = await getUserProfile(user.uid);
      if (!profile?.onboardingComplete) {
        router.replace("/onboarding");
        return;
      }
      setCheckingOnboarding(false);
    })();
  }, [user, loading, router]);

  if (loading || !user || checkingOnboarding) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LaurelAvatar size={40} className="animate-pulse" />
      </div>
    );
  }

  return <>{children}</>;
}
