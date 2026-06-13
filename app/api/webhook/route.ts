import { Bot, Context, session, InlineKeyboard, webhookCallback } from 'grammy';
import { conversations, createConversation, Conversation, ConversationFlavor } from '@grammyjs/conversations';
import { createClient } from '@supabase/supabase-js';
import { enforceMatrixSize, formatLedgerRow } from '../../../utils/formatter';

type MyContext = Context & ConversationFlavor;
type MyConversation = Conversation<MyContext>;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_TOKEN!);

bot.use(session({ initial: () => ({}) }));
bot.use(conversations());

async function getConfigValue(key: string, defaultValue: string): Promise<string> {
  const { data } = await supabase.from('system_config').select('value').eq('key', key).single();
  return data?.value || defaultValue;
}

async function createMayaCheckoutSession(orderId: string, totalAmount: number, items: any[]) {
  const MAYA_BASE_URL = process.env.MAYA_ENVIRONMENT === 'PRODUCTION' 
    ? 'https://pg.maya.ph' 
    : 'https://pg-sandbox.paymaya.com';
    
  const secretKey = process.env.MAYA_SECRET_KEY!;
  const encodedKey = Buffer.from(secretKey + ':').toString('base64');

  const payload = {
    totalAmount: { value: totalAmount, currency: 'PHP' },
    requestReferenceNumber: orderId,
    items: items.map(item => ({
      name: item.name.toUpperCase(),
      amount: { value: item.price },
      totalAmount: { value: item.price },
      quantity: 1
    })),
    redirectUrl: {
      success: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`,
      failure: `${process.env.NEXT_PUBLIC_APP_URL}/payment-failed`,
      cancel: `${process.env.NEXT_PUBLIC_APP_URL}/payment-cancelled`
    }
  };

  const response = await fetch(`${MAYA_BASE_URL}/v1/checkouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${encodedKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`MAYA_GATEWAY_ERROR // ${JSON.stringify(errorData)}`);
  }

  return response.json();
}

const matrixMainKeyboard = () => {
  return new InlineKeyboard()
    .text(enforceMatrixSize('BROWSE CATALOG'), 'ln_browse').text(enforceMatrixSize('YOUR CART'), 'ln_cart').row()
    .text(enforceMatrixSize('ORDER HISTORY'), 'ln_orders').text(enforceMatrixSize('SHIPPING SETUP'), 'ln_shipping_setup').row()
    .text(enforceMatrixSize('DIGITAL WALLET'), 'ln_wallet').text(enforceMatrixSize('CLIENT SUPPORT'), 'ln_support');
};

const matrixBrowseKeyboard = () => {
  return new InlineKeyboard()
    .text(enforceMatrixSize('ADD TEST ITEM'), 'ln_checkout').text(enforceMatrixSize('---'), 'noop').row()
    .text(enforceMatrixSize('---'), 'noop').text(enforceMatrixSize('---'), 'noop').row()
    .text(enforceMatrixSize('MAIN MENU'), 'ln_main').text(enforceMatrixSize('CHECKOUT'), 'ln_checkout');
};

async function executeDispatchConversation(conversation: MyConversation, ctx: MyContext) {
  const orderId = (ctx as any).session.activeAdminOrderId;
  const customerId = (ctx as any).session.activeAdminCustomerId;

  await ctx.reply([
    `\`====================================\``,
    `\`INIT // DISPATCH FLOW REGISTRATION  \``,
    `\`====================================\``,
    `\`ORDER_ID // ${orderId}\``,
    `\n\`ACTION REQUIRED:\``,
    `\`PROVIDE THE LIVE TRACKING LINK OR    \``,
    `\`CARRIER MANIFEST URL NOW.           \``,
    `\`====================================\``
  ].join('\n'), { parse_mode: 'MarkdownV2' });

  const inputCtx = await conversation.waitFor('message:text');
  const trackingUrl = inputCtx.message.text.trim();

  await conversation.external(() => 
    supabase.from('orders').update({ status: 'DISPATCHED', tracking_url: trackingUrl }).eq('id', orderId)
  );

  await ctx.reply([
    `\`====================================\``,
    `\`SYS // DISPATCH RECORD LOCKED        \``,
    `\`====================================\``,
    `\`STATUS   // DISPATCHED              \``,
    `\`====================================\``
  ].join('\n'), { parse_mode: 'MarkdownV2' });

  try {
    const buyerNotificationText = [
      `\`====================================\``,
      `\`OUTBOUND DISPATCH MANIFEST         \``,
      `\`====================================\``,
      `\`ORDER_REF // ${orderId}\``,
      `\`LOGISTICS // SHIPMENT RELEASED      \``,
      `\`CHARGES   // COLLECT ON DELIVERY    \``,
      `\`------------------------------------\``,
      `\n\`YOUR ORDER HAS TRANSITIONED TO OUT- \``,
      `\`BOUND TRANSIT FLIGHT. THE LIVE TRACK\``,
      `\`ING DATA HAS BEEN ANCHORED BELOW.   \``,
      `\`====================================\``
    ].join('\n');

    const clientKeyboard = new InlineKeyboard()
      .url(enforceMatrixSize('TRACK LIVE SHIPMENT'), trackingUrl).row()
      .text(enforceMatrixSize('MAIN MENU'), 'ln_main');

    await bot.api.sendMessage(customerId, buyerNotificationText, {
      parse_mode: 'MarkdownV2',
      reply_markup: clientKeyboard
    });
  } catch (err) {}
}

bot.use(createConversation(executeDispatchConversation));

bot.command('start', async (ctx) => {
  const welcomeText = [
    `\`====================================\``,
    `\`CORE // SYSTEM INTERFACE           \``,
    `\`STATUS: OPERATIONAL                \``,
    `\`====================================\``,
    `\n\`ESTABLISHING SECURE CONNECTION...  \``,
    `\`SELECTION REQUIRED VIA THE MATRIX  \``,
    `\`CONTROL CONSOLE PLACED BELOW.     \``,
    `\n\`------------------------------------\``,
    `\`SYS_REF // B_MATRIX_V.2.026        \``,
    `\`====================================\``
  ].join('\n');

  await ctx.reply(welcomeText, { parse_mode: 'MarkdownV2', reply_markup: matrixMainKeyboard() });
});

bot.callbackQuery('ln_main', async (ctx) => {
  await ctx.answerCallbackQuery();
  const resetText = [
    `\`====================================\``,
    `\`CORE // SYSTEM INTERFACE           \``,
    `\`STATUS: OPERATIONAL                \``,
    `\`====================================\``,
    `\n\`INTERFACE PANEL BACK TO ROOT.       \``,
    `\n\`------------------------------------\``,
    `\`SYS_REF // B_MATRIX_V.2.026        \``,
    `\`====================================\``
  ].join('\n');
  await ctx.editMessageText(resetText, { parse_mode: 'MarkdownV2', reply_markup: matrixMainKeyboard() });
});

bot.callbackQuery('ln_browse', async (ctx) => {
  await ctx.answerCallbackQuery();
  const { data: products } = await supabase.from('products').select('name, price').gt('stock', 0).limit(4);
  let dynamicLedger = `\`NO ACTIVE ALLOCATIONS FOUND        \``;
  if (products && products.length > 0) {
    dynamicLedger = products.map(p => formatLedgerRow(p.name, p.price)).join('\n');
  }

  const showroomText = [
    `\`====================================\``,
    `\`LIVE ALLOCATION LEDGER             \``,
    `\`====================================\``,
    dynamicLedger,
    `\`====================================\``,
    `\n\`USE CONTROL INTERFACE TO ALTER    \``,
    `\`SELECTIONS OR EXECUTE CHECKOUT.   \``,
    `\`====================================\``
  ].join('\n');

  await ctx.editMessageText(showroomText, { parse_mode: 'MarkdownV2', reply_markup: matrixBrowseKeyboard() });
});

bot.callbackQuery('ln_shipping_setup', async (ctx) => {
  await ctx.answerCallbackQuery();
  const p1Name = await getConfigValue('DEL_PROVIDER_01_NAME', 'PROVIDER 01');
  const p1Url = await getConfigValue('DEL_PROVIDER_01_URL', '#');
  const p2Name = await getConfigValue('DEL_PROVIDER_02_NAME', 'PROVIDER 02');
  const p2Url = await getConfigValue('DEL_PROVIDER_02_URL', '#');

  const logisticsMatrix = new InlineKeyboard()
    .url(enforceMatrixSize(p1Name), p1Url)
    .url(enforceMatrixSize(p2Name), p2Url).row()
    .text(enforceMatrixSize('---'), 'noop')
    .text(enforceMatrixSize('---'), 'noop').row()
    .text(enforceMatrixSize('MAIN MENU'), 'ln_main')
    .text(enforceMatrixSize('---'), 'noop');

  const logisticsText = [
    `\`====================================\``,
    `\`LOGISTICS REGISTRATION HUB         \``,
    `\`====================================\``,
    `\`STATUS // AWAITING DISPATCH ROUTE  \``,
    `\`NOTICE // FEES PAID UPON DELIVERY   \``,
    `\`====================================\``,
    `\n\`CRITICAL ACCOUNTING PARAMETERS:\``,
    `\`DELIVERY FEES ARE NOT CALCULATED OR \``,
    `\`CHARGED WITHIN THIS INTERFACE.      \``,
    `\`ALL FREIGHT COSTS MUST BE SETTLED   \``,
    `\`DIRECTLY WITH THE CARRIER AGENT AT  \``,
    `\`THE MOMENT OF PRODUCT FULFILLMENT.  \``,
    `\n\`------------------------------------\``,
    `\`EXECUTION REQUIRED:\``,
    `\`TAP YOUR PREFERRED ROUTING PROVIDER \``,
    `\`BELOW TO SUBMIT REQUISITE MANIFESTS \``,
    `\`====================================\``
  ].join('\n');

  await ctx.editMessageText(logisticsText, { parse_mode: 'MarkdownV2', reply_markup: logisticsMatrix });
});

bot.callbackQuery('ln_checkout', async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from.id;
  const orderId = `TX-${Math.floor(100000 + Math.random() * 900000)}`;
  const cartItems = [{ name: 'MATTE BLACK CASE', price: 450.00 }];
  const totalDue = 450.00;

  try {
    const mayaSession = await createMayaCheckoutSession(orderId, totalDue, cartItems);
    await supabase.from('orders').insert({
      id: orderId,
      telegram_user_id: userId,
      total_price: totalDue,
      status: 'PENDING_PAYMENT',
      maya_checkout_id: mayaSession.checkoutId
    });

    const paymentKeyboard = new InlineKeyboard()
      .text(enforceMatrixSize('---'), 'noop').text(enforceMatrixSize('---'), 'noop').row()
      .text(enforceMatrixSize('---'), 'noop').text(enforceMatrixSize('---'), 'noop').row()
      .text(enforceMatrixSize('ABORT TRANSACTION'), 'ln_main')
      .url(enforceMatrixSize('EXECUTE PAYMENT'), mayaSession.redirectUrl);

    const matrixText = [
      `\`====================================\``,
      `\`MAYA PAYMENT GATEWAY INITIALIZED   \``,
      `\`====================================\``,
      `\`ORDER_REF // ${orderId}             \``,
      ...cartItems.map(item => formatLedgerRow(item.name, item.price)),
      `\`------------------------------------\``,
      formatLedgerRow('TOTAL AMOUNT DUE', totalDue),
      `\`====================================\``,
      `\n\`ACTION REQUIRED:\``,
      `\`TAP EXECUTE PAYMENT BELOW TO OPEN  \``,
      `\`THE SECURE MAYA CLEARING PORTAL.   \``,
      `\`====================================\``
    ].join('\n');

    await ctx.editMessageText(matrixText, { parse_mode: 'MarkdownV2', reply_markup: paymentKeyboard });
  } catch (err) {
    await ctx.reply(`\`SYS_ERR // GATEWAY_CONNECTION_FAILED\``, { parse_mode: 'MarkdownV2' });
  }
});

