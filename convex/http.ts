import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// This sets up an endpoint at: https://your-deployment.convex.site/telegram
http.route({
  path: "/telegram",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // 1. Grab the live message payload sent by Telegram
      const rawBody = await request.text();
      
      // 2. Safely hand it off to your background action handler
    await ctx.runAction(api.bot.handlers.handleWebhookUpdate, {
        payload: rawBody,
      });

      // 3. Respond with a 200 OK so Telegram knows we got it
      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Webhook processing failed:", error);
      return new Response("Internal Error", { status: 500 });
    }
  }),
});

export default http;