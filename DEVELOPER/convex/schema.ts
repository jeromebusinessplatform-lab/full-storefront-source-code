import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    internalId: v.string(), // 10-char alphanumeric
    telegramId: v.float64(), // Unique
    username: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    lastLogin: v.float64(),
  }).index("by_telegramId", ["telegramId"]),

  sessions: defineTable({
    telegramId: v.float64(),
    cryptoToken: v.string(),
    expiresAt: v.float64(),
  }).index("by_token", ["cryptoToken"]),

  products: defineTable({
    name: v.string(),
    subName: v.string(),
    description: v.string(),
    price: v.float64(),
    image: v.string(),
    stock: v.float64(),
    status: v.string(), // Sale, New, Best Seller, None
    category: v.optional(v.string()),
  }).index("by_status", ["status"]),

  carts: defineTable({
    telegramId: v.float64(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.float64(),
      })
    ),
  }).index("by_telegramId", ["telegramId"]),

  orders: defineTable({
    internalId: v.string(), // customer internalId
    telegramId: v.float64(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        name: v.string(),
        price: v.float64(),
        quantity: v.float64(),
      })
    ),
    total: v.float64(),
    status: v.string(), // PENDING, PAID, DISPATCHED, COMPLETED
    paymentMethod: v.string(),
    proofOfPaymentUrl: v.optional(v.string()),
    deliveryDetails: v.object({
      address: v.string(),
      lat: v.float64(),
      lng: v.float64(),
      distance: v.float64(),
    }),
    deliveryFee: v.float64(),
    trackingUrl: v.optional(v.string()),
    createdAt: v.float64(),
  }).index("by_telegramId", ["telegramId"]),

  settings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),
});
