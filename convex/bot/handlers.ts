
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { Bot, InlineKeyboard } from "grammy";

// ─── VISUAL PADDING ENGINE (The Full-Width Illusion) ──────────────────────────
const NB = "\u00A0"; // Non-breaking space
const pad1 = (txt: string) => txt.padStart(Math.floor((38 + txt.length) / 2), NB).padEnd(38, NB);
const pad2 = (txt: string) => txt.padStart(Math.floor((14 + txt.length) / 2), NB).padEnd(14, NB);

// ─── TIME & PRICING UTILITIES ────────────────────────────────────────────────
function isHazardHour(): boolean {
  // Forces evaluation based on Asia/Manila timezone regardless of server host location
  const phTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const hours = phTime.getHours();
  return hours >= 0 && hours < 5; // 12:00 AM to 4:59 AM
}

function formatPrice(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── CENTRALIZED CONVEX ACTION ROUTER ─────────────────────────────────────────
// This entry point is invoked by your HTTP webhook handler when Telegram sends an update
export const handleWebhookUpdate = action({
  args: {},
  handler: async (ctx, args) => {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) throw new Error("Missing TELEGRAM_BOT_TOKEN environment variable.");

    // Initialize grammY in web-compatible mode inside the serverless execution context
    const bot = new Bot(BOT_TOKEN);

    // Fetch operational rules from your Convex database collections dynamically
    const storeSettings = await ctx.runQuery(api.store.getSettings); 
    const isStoreOpen = storeSettings?.isOpen ?? true;
    const fees = storeSettings?.fees ?? { discreet: 40, admin: 3, hazard: 50 };
    const links = storeSettings?.links ?? { card: "", lalamove: "", grab: "" };

    // 1. GLOBAL STORE GUARD: Intercepts interactions if the store is marked closed
    if (!isStoreOpen) {
      bot.on("callback_query:data", async (tgCtx) => {
        await tgCtx.answerCallbackQuery();
        const closedNotice = storeSettings?.closedNotice || "==========================================\nSorry, the store is currently CLOSED.\n==========================================";
        await tgCtx.editMessageText(closedNotice, { parse_mode: "Markdown" });
      });
      bot.on("message", async (tgCtx) => {
        const closedNotice = storeSettings?.closedNotice || "==========================================\nSorry, the store is currently CLOSED.\n==========================================";
        await tgCtx.reply(closedNotice, { parse_mode: "Markdown" });
      });
    } else {
      
      // 2. MAIN MENU NAVIGATION LAYER
      bot.callbackQuery("action:main_menu", async (tgCtx) => {
        await tgCtx.answerCallbackQuery();
        const username = tgCtx.from?.username ? `@${tgCtx.from.username}` : "there";
        
        const mainMenuKeyboard = new InlineKeyboard()
          .text(pad2("BROWSE PRODUCTS"), "action:browse")
          .text(pad2("MY CART"), "action:cart").row()
          .text(pad2("MY ORDERS"), "action:my_orders")
          .text(pad2("HELP CENTER"), "action:help");

        await tgCtx.editMessageText(`Hello, ${username}!\n\nWelcome to our store. What would you like to do?`, {
          reply_markup: mainMenuKeyboard,
          parse_mode: "Markdown",
        });
      });

      // 3. LIVE CART CALCULATOR & FEE COMPILER
      bot.callbackQuery("action:cart", async (tgCtx) => {
        await tgCtx.answerCallbackQuery();
        
        // Fetch real-time user cart data from your Convex tables
        const userId = tgCtx.from.id.toString();
        const cartItems = await ctx.runQuery(api.cart.getUserCart, { userId }) || [];

        if (cartItems.length === 0) {
          const emptyKeyboard = new InlineKeyboard().text(pad1("BACK TO MENU"), "action:main_menu");
          await tgCtx.editMessageText("Your shopping cart is currently empty.", { reply_markup: emptyKeyboard });
          return;
        }

        const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
        const hazardFee = isHazardHour() ? fees.hazard : 0;
        const grandTotal = subtotal + fees.discreet + fees.admin + hazardFee;

        const cartLines = [
          "*YOUR CART*",
          "",
          ...cartItems.map(i => `• ${i.name.toUpperCase()} x${i.qty} — ${formatPrice(i.price * i.qty)}`),
          "",
          `Subtotal: ${formatPrice(subtotal)}`,
          `Discreet Packaging: ${formatPrice(fees.discreet)}`,
          `System Admin Fee: ${formatPrice(fees.admin)}`,
          ...(hazardFee > 0 ? [`Hazard Fee (Late Night): ${formatPrice(hazardFee)}`] : []),
          "",
          `*Grand Total: ${formatPrice(grandTotal)}*`,
        ].join("\n");

        const cartKeyboard = new InlineKeyboard()
          .text(pad1("PROCEED TO CHECKOUT"), "action:checkout_start").row()
          .text(pad2("CLEAR CART"), "action:cart_clear")
          .text(pad2("BACK TO MENU"), "action:main_menu");

        await tgCtx.editMessageText(cartLines, { reply_markup: cartKeyboard, parse_mode: "Markdown" });
      });

      // 4. CHECKOUT STAGE 1: LOGISTICS PROVIDER REDIRECT
      bot.callbackQuery("action:checkout_start", async (tgCtx) => {
        await tgCtx.answerCallbackQuery();

        const deliveryKeyboard = new InlineKeyboard()
          .url(pad2("LALAMOVE"), links.lalamove || "https://lalamove.com") 
          .url(pad2("GRAB EXPRESS"), links.grab || "https://grab.com").row()
          .text(pad1("NEXT — PAYMENT"), "action:checkout_payment").row()
          .text(pad1("BACK TO MENU"), "action:main_menu");

        await tgCtx.editMessageText("*CHECKOUT — DELIVERY*\n\nPlease set up or trace your logistics path using our direct provider booking links below, then proceed to settlement:", {
          reply_markup: deliveryKeyboard,
          parse_mode: "Markdown",
        });
      });

      // 5. CHECKOUT STAGE 2: GATEWAY PRESENTATION LAYER (Fixed Payment Bug)
      bot.callbackQuery("action:checkout_payment", async (tgCtx) => {
        await tgCtx.answerCallbackQuery();

        const paymentKeyboard = new InlineKeyboard()
          .text(pad2("QR PH"), "action:payment_qr");
        
        // Only render the external checkout button if a valid url link exists in the system dashboard
        if (links.card) {
          paymentKeyboard.url(pad2("CREDIT CARD"), links.card);
        }

        paymentKeyboard.row().text(pad1("BACK TO MENU"), "action:main_menu");

        await tgCtx.editMessageText("*ORDER SUMMARY & SETTLEMENT*\n\nPlease select your gateway choice to clear the balance transaction:", {
          reply_markup: paymentKeyboard,
          parse_mode: "Markdown",
        });
      });

      // 6. MANUAL TRANSACTION PROOF RECEIPT PROTOCOL
      bot.callbackQuery("action:payment_qr", async (tgCtx) => {
        await tgCtx.answerCallbackQuery();

        const qrKeyboard = new InlineKeyboard()
          .text(pad1("BACK TO MENU"), "action:main_menu");

        await tgCtx.editMessageText("Please scan the business account QR code to authorize the deposit settlement. Once completed, upload the transaction receipt screen capture image directly to this storefront chat box.", {
          reply_markup: qrKeyboard,
          parse_mode: "Markdown",
        });
      });
    }

    // Pass the webhook event execution directly down into the raw grammY parser instance
    // Note: The incoming payload object must be forwarded to this handler from your convex/http.ts route
    const reqBody = JSON.parse((ctx as any).requestBody || "{}");
    await bot.handleUpdate(reqBody);
  },
});
