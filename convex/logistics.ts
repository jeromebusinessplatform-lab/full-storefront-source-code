import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

export const calculateDeliveryFee = action({
  args: { address: v.string(), providerName: v.string() },
  handler: async (ctx, args) => {
    // 1. Geocoding (Simulated for this demo)
    // In a real app, use Google Maps API:
    // const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(args.address)}&key=${process.env.GOOGLE_MAPS_KEY}`);
    // const data = await res.json();
    // const location = data.results[0].geometry.location;
    
    // Simulation:
    const lat = 14.5995 + (Math.random() - 0.5) * 0.1;
    const lng = 120.9842 + (Math.random() - 0.5) * 0.1;
    
    // 2. Distance Calculation (Simulated road route distance)
    // Priority focus on Metro Manila in results simulation
    let distance = 5.0 + Math.random() * 10.0; // km
    if (args.address.toLowerCase().includes("quezon city")) distance += 5.0;
    if (args.address.toLowerCase().includes("makati")) distance = 3.0 + Math.random() * 2.0;

    // 3. Get Provider Rates
    const providers = await ctx.runQuery(api.settings.getByKey, { key: "deliveryProviders" });
    const provider = providers?.find((p: any) => p.name === args.providerName) || { baseRate: 50, perKmRate: 10 };

    const deliveryFee = provider.baseRate + (distance * provider.perKmRate);

    return {
      deliveryFee: Math.round(deliveryFee),
      distance: parseFloat(distance.toFixed(2)),
      lat,
      lng,
      address: args.address
    };
  },
});
