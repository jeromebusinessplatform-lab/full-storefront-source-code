import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.search) {
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
  args: { productId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.productId as any);
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    subName: v.string(),
    description: v.string(),
    price: v.float64(),
    image: v.string(),
    stock: v.float64(),
    status: v.string(),
    category: v.string(),
    adminCode: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.adminCode !== "COREDEVELOPER9491") throw new Error("Unauthorized");
    const { adminCode, ...product } = args;
    return await ctx.db.insert("products", product);
  },
});
