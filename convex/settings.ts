import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    return setting?.value;
  },
});

export const setByKey = mutation({
  args: { key: v.string(), value: v.any(), adminCode: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Admin Guard
    if (args.adminCode !== "COREDEVELOPER9491") {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
    } else {
      await ctx.db.insert("settings", { key: args.key, value: args.value });
    }
  },
});

export const initializeSettings = mutation({
  handler: async (ctx) => {
    const defaultSettings = [
      {
        key: "paymentMethods",
        value: [
          { type: "QR", label: "GCash QR", details: "Scan to pay", image: "https://example.com/gcash-qr.png" },
          { type: "LINK", label: "Maya Link", details: "https://maya.ph/pay/example" },
          { type: "PAYPAL", label: "PayPal", details: "paypal@example.com" },
          { type: "BITCOIN", label: "Bitcoin", details: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa" },
        ],
      },
      {
        key: "deliveryProviders",
        value: [
          { name: "LALAMOVE", baseRate: 60, perKmRate: 15 },
          { name: "GRAB", baseRate: 80, perKmRate: 20 },
        ],
      },
    ];

    for (const setting of defaultSettings) {
      const existing = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", setting.key))
        .unique();
      if (!existing) {
        await ctx.db.insert("settings", setting);
      }
    }
  },
});
