import parse from "parse-otp-message";

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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { method, url, headers } = request;
    const { pathname } = new URL(url);

    if (method === "POST" && pathname === "/") {
      const authorization = headers.get("authorization");
      if (authorization !== `Bearer ${env.AUTH_TOKEN}`)
        return new Response("Unauthorized", { status: 401 });

      const body = await request.text();
      if (!body) return new Response("Request body is empty", { status: 400 });

      const { code, service } = (parse(body) ?? {}) as ParsedMessage;
      if (!code) return new Response("No OTP code found", { status: 400 });

      // Check if the code is valid
      if (!code.match(CODE_REGEX))
        return new Response("Invalid code", { status: 400 });

      // Send the OTP to the client
      try {
        await fetch(`${env.CLIENT_URL}/otp/${code}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.AUTH_TOKEN}`,
          },
        });
      } catch (err) {
        return new Response(
          `An error occured while sending OTP to client: ${err}`,
          { status: 500 }
        );
      }

      // Send Telegram notification
      if (env.TG_TOKEN) {
        try {
          await fetch(
            `https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                chat_id: env.TG_CHAT_ID,
                text: `${code}${service ? ` (${service})` : ""}`,
              }),
            }
          );
        } catch (err) {
          return new Response(
            `An error occured while sending OTP to Telegram: ${err}`,
            { status: 500 }
          );
        }
      }

      return new Response("OTP processed and sent successfully!");
    }

    return new Response(
      "Thanks for dropping by! Visit https://github.com/plibither8/otp-forwarder for more info ;)"
    );
  },
};
