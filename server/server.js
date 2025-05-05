// server/server.js
const path    = require('path');
const express = require('express');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// 1) Env vars
const { OPENAI_API_KEY, PORT = 5000 } = process.env;
if (!OPENAI_API_KEY) {
  console.error('❌ Missing OPENAI_API_KEY in .env');
  process.exit(1);
}

// 2) Crash-guards
process.on('uncaughtException',   err => console.error('❌ Uncaught Exception:', err));
process.on('unhandledRejection', reason => console.error('❌ Unhandled Rejection:', reason));

// 3) Startup logs
console.log("⏳ ▶️ server.js loaded");
console.log("    • __dirname:", __dirname);
console.log("    • process.cwd():", process.cwd());
console.log("⚙️ Env vars:", {
  PORT,
  OPENAI_API_KEY: OPENAI_API_KEY ? "✅ loaded" : "❌ missing"
});

// 4) OpenAI v4 client
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// 5) Express setup
const app = express();
app.use(express.json());

app.post('/chat', async (req, res) => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: req.body.prompt }]
    });

    // ✨ PRINT THE RESULT TO THE SERVER CONSOLE ✨
    const replyMsg = completion.choices[0].message;
    console.log('📝 GPT reply:', replyMsg);

    // then send it back
    res.json({ reply: replyMsg });

  } catch (err) {
    console.error('❌ OpenAI error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
