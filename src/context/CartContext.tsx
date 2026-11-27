import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { Product, ProductVariant, CartItem } from "@/types/product";

import { useBlackWeek } from './BlackWeekContext';
import { campaignItem, setPairDiscount, needsCouponConfirmation } from '../../supabase/functions/_shared/blackweek';
import { trackMetaAddToCart } from "@/lib/meta-pixel";
export interface AppliedCoupon { code: string; discount_type: 'percentage' | 'fixed'; discount_value: number }

const CART_STORAGE_KEY = "vitz-cart";

const loadCartFromStorage = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading cart from storage:", error);
  }
  return [];
};

interface CartContextType {
  appliedCoupon: AppliedCoupon | null;
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
  pendingCoupon: AppliedCoupon | null;
  confirmCoupon: () => void;
  cancelCoupon: () => void;
  blackWeekDiscount: number;
  items: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantity?: number, colorImage?: string) => void;
  removeFromCart: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => loadCartFromStorage());
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { active, preview } = useBlackWeek();
  const [appliedCoupon, saveCoupon] = useState<AppliedCoupon | null>(null);
  const [pendingCoupon, setPendingCoupon] = useState<AppliedCoupon | null>(null);
  const campaignItems = items.map(item => campaignItem(item.product.price, item.quantity, item.product.category, item.product.name));
  const requiresChoice = needsCouponConfirmation(campaignItems, active || preview);
  const previouslyRequired = useRef(requiresChoice);
  useEffect(() => {
    if (requiresChoice && !previouslyRequired.current && appliedCoupon) {
      setPendingCoupon(appliedCoupon);
      saveCoupon(null);
    }
    previouslyRequired.current = requiresChoice;
  }, [requiresChoice, appliedCoupon]);
  const setAppliedCoupon = (coupon: AppliedCoupon | null) => {
    if (coupon && requiresChoice && coupon.code !== appliedCoupon?.code) setPendingCoupon(coupon);
    else { saveCoupon(coupon); setPendingCoupon(null); }
  };
  const confirmCoupon = () => { saveCoupon(pendingCoupon); setPendingCoupon(null); };
  const cancelCoupon = () => { saveCoupon(null); setPendingCoupon(null); };
  const blackWeekDiscount = setPairDiscount(campaignItems, active || preview, Boolean(appliedCoupon));

  // Persist cart to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Error saving cart to storage:", error);
    }
  }, [items]);

  const addToCart = useCallback((product: Product, variant: ProductVariant, quantity = 1, colorImage?: string) => {
    const maxStock = variant.stock;
    const currentQuantity = items.find(
      (item) => item.product.id === product.id && item.variant.id === variant.id
    )?.quantity ?? 0;
    const addedQuantity = Math.max(0, Math.min(quantity, maxStock - currentQuantity));

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.variant.id === variant.id
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const currentQty = updated[existingIndex].quantity;
        const newQty = Math.min(currentQty + quantity, maxStock);
        updated[existingIndex].quantity = newQty;
        if (colorImage) updated[existingIndex].colorImage = colorImage;
        return updated;
      }

      const cappedQuantity = Math.min(quantity, maxStock);
      return [...prev, { product, variant, quantity: cappedQuantity, colorImage }];
    });
    setIsCartOpen(true);
    if (addedQuantity > 0) void trackMetaAddToCart(product, addedQuantity);
  }, [items]);

  const removeFromCart = useCallback((productId: string, variantId: string) => {
    setItems((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && item.variant.id === variantId)
      )
    );
  }, []);

  const updateQuantity = useCallback((productId: string, variantId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId, variantId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId && item.variant.id === variantId) {
          const maxStock = item.variant.stock;
          const cappedQuantity = Math.min(quantity, maxStock);
          return { ...item, quantity: cappedQuantity };
        }
        return item;
      })
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  }, [items]);

  const getCartCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        appliedCoupon, setAppliedCoupon, pendingCoupon, confirmCoupon, cancelCoupon, blackWeekDiscount,
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
