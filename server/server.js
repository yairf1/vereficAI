// server/server.js
const path = require("path");
const OpenAI = require("openai");
const express = require("express");
const app = express();
require("dotenv").config({ path: path.join(__dirname, ".env") });

// 1) Env vars
const { OPENAI_API_KEY} = process.env;
const PORT = 5000
if (!OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY in .env");
  process.exit(1);
}

// 2) Crash-guards
process.on("uncaughtException", (err) =>
  console.error("❌ Uncaught Exception:", err)
);
process.on("unhandledRejection", (reason) =>
  console.error("❌ Unhandled Rejection:", reason)
);

// 3) Startup logs
console.log("⏳ ▶️ server.js loaded");
console.log("    • __dirname:", __dirname);
console.log("    • process.cwd():", process.cwd());
console.log("⚙️ Env vars:", {
  OPENAI_API_KEY: OPENAI_API_KEY ? "✅ loaded" : "❌ missing",
});

// 4) OpenAI v4 client
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// middleware
app.use(express.json());
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://ec2-16-171-254-122.eu-north-1.compute.amazonaws.com:3000",
    "http://16.171.254.122:3000",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.get("/test", (req, res) => {
  res.json({ message: "Server is running!" });
})

app.post("/chat", async (req, res) => {
  try {
    const claim = req.body.question;

    const systemPrompt = `
      You are a professional fact-checking AI. Your job is to verify if a news claim is TRUE or FALSE.
      Return your answer in the following format ONLY (in English):
      1. TRUE or FALSE — as a big title (uppercase)
      2. Two short sentences explaining why.
      3. A list of credible sources with URLs (e.g. news, government, or science websites).

      Example output:
      ---
      TRUE  
      The claim is supported by several peer-reviewed studies. Experts in the field have confirmed the accuracy of this information.  
      Sources:  
      - https://www.example.com/study  
      - https://www.example.com/official_report
      ---
      Now, verify this claim: "${claim}"
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }],
    });

    const replyMsg = completion.choices[0].message;
    console.log("✅ Fact Check Reply:\n", replyMsg.content);

    res.json({ reply: replyMsg });
  } catch (err) {
    console.error("❌ OpenAI error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
