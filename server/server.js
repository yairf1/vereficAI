// server/server.js
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const axios = require("axios");
const langdetect = require("langdetect");
const app = express();
require("dotenv").config({ path: path.join(__dirname, ".env") });

// 1) Env vars
const { API_KEY, SEARCH_ENGINE_ID } = process.env;
const PORT = 5000;
if (!API_KEY || !SEARCH_ENGINE_ID) {
  console.error(
    " Missing API_KEY, SEARCH_API_KEY, or SEARCH_ENGINE_ID in .env"
  );
  process.exit(1);
}

// Crash-guards
process.on("uncaughtException", (err) =>
  console.error(" Uncaught Exception:", err)
);
process.on("unhandledRejection", (reason) =>
  console.error(" Unhandled Rejection:", reason)
);

console.log("server.js loaded");
console.log(" __dirname:", __dirname);
console.log(" process.cwd():", process.cwd());
console.log(" Env vars:", {
  API_KEY: API_KEY ? " loaded" : " missing",
  SEARCH_ENGINE_ID: SEARCH_ENGINE_ID ? " loaded" : " missing",
});

// Google AI client
const genAI = new GoogleGenerativeAI(API_KEY);

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://ec2-16-171-254-122.eu-north-1.compute.amazonaws.com:3000",
    "http://16.171.254.122:3000",
    "http://localhost",
    "http://ec2-16-171-254-122.eu-north-1.compute.amazonaws.com",
    "http://16.171.254.122",
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
});

// function to search the web
async function searchTheWeb(query) {
  try {
    console.log(`Searching the web for: "${query}"`);
    const url = `https://www.googleapis.com/customsearch/v1`;
    const params = {
      key: API_KEY,
      cx: SEARCH_ENGINE_ID,
      q: query,
    };
    const response = await axios.get(url, { params });
    const searchResults = response.data.items || [];

    // a function get the date of the search result
    function extractPublishedDate(item) {
      try {
        const metatags = item.pagemap?.metatags?.[0];
        const rawDate =
          metatags?.["article:published_time"] || metatags?.["og:updated_time"];
        if (!rawDate) return null;
        const date = new Date(rawDate);
        return isNaN(date.getTime()) ? null : date.toLocaleDateString("en-US");
      } catch (e) {
        return null;
      }
    }

    // Format the results into a string for the prompt
    const context = searchResults
      .slice(0, 5)
      .map((item) => {
        const published = extractPublishedDate(item);
        return (
          `Title: ${item.title}\n` +
          (published ? `Published: ${published}\n` : "") +
          `Link: ${item.link}\n` +
          `Snippet: ${item.snippet}\n---`
        );
      })
      .join("\n\n");

    console.log("Search context created, length:", context.length);
    return context;
  } catch (error) {
    console.error(
      "Error during web search:",
      error.response ? error.response.data : error.message
    );
    return "";
  }
}

