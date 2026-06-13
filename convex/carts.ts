import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByUser = query({
  args: { telegramId: v.float64() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("carts")
      .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
      .unique();
  },
});

export const addToCart = mutation({
  args: { telegramId: v.float64(), productId: v.id("products"), quantity: v.float64() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("carts")
      .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
      .unique();

    if (existing) {
      const items = [...existing.items];
      const index = items.findIndex((i) => i.productId === args.productId);
      if (index > -1) {
        items[index].quantity += args.quantity;
      } else {
        items.push({ productId: args.productId, quantity: args.quantity });
      }
      await ctx.db.patch(existing._id, { items });
    } else {
      await ctx.db.insert("carts", {
        telegramId: args.telegramId,
        items: [{ productId: args.productId, quantity: args.quantity }],
      });
    }
  },
});

export const removeFromCart = mutation({
  args: { telegramId: v.float64(), productId: v.id("products") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("carts")
      .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
      .unique();

    if (existing) {
      const items = existing.items.filter((i) => i.productId !== args.productId);
      if (items.length === 0) {
        await ctx.db.delete(existing._id);
      } else {
        await ctx.db.patch(existing._id, { items });
      }
    }
  },
});
