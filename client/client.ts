import clipboard from "clipboardy";
import "dotenv/config.js";
import express, { NextFunction, Request, Response } from "express";
import notifier from "node-notifier";

const CODE_REGEX = /^[0-9]+$/;

const server = express();
const port = Number(process.env.PORT) || 3000;

notifier.on("click", (_, { message }) => {
  const otp = message.split(" is your OTP")[0];
  clipboard.writeSync(otp);
});

const authGuard = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers.authorization !== `Bearer ${process.env.AUTH_TOKEN}`)
    return res.status(401).send("Unauthorized");
  next();
};

server.post("/otp/:code", authGuard, async (req, res) => {
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

server.all("*", (_req, res) => {
  res.send(
    "Thanks for dropping by! Visit https://github.com/plibither8/otp-forwarder for more info ;)"
  );
});

server.listen(port, "0.0.0.0", () => {
  console.log("Server started at", `http://localhost:${port}`);
});
