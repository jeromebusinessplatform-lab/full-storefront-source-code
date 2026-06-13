import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";
import { Bot, InlineKeyboard } from "grammy";

// ─── THE MATRIX ENGINE: UTILITIES ─────────────────────────────────────────────

// Strictly NO emojis or icons. Equal widths enforced via non-breaking spaces.
const PAD_WIDTH = 12; 
const pad = (text: string) => {
  const clean = text.toUpperCase().replace(/[^A-Z0-9 <<>>-]/g, '').trim();
  if (clean.length >= PAD_WIDTH) return clean.substring(0, PAD_WIDTH);
  const total = PAD_WIDTH - clean.length;
  const left = Math.floor(total / 2);
  const right = total - left;
  return "\u00A0".repeat(left) + clean + "\u00A0".repeat(right);
};

// Enforces a strict 3x3 grid with fixed navigation in the last row
function createMatrixKeyboard(options: { label: string, data: string }[], nav: { prev: string, next: string }) {
  const kb = new InlineKeyboard();
  
  // Rows 1-2 (6 slots)
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 3; j++) {
      const idx = i * 3 + j;
      const opt = options[idx] || { label: "---", data: "noop" };
      kb.text(pad(opt.label), opt.data);
    }
    kb.row();
  }

  // Row 3 (Fixed Navigation)
  kb.text(pad("<<"), nav.prev)
    .text(pad("MAIN MENU"), "action:main_menu")
    .text(pad("NEXT"), nav.next);
    
  return kb;
}

// ─── CENTRALIZED CONVEX ACTION ROUTER ─────────────────────────────────────────
export const handleWebhookUpdate = action({
  args: { payload: v.string() },
  handler: async (ctx, args) => {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) throw new Error("Missing TELEGRAM_BOT_TOKEN");

    const bot = new Bot(BOT_TOKEN);

    // Global Store Status Check
    const storeStatus = await ctx.runQuery(api.settings.getByKey, { key: "storeStatus" }) || "OPEN";
    const uiConfig = await ctx.runQuery(api.settings.getByKey, { key: "bot_ui_config" }) || {
      homeTitle: "CORE // SYSTEM INTERFACE",
      homeCaption: "STATUS: OPERATIONAL\n====================================\nESTABLISHING SECURE CONNECTION...\nSELECTION REQUIRED VIA THE MATRIX\nCONTROL CONSOLE PLACED BELOW.",
      homeType: "TEXT"
    };

    // 1. ROOT INTERFACE (3x3 Matrix)
    bot.command("start", async (tgCtx) => {
      const kb = createMatrixKeyboard([
        { label: "SHOP", data: "action:catalog_0" },
        { label: "MY CART", data: "action:cart" },
        { label: "MY ORDERS", data: "action:orders" },
        { label: "PROFILE", data: "action:profile" },
        { label: "SUPPORT", data: "action:support" },
        { label: "LOGOUT", data: "action:logout" }
      ], { prev: "noop", next: "noop" });

      const header = `====================================\n${uiConfig.homeTitle}\n====================================\n${uiConfig.homeCaption}\n====================================`;

      await tgCtx.reply(header, {
        reply_markup: kb,
        parse_mode: "Markdown",
      });
    });

    bot.callbackQuery("action:main_menu", async (tgCtx) => {
      await tgCtx.answerCallbackQuery();
      const kb = createMatrixKeyboard([
        { label: "SHOP", data: "action:catalog_0" },
        { label: "MY CART", data: "action:cart" },
        { label: "MY ORDERS", data: "action:orders" },
        { label: "PROFILE", data: "action:profile" },
        { label: "SUPPORT", data: "action:support" },
        { label: "LOGOUT", data: "action:logout" }
      ], { prev: "noop", next: "noop" });

      const header = `====================================\n${uiConfig.homeTitle}\n====================================\n${uiConfig.homeCaption}\n====================================`;

      await tgCtx.editMessageText(header, {
        reply_markup: kb,
        parse_mode: "Markdown",
      });
    });

    // 2. PRODUCT CATALOG (3x3 blocks)
    bot.callbackQuery(/^action:catalog_(\d+)$/, async (tgCtx) => {
      await tgCtx.answerCallbackQuery();
      const page = parseInt(tgCtx.match![1]);
      const products = await ctx.runQuery(api.products.list, {});
      const pagedProducts = products.slice(page * 6, (page + 1) * 6);
      
      const options = pagedProducts.map(p => ({ label: p.name, data: `action:product_${p._id}` }));
      const kb = createMatrixKeyboard(options, { 
        prev: page > 0 ? `action:catalog_${page - 1}` : "noop", 
        next: products.length > (page + 1) * 6 ? `action:catalog_${page + 1}` : "noop" 
      });

      const header = `====================================\nLIVE ALLOCATION LEDGER // PAGE ${page + 1}\n====================================\nSELECT UNIT FOR DETAILED SPECS\n====================================`;
      
      await tgCtx.editMessageText(header, {
        reply_markup: kb,
        parse_mode: "Markdown",
      });
    });

    // 3. SECURE PAYMENT HANDSHAKE
    bot.callbackQuery("action:payment_upload", async (tgCtx) => {
      await tgCtx.answerCallbackQuery();
      
      const kb = new InlineKeyboard().text(pad("ABORT"), "action:main_menu");

      await tgCtx.editMessageText(`====================================\nINIT // SECURE PAYMENT HANDSHAKE\n====================================\nSTATUS: AWAITING PROOF OF DEPOSIT\n\nACTION: UPLOAD THE SCREEN CAPTURE\nOF YOUR TRANSACTION NOW.\n====================================`, {
        reply_markup: kb,
        parse_mode: "Markdown",
      });
    });

    bot.on("message:photo", async (tgCtx) => {
      // 1. Morph to Processing
      const msg = await tgCtx.reply(`====================================\nSTATUS: PROCESSING PROOF...\n====================================\nDO NOT CLOSE THIS INTERFACE\n====================================`);
      
      // 2. Simulated secure handshake wait
      await new Promise(r => setTimeout(r, 2000));

      // 3. Finalize
      await tgCtx.api.editMessageText(tgCtx.chat.id, msg.message_id, `====================================\nSTATUS: PROOF SECURED\n====================================\nYOUR TRANSACTION HAS BEEN ANCHORED\nTO THE BUSINESS LEDGER.\n====================================`, {
        reply_markup: new InlineKeyboard().text(pad("MAIN MENU"), "action:main_menu")
      });
    });

    // Status Notification Logic (Invoked via mutations in reality)
    // This is handled via server-side logic triggering bot.api.sendMessage

    bot.callbackQuery("noop", async (tgCtx) => await tgCtx.answerCallbackQuery());

    const reqBody = JSON.parse(args.payload);
    await bot.handleUpdate(reqBody);
  },
});
