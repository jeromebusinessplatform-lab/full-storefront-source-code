import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
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
    paymentMethod: v.string(),
    deliveryDetails: v.object({
      address: v.string(),
      lat: v.float64(),
      lng: v.float64(),
      distance: v.float64(),
    }),
    deliveryFee: v.float64(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
      .unique();

    if (!user) throw new Error("User not found");

    const orderId = await ctx.db.insert("orders", {
      internalId: user.internalId,
      telegramId: args.telegramId,
      items: args.items,
      total: args.total,
      status: "PENDING",
      paymentMethod: args.paymentMethod,
      deliveryDetails: args.deliveryDetails,
      deliveryFee: args.deliveryFee,
      createdAt: Date.now(),
    });

    // Clear cart
    const cart = await ctx.db
      .query("carts")
      .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
      .unique();
    if (cart) {
      await ctx.db.delete(cart._id);
    }

    return orderId;
  },
});

export const listByUser = query({
  args: { telegramId: v.float64() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
      .order("desc")
      .collect();
  },
});

export const listAll = query({
  args: { adminCode: v.string() },
  handler: async (ctx, args) => {
    if (args.adminCode !== "COREDEVELOPER9491") throw new Error("Unauthorized");
    return await ctx.db.query("orders").order("desc").collect();
  },
});

export const updateStatus = mutation({
  args: { orderId: v.id("orders"), status: v.string(), adminCode: v.string() },
  handler: async (ctx, args) => {
    if (args.adminCode !== "COREDEVELOPER9491") throw new Error("Unauthorized");
    await ctx.db.patch(args.orderId, { status: args.status });
  },
});

export const uploadProofOfPayment = mutation({
  args: { orderId: v.id("orders"), proofUrl: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, { proofOfPaymentUrl: args.proofUrl });
  },
});
