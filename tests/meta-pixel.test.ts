import { describe, expect, test } from "bun:test";
import {
  addToCartPayload,
  initiateCheckoutPayload,
  isApprovedPurchase,
  purchasePayload,
  viewContentPayload,
} from "../src/lib/meta-pixel";
import type { CartItem, Product } from "../src/types/product";

const product: Product = {
  id: "prod-daily",
  name: "Conjunto Daily Coffee",
  slug: "conjunto-daily-coffee",
  description: "",
  shortDescription: "",
  price: 313.11,
  images: [],
  category: "conjuntos",
  variants: [],
  benefits: [],
  rating: 5,
  reviewCount: 0,
  createdAt: "2026-01-01",
};

const cartItem: CartItem = {
  product,
  variant: { id: "variant-p", size: "P", color: "Coffee", colorHex: "#000000", stock: 5, sku: "DAILY-P" },
  quantity: 2,
};

describe("Meta Pixel event rules", () => {
  test("ViewContent sends product id, name, category and BRL price", () => {
    expect(viewContentPayload(product)).toEqual({
      content_name: "Conjunto Daily Coffee",
      content_category: "conjuntos",
      content_ids: ["prod-daily"],
      content_type: "product",
      value: 313.11,
      currency: "BRL",
    });
  });

  test("AddToCart uses the quantity actually added and its BRL value", () => {
    expect(addToCartPayload(product, 2)).toEqual({
      content_name: "Conjunto Daily Coffee",
      content_category: "conjuntos",
      content_ids: ["prod-daily"],
      content_type: "product",
      contents: [{ id: "prod-daily", quantity: 2, item_price: 313.11 }],
      value: 626.22,
      currency: "BRL",
    });
  });

  test("InitiateCheckout aggregates units and preserves the current payable total", () => {
    expect(initiateCheckoutPayload([cartItem], 586.22)).toEqual({
      content_ids: ["prod-daily"],
      content_type: "product",
      contents: [{ id: "prod-daily", quantity: 2, item_price: 313.11 }],
      num_items: 2,
      value: 586.22,
      currency: "BRL",
    });
  });

  test("Purchase uses the approved order total in BRL", () => {
    expect(purchasePayload(586.225)).toEqual({
      content_type: "product",
      value: 586.23,
      currency: "BRL",
    });
  });

  test("approved payment is eligible for Purchase", () => {
    expect(isApprovedPurchase("approved")).toBe(true);
  });

  test("pending, rejected and refunded payments never count as Purchase", () => {
    expect(isApprovedPurchase("pending")).toBe(false);
    expect(isApprovedPurchase("rejected")).toBe(false);
    expect(isApprovedPurchase("refunded")).toBe(false);
  });
});