bot.command('admin', async (ctx) => {
  const userId = ctx.from?.id.toString();
  if (userId !== process.env.ADMIN_TELEGRAM_ID) {
    return ctx.reply(`\`SYS_ERR // ACCESS_DENIED_UNAUTHORIZED_NODE\``, { parse_mode: 'MarkdownV2' });
  }

  const { data: openOrders } = await supabase.from('orders').select('id, telegram_user_id, total_price').eq('status', 'PAID').limit(3);
  if (!openOrders || openOrders.length === 0) {
    return ctx.reply([
      `\`====================================\``,
      `\`ADMIN // OPERATIONS CONSOLE         \``,
      `\`====================================\``,
      `\`QUEUED OPERATIONS // ZERO ORDERS    \``,
      `\`SYSTEM STATUS      // OPERATIONAL  \``,
      `\`====================================\``
    ].join('\n'), { parse_mode: 'MarkdownV2' });
  }

  const adminMatrix = new InlineKeyboard();
  openOrders.forEach((order) => {
    adminMatrix
      .text(enforceMatrixSize(`VIEW ${order.id.substring(0, 8)}`), `adm_view_${order.id}`)
      .text(enforceMatrixSize('MARK DISPATCH'), `adm_disp_${order.id}_${order.telegram_user_id}`).row();
  });

  const paddingRowsNeeded = 3 - openOrders.length;
  for (let i = 0; i < paddingRowsNeeded; i++) {
    adminMatrix.text(enforceMatrixSize('---'), 'noop').text(enforceMatrixSize('---'), 'noop').row();
  }

  const adminPanelText = [
    `\`====================================\``,
    `\`ADMIN // OPERATIONS CONSOLE         \``,
    `\`====================================\``,
    `\`AWAITING SHIPMENT DISPATCH ROUTING   \``,
    `\`------------------------------------\``,
    ...openOrders.map(o => `\`ID: ${o.id} | VAL: $${o.total_price.toFixed(2)}\``),
    `\`====================================\``
  ].join('\n');

  await ctx.reply(adminPanelText, { parse_mode: 'MarkdownV2', reply_markup: adminMatrix });
});

bot.callbackQuery(/^adm_disp_/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id.toString();
  if (userId !== process.env.ADMIN_TELEGRAM_ID) return;
const dataParts = ctx.callbackQuery.data.split('_');
    const orderId = dataParts[2];
    const customerId = dataParts[3];
  (ctx.session as any).activeAdminOrderId = orderId;
  (ctx.session as any).activeAdminCustomerId = customerId;

  await ctx.editMessageText(`\`SYS // PROCESSING CONVERSATION HOOK...\``, { parse_mode: 'MarkdownV2' });
  await ctx.conversation.enter('executeDispatchConversation');
});
bot.callbackQuery('noop', async (ctx) => await ctx.answerCallbackQuery());
export const POST = webhookCallback(bot, 'next-js') as unknown as (req: Request) => Promise<Response>;