import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/telegram",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const rawBody = await request.text();
      if (!rawBody) return new Response("OK", { status: 200 });

      // Call the action but don't await if we want to be super fast, 
      // however for reliability we await since we stripped libraries.
      await ctx.runAction(api.bot.handlers.handleWebhookUpdate, {
        payload: rawBody,
      });

      return new Response("OK", { status: 200 });
    } catch (error: any) {
      console.error("WEBHOOK_FAILURE:", error.message);
      return new Response("OK", { status: 200 });
    }
  }),
});

export default http;
