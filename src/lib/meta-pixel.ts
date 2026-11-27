import type { CartItem, Product } from "../types/product";
import { canTrack } from "./consent";

export const META_PIXEL_ID = "1707492460744293";
const PURCHASE_STORAGE_KEY = "vitz-meta-purchases";

type MetaEventParameters = Record<string, unknown>;

type MetaFbq = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded: boolean;
  version: string;
  push: MetaFbq;
};

declare global {
  interface Window {
    fbq?: MetaFbq;
    _fbq?: MetaFbq;
  }
}

let initialized = false;
let initializing: Promise<MetaFbq | null> | null = null;
let lastPageViewKey: string | null = null;
const pendingPageViews = new Map<string, Promise<boolean>>();
const pendingPurchases = new Map<string, Promise<boolean>>();

function getFbq(): MetaFbq {
  if (window.fbq) return window.fbq;
  if (window._fbq) {
    window.fbq = window._fbq;
    return window._fbq;
  }

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
    else fbq.queue.push(args);
  } as MetaFbq;

  fbq.queue = [];
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  window.fbq = fbq;
  window._fbq = fbq;
  return fbq;
}

function loadPixelScript() {
  if (document.getElementById("meta-pixel-script")) return;
  const script = document.createElement("script");
  script.id = "meta-pixel-script";
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  const firstScript = document.getElementsByTagName("script")[0];
  if (firstScript?.parentNode) firstScript.parentNode.insertBefore(script, firstScript);
  else document.head.appendChild(script);
}

async function ensureMetaPixel(): Promise<MetaFbq | null> {
  const permitted = await canTrack("advertising");
  if (!permitted) {
    if (initialized) window.fbq?.("consent", "revoke");
    return null;
  }

  if (initialized) {
    const fbq = getFbq();
    fbq("consent", "grant");
    return fbq;
  }

  if (!initializing) {
    initializing = (async () => {
      const latestPermission = await canTrack("advertising");
      if (!latestPermission) return null;
      const fbq = getFbq();
      loadPixelScript();
      // No advanced matching or automatic form-data collection is enabled.
      fbq("set", "autoConfig", false, META_PIXEL_ID);
      fbq("init", META_PIXEL_ID, {}, { agent: "lovable" });
      initialized = true;
      fbq("consent", "grant");
      return fbq;
    })().finally(() => {
      initializing = null;
    });
  }

  return initializing;
}

export async function syncMetaPixelConsent(): Promise<boolean> {
  const permitted = await canTrack("advertising");
  if (initialized) getFbq()("consent", permitted ? "grant" : "revoke");
  return permitted;
}

async function trackMetaEvent(
  eventName: "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase",
  parameters: MetaEventParameters,
  eventID: string,
): Promise<boolean> {
  const fbq = await ensureMetaPixel();
  if (!fbq) return false;
  fbq("track", eventName, parameters, { eventID });
  return true;
}

function createEventId(prefix: string): string {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${id}`;
}

export function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export type ViewContentProduct = {
  id: string;
  name: string;
  category?: string | null;
  price: number;
};

export function viewContentPayload(product: ViewContentProduct): MetaEventParameters {
  return {
    content_name: product.name,
    ...(product.category ? { content_category: product.category } : {}),
    content_ids: [product.id],
    content_type: "product",
    value: money(product.price),
    currency: "BRL",
  };
}

export function addToCartPayload(product: Product, quantity: number): MetaEventParameters {
  return {
    content_name: product.name,
    content_category: product.category,
    content_ids: [product.id],
    content_type: "product",
    contents: [{ id: product.id, quantity, item_price: money(product.price) }],
    value: money(product.price * quantity),
    currency: "BRL",
  };
}

export function initiateCheckoutPayload(items: CartItem[], total: number): MetaEventParameters {
  return {
    content_ids: items.map((item) => item.product.id),
    content_type: "product",
    contents: items.map((item) => ({
      id: item.product.id,
      quantity: item.quantity,
      item_price: money(item.product.price),
    })),
    num_items: items.reduce((sum, item) => sum + item.quantity, 0),
    value: money(total),
    currency: "BRL",
  };
}

export function purchasePayload(total: number): MetaEventParameters {
  return {
    content_type: "product",
    value: money(total),
    currency: "BRL",
  };
}

export function isApprovedPurchase(paymentStatus: string | null | undefined): boolean {
  return paymentStatus === "approved";
}

export function trackMetaPageView(pageKey: string): Promise<boolean> {
  if (lastPageViewKey === pageKey) return Promise.resolve(false);
  const pending = pendingPageViews.get(pageKey);
  if (pending) return pending;

  const request = ensureMetaPixel()
    .then((fbq) => {
      if (!fbq) return false;
      fbq("track", "PageView");
      return true;
    })
    .then((tracked) => {
      if (tracked) lastPageViewKey = pageKey;
      return tracked;
    })
    .finally(() => pendingPageViews.delete(pageKey));
  pendingPageViews.set(pageKey, request);
  return request;
}

export async function trackMetaViewContent(product: ViewContentProduct): Promise<boolean> {
  if (!product.id || !Number.isFinite(product.price) || product.price < 0) return false;
  return trackMetaEvent("ViewContent", viewContentPayload(product), createEventId("view-content"));
}

export async function trackMetaAddToCart(product: Product, quantity: number): Promise<boolean> {
  if (!Number.isInteger(quantity) || quantity < 1 || !Number.isFinite(product.price) || product.price < 0) return false;
  return trackMetaEvent("AddToCart", addToCartPayload(product, quantity), createEventId("add-to-cart"));
}

export async function trackMetaInitiateCheckout(items: CartItem[], total: number): Promise<boolean> {
  if (items.length === 0 || !Number.isFinite(total) || total < 0) return false;
  return trackMetaEvent("InitiateCheckout", initiateCheckoutPayload(items, total), createEventId("initiate-checkout"));
}

function storedPurchaseIds(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(PURCHASE_STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function rememberPurchase(orderId: string) {
  try {
    const ids = storedPurchaseIds().filter((id) => id !== orderId);
    ids.push(orderId);
    localStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify(ids.slice(-100)));
  } catch {
    // Meta also deduplicates by the stable event name and event ID.
  }
}

export function trackMetaPurchase(orderId: string, total: number): Promise<boolean> {
  if (!orderId || !Number.isFinite(total) || total < 0) return Promise.resolve(false);
  if (storedPurchaseIds().includes(orderId)) return Promise.resolve(false);
  const pending = pendingPurchases.get(orderId);
  if (pending) return pending;

  const request = trackMetaEvent("Purchase", purchasePayload(total), `purchase-${orderId}`)
    .then((tracked) => {
      if (tracked) rememberPurchase(orderId);
      return tracked;
    })
    .finally(() => pendingPurchases.delete(orderId));
  pendingPurchases.set(orderId, request);
  return request;
}
