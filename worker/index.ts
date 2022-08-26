import parse from "parse-otp-message";
import { Hono } from "hono";

interface Env {
  AUTH_TOKEN: string;
  CLIENT_URL: string;
  TG_TOKEN?: string;
  TG_CHAT_ID?: string | number;
}

interface ParsedMessage {
  code: string;
  service?: string;
}

const CODE_REGEX = /^[0-9]+$/;

const app = new Hono<Env>();

app.post("/", async (ctx) => {
  const { headers } = ctx.req;

  const authorization = headers.get("authorization");
  if (authorization !== `Bearer ${ctx.env.AUTH_TOKEN}`)
    return ctx.text("Unauthorized", 401);

  const body = await ctx.req.text();
  if (!body) return ctx.text("Request body is empty", 400);

  const { code, service } = (parse(body) ?? {}) as ParsedMessage;
  if (!code) return ctx.text("No OTP code found", 400);

  // Check if the code is valid
  if (!code.match(CODE_REGEX)) return ctx.text("Invalid code", 400);

  // Send the OTP to the client
  try {
    await fetch(`${ctx.env.CLIENT_URL}/otp/${code}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ctx.env.AUTH_TOKEN}`,
      },
    });
  } catch (err) {
    return ctx.text(
      `An error occured while sending OTP to client: ${err}`,
      500
    );
  }

  // Send Telegram notification
  if (ctx.env.TG_TOKEN) {
    try {
      await fetch(
        `https://api.telegram.org/bot${ctx.env.TG_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: ctx.env.TG_CHAT_ID,
            text: `${code}${service ? ` (${service})` : ""}`,
          }),
        }
      );
    } catch (err) {
      return ctx.text(
        `An error occured while sending OTP to Telegram: ${err}`,
        500
      );
    }
  }

  return ctx.text("OTP processed and sent successfully!");
});

app.all("*", (ctx) =>
  ctx.text(
    "Thanks for dropping by! Visit https://github.com/plibither8/otp-forwarder for more info ;)"
  )
);

export default app;
