"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface SupabaseUser {
  id: string;
  name: string;
  email: string;
  loyalty_points: number;
}

export function useSupabaseUser() {
  const [user, setUser] = useState<SupabaseUser | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async (userId: string | undefined) => {
      if (!userId) { setUser(null); return; }
      const { data } = await supabase
        .from("users")
        .select("id, name, email, loyalty_points")
        .eq("id", userId)
        .single();
      setUser(data as SupabaseUser | null);
    };

    supabase.auth.getUser().then(({ data }) => {
      loadUser(data.user?.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      loadUser(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  return user;
}
