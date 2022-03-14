import type { BodyParser } from "body-parser";
import "dotenv/config.js";
import express, { NextFunction, Request, Response } from "express";
import got from "got";
import notifier from "node-notifier";
import parse from "parse-otp-message";

interface ParsedMessage {
  code: string;
  service?: string;
}

const CODE_REGEX = /^[0-9]+$/;

const server = express();
const port = Number(process.env.PORT) || 3000;
let text: BodyParser["text"];

const authGuard = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers.authorization !== `Bearer ${process.env.AUTH_TOKEN}`)
    return res.status(401).send("Unauthorized");
  next();
};

// To be handled by server on the VPS
server.post(
  "/",
  authGuard,
  async (req, res, next) => {
    if (!text)
      ({
        default: { text },
      } = await import("body-parser"));
    text()(req, res, next);
  },
  async (req, res) => {
    if (process.env.IS_CLIENT)
      return res.status(400).send("Route accessible from server only");

    const { code, service } = parse(req.body) as ParsedMessage;
    if (!code) return res.status(400).send("No OTP code found");

    // Check if the code is valid
    if (!code.match(CODE_REGEX)) return res.status(400).send("Invalid code");

    // Send the OTP to the machine
    try {
      await got.post(`${process.env.CLIENT_URL}/otp/${code}`, {
        headers: {
          Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
        },
      });
    } catch (err) {
      console.error(err);
    }

    // Send Telegram notification
    if (process.env.TG_TOKEN) {
      try {
        await got.post(
          `https://api.telegram.org/bot${process.env.TG_TOKEN}/sendMessage`,
          {
            json: {
              chat_id: process.env.TG_CHAT_ID,
              text: `${code}${service ? ` (${service})` : ""}`,
            },
          }
        );
      } catch (err) {
        console.error(err);
      }
    }
  }
);

// To be handled by the client
server.post("/otp/:code", authGuard, async (req, res) => {
  if (!process.env.IS_CLIENT)
    return res.status(400).send("Route accessible from client only");

  const { code } = req.params;

  // Check if the code is valid
  if (!code.match(CODE_REGEX)) return res.status(400).send("Invalid code");

  // Notify on client machine
  try {
    notifier.notify({
      title: `SMS OTP - ${code}`,
      message: `${code} is your OTP. Click to copy to clipboard.`,
      sound: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error sending notification");
  }

  res.send(`Valid OTP: ${code}`);
});

server.get("*", (_req, res) => {
  res.send(
    "Thanks for dropping by! Visit https://github.com/plibither8/otp-forwarder for more info ;)"
  );
});

server.listen(port, "0.0.0.0", () => {
  console.log("Server started at", `http://localhost:${port}`);
});
