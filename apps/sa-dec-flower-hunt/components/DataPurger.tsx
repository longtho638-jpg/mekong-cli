"use client";

import { useEffect } from "react";

export function DataPurger() {
    useEffect(() => {
        try {
            // 1. Purge Cart Storage if corrupt
            const cartRaw = localStorage.getItem("sadec-cart-storage");
            if (cartRaw) {
                const cart = JSON.parse(cartRaw);
                if (cart && cart.state && Array.isArray(cart.state.items)) {
                    // Check for NULL objects OR objects with missing critical properties (name)
                    const hasCorruption = cart.state.items.some((i: any) =>
                        !i ||
                        !i.name ||
                        i.name === null ||
                        i.price === null
                    );

                    if (hasCorruption) {
                        console.error("DataPurger: Found CORRUPTED items (null or missing name). PURGING.");
                        localStorage.removeItem("sadec-cart-storage");
                        window.location.reload();
                    }
                }
            }

            // 2. Purge Wishlist if corrupt
            const wishlistRaw = localStorage.getItem("sadec_wishlist");
            if (wishlistRaw) {
                const wishlist = JSON.parse(wishlistRaw);
                if (Array.isArray(wishlist)) {
                    const hasNulls = wishlist.some((i: any) => i === null || i === undefined);
                    if (hasNulls) {
                        console.error("DataPurger: Found null items in wishlist. PURGING.");
                        localStorage.removeItem("sadec_wishlist");
                        window.location.reload();
                    }
                }
            }

        } catch (e) {
            console.error("DataPurger error:", e);
            // If JSON parse fails, data is definitely corrupt. Wipe it.
            localStorage.removeItem("sadec-cart-storage");
            localStorage.removeItem("sadec_wishlist");
            window.location.reload();
        }
    }, []);

    return null;
}
