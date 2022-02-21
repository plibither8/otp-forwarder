import clipboard from "clipboardy";
import "dotenv/config.js";
import express from "express";
import notifier from "node-notifier";
import parse from "parse-otp-message";

interface ParsedMessage {
  code: string;
  service?: string;
}

const server = express();
const port = Number(process.env.PORT) || 3000;

server.get("/", (req, res) => {
  res.send(
    "Thanks for dropping by! Visit https://github.com/plibither8/otp-forwarder for more info ;)"
  );
});

server.post("/otp", async (req, res) => {
  const {
    default: { text },
  } = await import("body-parser");
  await new Promise((resolve) => text()(req, res, resolve));

  const { body, headers } = req;
  if (headers.authorization !== process.env.AUTH_TOKEN) {
    res.sendStatus(403);
    return;
  }

  const parsed = parse(body) as ParsedMessage;
  if (parsed && parsed.code) {
    notifier.notify({
      title: `SMS OTP - ${parsed.code}`,
      message: `${parsed.code} is your OTP. Click to copy to clipboard.`,
      icon: "Telegram Icon",
      sound: true,
    });
    return;
  }

  res.end();
});

server.listen(port, "0.0.0.0", () => {
  console.log("Server started at", `http://localhost:${port}`);
});

notifier.on("click", (_, { message }) => {
  const otp = message.split(" is your OTP")[0];
  clipboard.writeSync(otp);
});
