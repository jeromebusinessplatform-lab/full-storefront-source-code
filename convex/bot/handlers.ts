import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";
import { Bot, InlineKeyboard } from "grammy";

// ─── VISUAL PADDING ENGINE (The Full-Width Illusion) ──────────────────────────
const NB = "\u00A0"; // Non-breaking space
const pad2 = (txt: string) => txt.padStart(Math.floor((14 + txt.length) / 2), NB).padEnd(14, NB);

// ─── CENTRALIZED CONVEX ACTION ROUTER ─────────────────────────────────────────
// This entry point is invoked by your HTTP webhook handler when Telegram sends an update
export const handleWebhookUpdate = action({
  args: { payload: v.string() },
  handler: async (ctx, args) => {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) throw new Error("Missing TELEGRAM_BOT_TOKEN environment variable.");

    // Initialize grammY in web-compatible mode inside the serverless execution context
    const bot = new Bot(BOT_TOKEN);

    // 1. MAIN MENU NAVIGATION LAYER
    bot.callbackQuery("action:main_menu", async (tgCtx) => {
      await tgCtx.answerCallbackQuery();
      const username = tgCtx.from?.username ? `@${tgCtx.from.username}` : "there";
      
      const mainMenuKeyboard = new InlineKeyboard()
        .webApp("🚀 OPEN SHOP", process.env.NEXT_PUBLIC_APP_URL || "")
        .row()
        .text(pad2("MY ORDERS"), "action:my_orders")
        .text(pad2("HELP CENTER"), "action:help");

      await tgCtx.editMessageText(`Hello, ${username}!\n\nWelcome to our store. Tap the button below to start shopping!`, {
        reply_markup: mainMenuKeyboard,
        parse_mode: "Markdown",
      });
    });

    // Handle /start command
    bot.command("start", async (tgCtx) => {
      const username = tgCtx.from?.username ? `@${tgCtx.from.username}` : "there";
      const startKeyboard = new InlineKeyboard()
        .webApp("🚀 OPEN SHOP", process.env.NEXT_PUBLIC_APP_URL || "")
        .row()
        .text(pad2("MAIN MENU"), "action:main_menu");

      await tgCtx.reply(`Hello, ${username}!\n\nWelcome to the Minimalist Store. Tap below to browse our collection!`, {
        reply_markup: startKeyboard,
        parse_mode: "Markdown",
      });
    });

    // Pass the webhook event execution directly down into the raw grammY parser instance
    const reqBody = JSON.parse(args.payload);
    await bot.handleUpdate(reqBody);
  },
});
