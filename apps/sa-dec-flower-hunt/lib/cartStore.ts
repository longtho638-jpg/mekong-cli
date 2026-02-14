import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  getSafeItems: () => CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      // Safe getter that ALWAYS filters out null/undefined items
      getSafeItems: () => {
        const state = get();
        return (state.items || []).filter((item: any) => item && item.id && item.name);
      },

      addItem: (item: Omit<CartItem, 'quantity'>) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((i) => i.id === item.id);

        if (existingItem) {
          set({
            items: currentItems.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({ items: [...currentItems, { ...item, quantity: 1 }] });
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },
      updateQuantity: (id, delta) => {
        const currentItems = get().items;
        const updatedItems = currentItems.map((item) => {
          if (item.id === id) {
            return { ...item, quantity: Math.max(1, item.quantity + delta) };
          }
          return item;
        });
        set({ items: updatedItems });
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().getSafeItems().reduce((total, item) => total + item.price * item.quantity, 0);
      },
      itemCount: () => {
        return get().getSafeItems().reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'sadec-cart-storage',
      storage: createJSONStorage(() => localStorage), // Explicitly use createJSONStorage
      skipHydration: true, // Important for Next.js SSR to avoid hydration mismatch
      merge: (persistedState: any, currentState) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return currentState;
        }
        // Sanitize items ensuring they are valid objects with ids
        const sanitizedItems = (persistedState.items || []).filter((i: any) => i && i.id && i.name);

        return {
          ...currentState,
          ...persistedState,
          items: sanitizedItems,
        };
      },
    }
  )
);