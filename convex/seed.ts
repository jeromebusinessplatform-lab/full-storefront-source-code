import { mutation } from "./_generated/server";

export const seedProducts = mutation({
  handler: async (ctx) => {
    const products = [
      {
        name: "LUMIERE LAMP",
        subName: "MATTE WHITE FINISH",
        description: "A minimalist table lamp with adjustable brightness.",
        price: 89.00,
        image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80",
        stock: 50,
        status: "BEST SELLER",
      },
      {
        name: "ZEN VASE",
        subName: "ORGANIC CERAMIC",
        description: "Handcrafted ceramic vase for a single branch.",
        price: 45.00,
        image: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=400&q=80",
        stock: 30,
        status: "NEW",
      },
      {
        name: "NORDIC CHAIR",
        subName: "ASH WOOD & FABRIC",
        description: "Ergonomic dining chair with a clean silhouette.",
        price: 210.00,
        image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=400&q=80",
        stock: 15,
        status: "SALE",
      },
      {
        name: "MIST DIFFUSER",
        subName: "ULTRASONIC TECH",
        description: "Quiet aroma diffuser with warm LED light.",
        price: 65.00,
        image: "https://images.unsplash.com/photo-1602928321679-560bb453f190?auto=format&fit=crop&w=400&q=80",
        stock: 40,
        status: "NONE",
      },
      {
        name: "SLATE COASTERS",
        subName: "SET OF 4",
        description: "Natural slate coasters with non-slip backing.",
        price: 25.00,
        image: "https://images.unsplash.com/photo-1616489953149-8e10073571d2?auto=format&fit=crop&w=400&q=80",
        stock: 100,
        status: "BEST SELLER",
      },
      {
        name: "FLAX THROW",
        subName: "100% ORGANIC LINEN",
        description: "Soft linen throw for cozy evenings.",
        price: 75.00,
        image: "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?auto=format&fit=crop&w=400&q=80",
        stock: 25,
        status: "NEW",
      },
    ];

    for (const product of products) {
      const existing = await ctx.db
        .query("products")
        .filter((q) => q.eq(q.field("name"), product.name))
        .unique();
      if (!existing) {
        await ctx.db.insert("products", product);
      }
    }
  },
});
