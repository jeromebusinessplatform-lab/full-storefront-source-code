import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.search) {
      // Simple search implementation
      // For more advanced search, consider using search indexes
      const products = await ctx.db.query("products").collect();
      return products.filter((p) =>
        p.name.toLowerCase().includes(args.search!.toLowerCase()) ||
        p.subName.toLowerCase().includes(args.search!.toLowerCase())
      );
    }
    return await ctx.db.query("products").collect();
  },
});

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