app.post("/chat", async (req, res) => {
  try {
    const claim = req.body.question;

    // Detect claim language
    let langCode = "en";
    try {
      langCode = langdetect.detectOne(claim) || "en";
    } catch (e) {
      langCode = "en";
    }

    // Search for real-time information first
    const searchContext = await searchTheWeb(claim);
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Define prompts 
    const systemPromptEn = `
        You are a professional fact-checking AI. Your job is to verify whether a specific factual claim is TRUE, FALSE, or UNCERTAIN using ONLY the context provided from recent web search results.
        
        Today’s date is ${today}. If the claim is about today's date, (or other future or past dates e.g. 'tomorrow is xx.xx.xxxx', 'one week ago the date was...') compare it directly to this value without needing additional sources.
        
        Always use the most recent information available in the context to determine the truth.
        
        You may infer a claim to be TRUE or FALSE if the context includes strong indirect evidence that would reasonably support it. For example, if a claim says “X is alive” and recent context refers to them in the present tense, it can be inferred TRUE even if it doesn't say “X is alive” explicitly. This also applies to other claims involving positions, actions, or statuses that are clearly evident from current phrasing.
        
        Avoid being overly cautious — if the evidence is indirect but clear and recent, return a confident answer.
        
        Only respond with UNCERTAIN if the evidence is missing, outdated, or clearly contradictory. Do not use UNCERTAIN just because the information is indirectly stated or implied — evaluate whether a reasonable person could confidently infer the truth from the context.
        
        If multiple sources conflict, resolve contradictions by preferring:
        1. The most recent publication date, if available.
        2. Official or highly credible sources (e.g., .gov, .edu, Wikipedia, major news outlets).
        If the claim is a known conspiracy theory and the context either avoids confirming it or presents it as a myth, you may return **FALSE**.
        
        Respond in this EXACT format and *only* in the language that the provided claim are writen in:
        - the statment is:
            TRUE, FALSE, or UNCERTAIN — only the TRUE, FALSE or UNCERTAIN in uppercase as the title.
        - summarry:
           Two or three short sentences explaining your reasoning based only on the context and the known current date if applicable.
        - sources: 
            A list of the sources you used, including their URLs.
        
            Do NOT use any outside knowledge. Only use the information from the context or the known current date.
        Here is the context from recent web search results:
        --- CONTEXT START ---
        ${searchContext}
        --- CONTEXT END ---
        
        Now, using only the context above, verify this claim: "${claim}"
    `;

    const systemPromptHe = `
      אתה בינה מלאכותית מקצועית לאימות עובדות. תפקידך הוא לבדוק האם טענה עובדתית מסוימת היא נכונה (TRUE), שגויה (FALSE) או לא ודאית (UNCERTAIN) תוך שימוש אך ורק בהקשר שסופק מתוצאות חיפוש עדכניות ברשת.

      התאריך היום הוא ${today}. אם הטענה עוסקת בתאריך של היום (או בתאריכים עתידיים או עברוים, לדוג' "מחר זה xx.xx.xxxx", "לפני שבוע התאריך היה..."), השווה ישירות לערך זה ללא צורך במקורות נוספים.

      השתמש תמיד במידע העדכני ביותר הזמין בהקשר כדי לקבוע את האמת.

      מותר לך להסיק שטענה היא נכונה או שגויה אם ההקשר כולל ראיות עקיפות חזקות שתומכות בכך באופן סביר. לדוג', אם טענה אומרת "X חי" ובהקשר העדכני מתייחסים אליו בזמן הווה, ניתן להסיק שהיא נכונה גם אם לא נאמר במפורש "X חי". זה תקף גם לטענות אחרות על תפקידים, פעולות או מצבים הברורים מהניסוח הנוכחי.

      הימנע מזהירות יתר — אם הראיות עקיפות אך ברורות ועדכניות, תן תשובה בטוחה.

      ענה "לא ודאי" (UNCERTAIN) רק אם הראיות חסרות, מיושנות או סותרות בבירור. אל תשתמש ב-"לא ודאי" רק כי המידע מרומז — הערך האם אדם סביר היה יכול להסיק בביטחון את האמת מההקשר.

      אם יש סתירות בין מקורות, העדף:
      1. את תאריך הפרסום העדכני ביותר, אם קיים.
      2. מקורות רשמיים או אמינים במיוחד (למשל gov., edu., ויקיפדיה, אתרי חדשות מרכזיים).
      אם הטענה היא תאוריית קונספירציה מוכרת ובהקשר נמנע מלאשר אותה או מוצגת כמיתוס, ניתן להשיב FALSE.

      ענה בדיוק בפורמט הזה ובאותה שפה שבה נכתבה הטענה:
      - ההצהרה היא:
         והמילה בעברית - נכון, לא נכון, לא בטוח TRUE, FALSE או UNCERTAIN — המילה באנגלית באותיות גדולות. 
      - סיכום:
          שתיים או שלוש משפטים קצרים המסבירים את הנימוק שלך בהתבסס רק על ההקשר והתאריך הידוע.
      - מקורות:
          רשימת המקורות בהם השתמשת, כולל כתובות URL.

      אל תשתמש בידע חיצוני. השתמש רק במידע מההקשר או מהתאריך הידוע.
      הנה ההקשר מתוצאות חיפוש עדכניות ברשת:
      --- התחלת הקשר ---
      ${searchContext}
      --- סוף הקשר ---

      כעת, תוך שימוש רק בהקשר למעלה, אמת את הטענה: "${claim}"
    `;

    const systemPromptRu = `
      Вы — профессиональный искусственный интеллект для проверки фактов. Ваша задача — определить, является ли конкретное утверждение ИСТИННЫМ (TRUE), ЛОЖНЫМ (FALSE) или НЕОПРЕДЕЛЁННЫМ (UNCERTAIN), используя ТОЛЬКО контекст, предоставленный из последних результатов поиска в интернете.

      Сегодняшняя дата: ${today}. Если утверждение связано с сегодняшней датой (или другими будущими или прошлыми датами, например: "завтра xx.xx.xxxx", "неделю назад была дата..."), сравните это напрямую с этим значением без необходимости в дополнительных источниках.

      Всегда используйте самую свежую доступную информацию из контекста для определения истины.

      Вы можете сделать вывод, что утверждение ИСТИННО или ЛОЖНО, если в контексте есть сильные косвенные доказательства, которые разумно это подтверждают. Например, если утверждается "X жив", а в недавнем контексте о нём говорится в настоящем времени, можно сделать вывод, что утверждение ИСТИННО, даже если прямо не сказано "X жив". Это также относится к другим утверждениям о должностях, действиях или статусах, явно выраженных в текущей формулировке.

      Избегайте излишней осторожности — если доказательства косвенные, но ясные и свежие, дайте уверенный ответ.

      Отвечайте "НЕОПРЕДЕЛЁННО" (UNCERTAIN) только если доказательства отсутствуют, устарели или явно противоречат друг другу. Не используйте "НЕОПРЕДЕЛЁННО" только потому, что информация косвенная — оцените, может ли разумный человек уверенно сделать вывод из контекста.

      Если источники противоречат друг другу, отдавайте предпочтение:
      1. Самой свежей дате публикации, если она есть.
      2. Официальным или очень авторитетным источникам (например, .gov, .edu, Википедия, крупные новостные издания).
      Если утверждение — известная теория заговора, и в контексте это не подтверждается или представлено как миф, можно ответить FALSE.

      Отвечайте ТОЧНО в этом формате и только на том языке, на котором написано утверждение:
      - утверждение:
          TRUE, FALSE или UNCERTAIN — только это слово на английском заглавными буквами.
      - краткое объяснение:
          Два-три коротких предложения, объясняющих вашу логику, основываясь только на контексте и известной текущей дате.
      - источники:
          Список использованных источников с их URL.

      НЕ используйте внешние знания. Используйте только информацию из контекста или известной даты.
      Вот контекст из последних результатов поиска:
      --- НАЧАЛО КОНТЕКСТА ---
      ${searchContext}
      --- КОНЕЦ КОНТЕКСТА ---

      Теперь, используя только приведённый выше контекст, проверьте это утверждение: "${claim}"
    `;

    // Choose the prompt based on detected language
    let systemPrompt = systemPromptEn;
    if (langCode === "he") systemPrompt = systemPromptHe;
    else if (langCode === "ru") systemPrompt = systemPromptRu;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite-preview-06-17",
    });
    const result = await model.generateContent(systemPrompt);
    const response = result.response;
    const answer = response.text();
    console.log(" Fact Check Reply:\n", answer);
    res.json({ reply: answer });
  } catch (err) {
    console.error("error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(` Server listening on port ${PORT}`);
});
