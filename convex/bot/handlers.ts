import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";

// ─── RAW TELEGRAM API WRAPPERS ────────────────────────────────────────────────

async function tg(token: string, method: string, body: any) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

const PAD_WIDTH = 12; 
const pad = (text: string) => {
  const clean = text.toUpperCase().replace(/[^A-Z0-9 <<>>-]/g, '').trim();
  if (clean.length >= PAD_WIDTH) return clean.substring(0, PAD_WIDTH);
  const total = PAD_WIDTH - clean.length;
  const left = Math.floor(total / 2);
  const right = total - left;
  return "\u00A0".repeat(left) + clean + "\u00A0".repeat(right);
};

function createMatrixButtons(options: { label: string, data: string }[], nav: { prev: string, next: string }) {
  const inline_keyboard: any[][] = [];
  for (let i = 0; i < 2; i++) {
    const row: any[] = [];
    for (let j = 0; j < 3; j++) {
      const idx = i * 3 + j;
      const opt = options[idx] || { label: "---", data: "noop" };
      row.push({ text: pad(opt.label), callback_data: opt.data });
    }
    inline_keyboard.push(row);
  }
  inline_keyboard.push([
    { text: pad("<< PREV"), callback_data: nav.prev },
    { text: pad("MAIN MENU"), callback_data: "action:main_menu" },
    { text: pad("NEXT >>"), callback_data: nav.next }
  ]);
  return { inline_keyboard };
}

// ─── CORE DISPATCHER ─────────────────────────────────────────────────────────

export const handleWebhookUpdate = action({
  args: { payload: v.string() },
  handler: async (ctx, args) => {
    const update = JSON.parse(args.payload);
    const responses: any = await ctx.runQuery(api.settings.getByKey, { key: "bot_responses" }) || {};
    const BOT_TOKEN = await ctx.runQuery(api.settings.getByKey, { key: "TELEGRAM_BOT_TOKEN" }) || "8980608721:AAE1FgIkQ4v9euXqOhOyXbJYmdHNt8OIyx8";
    
    const chatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
    const messageId = update.callback_query?.message?.message_id;
    const text = update.message?.text;
    const data = update.callback_query?.data;

    if (!chatId) return;

    // Helper for dynamic response execution
    const executeResponse = async (key: string, defaultText: string, kb: any, isEdit = false) => {
      const config = responses[key] || { type: "TEXT", text: defaultText };
      const baseBody = { chat_id: chatId, reply_markup: kb, parse_mode: "HTML" };
      
      if (config.type === "PHOTO" && config.image) {
        if (isEdit) await tg(BOT_TOKEN, "deleteMessage", { chat_id: chatId, message_id: messageId });
        return await tg(BOT_TOKEN, "sendPhoto", { ...baseBody, photo: config.image, caption: config.text || defaultText });
      }
      
      if (isEdit) {
        return await tg(BOT_TOKEN, "editMessageText", { ...baseBody, message_id: messageId, text: config.text || defaultText });
      } else {
        return await tg(BOT_TOKEN, "sendMessage", { ...baseBody, text: config.text || defaultText });
      }
    };

    // 1. HOME / START
    if (text === "/start" || data === "action:main_menu") {
      const kb = createMatrixButtons([
        { label: "SHOP", data: "action:catalog_0" },
        { label: "MY CART", data: "action:cart" },
        { label: "MY ORDERS", data: "action:orders" },
        { label: "PROFILE", data: "action:profile" },
        { label: "SUPPORT", data: "action:support" },
        { label: "LOGOUT", data: "action:logout" }
      ], { prev: "noop", next: "noop" });

      await executeResponse("home", "CORE // SYSTEM INTERFACE\nSTATUS: OPERATIONAL", kb, !!data);
    }

    // 2. CATALOG
    if (data?.startsWith("action:catalog_")) {
      const page = parseInt(data.split("_")[1]);
      const products: any[] = await ctx.runQuery(api.products.list, {});
      const pagedProducts = products.slice(page * 6, (page + 1) * 6);
      const options = pagedProducts.map((p: any) => ({ label: p.name, data: `action:product_${p._id}` }));
      const kb = createMatrixButtons(options, { 
        prev: page > 0 ? `action:catalog_${page - 1}` : "noop", 
        next: products.length > (page + 1) * 6 ? `action:catalog_${page + 1}` : "noop" 
      });

      await executeResponse("catalog", `LIVE ALLOCATION LEDGER // PAGE ${page + 1}`, kb, true);
    }

    // 3. PRODUCT DETAIL
    if (data?.startsWith("action:product_")) {
      const productId = data.split("_")[1];
      const product: any = await ctx.runQuery(api.products.getById, { productId });
      if (!product) return;

      const kb = {
        inline_keyboard: [
          [{ text: pad("ADD TO CART"), callback_data: `action:add_${productId}` }],
          [{ text: pad("<< BACK"), callback_data: "action:catalog_0" }]
        ]
      };

      const detailText = `<b>${product.name}</b>\n${product.subName}\n\n${product.description}\n\nPRICE: $${product.price.toFixed(2)}`;
      
      // Override with image if product has one
      if (product.image) {
        await tg(BOT_TOKEN, "deleteMessage", { chat_id: chatId, message_id: messageId });
        await tg(BOT_TOKEN, "sendPhoto", { chat_id: chatId, photo: product.image, caption: detailText, parse_mode: "HTML", reply_markup: kb });
      } else {
        await tg(BOT_TOKEN, "editMessageText", { chat_id: chatId, message_id: messageId, text: detailText, parse_mode: "HTML", reply_markup: kb });
      }
    }

    // 4. CART / ORDERS / PROFILE / SUPPORT (Basic Handlers)
    if (["action:cart", "action:orders", "action:profile", "action:support"].includes(data || "")) {
      const key = data!.split(":")[1];
      const kb = createMatrixButtons([], { prev: "noop", next: "noop" });
      await executeResponse(key, `${key.toUpperCase()} // INTERFACE`, kb, true);
    }

    // 5. NOOP / ACK
    if (data === "noop") await tg(BOT_TOKEN, "answerCallbackQuery", { callback_query_id: update.callback_query.id });
  },
});

export const setWebhook = action({
  args: { adminCode: v.string() },
  handler: async (ctx, args) => {
    if (args.adminCode !== "COREDEVELOPER9491") throw new Error("Unauthorized");
    const BOT_TOKEN = await ctx.runQuery(api.settings.getByKey, { key: "TELEGRAM_BOT_TOKEN" }) || "8980608721:AAE1FgIkQ4v9euXqOhOyXbJYmdHNt8OIyx8";
    const convexSiteUrl = process.env.CONVEX_SITE_URL || `https://${process.env.CONVEX_DEPLOYMENT?.split(":")[1]}.convex.site`;
    const res = await tg(BOT_TOKEN, "setWebhook", { url: `${convexSiteUrl}/telegram` });
    return { success: res.ok, url: `${convexSiteUrl}/telegram` };
  },
});

export const getBotInfo = action({
  args: { adminCode: v.string() },
  handler: async (ctx, args) => {
    if (args.adminCode !== "COREDEVELOPER9491") throw new Error("Unauthorized");
    const BOT_TOKEN = await ctx.runQuery(api.settings.getByKey, { key: "TELEGRAM_BOT_TOKEN" }) || "8980608721:AAE1FgIkQ4v9euXqOhOyXbJYmdHNt8OIyx8";
    const res = await tg(BOT_TOKEN, "getMe", {});
    return res.ok ? { success: true, username: res.result.username } : { success: false, error: res.description };
  },
});
