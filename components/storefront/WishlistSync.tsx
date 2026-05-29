"use client";

import { useEffect, useRef } from "react";
import { useWishlistStore } from "@/stores/wishlist";
import { syncWishlistAction } from "@/lib/actions/account";

export function WishlistSync() {
  const items = useWishlistStore((s) => s.items);
  const setItems = useWishlistStore((s) => s.setItems);
  const synced = useRef(false);

  useEffect(() => {
    if (synced.current) return;
    synced.current = true;

    syncWishlistAction(items)
      .then(({ ids }) => setItems(ids))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
