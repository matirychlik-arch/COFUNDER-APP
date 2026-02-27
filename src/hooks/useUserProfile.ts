"use client";

import { useState, useEffect, useCallback } from "react";
import type { UserProfile } from "@/types";
import { getUserProfile, saveUserProfile, updateUserProfile } from "@/lib/storage";

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const p = getUserProfile();
    setProfile(p);
    setIsLoaded(true);
  }, []);

  const save = useCallback((p: UserProfile) => {
    saveUserProfile(p);
    setProfile(p);
  }, []);

  const update = useCallback((updates: Partial<UserProfile>) => {
    updateUserProfile(updates);
    setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  return { profile, isLoaded, save, update };
}
