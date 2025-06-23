// server/server.js
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');
const axios = require('axios'); // <-- NEW: For making HTTP requests
const app = express();
require('dotenv').config({ path: path.join(__dirname, '.env') });

// 1) Env vars
const { API_KEY, SEARCH_ENGINE_ID } = process.env;
const PORT = 5000;
if (!API_KEY || !SEARCH_ENGINE_ID) {
  console.error(' Missing API_KEY, SEARCH_API_KEY, or SEARCH_ENGINE_ID in .env');
  process.exit(1);
}

// Crash-guards 
process.on('uncaughtException', err => console.error(' Uncaught Exception:', err));
process.on('unhandledRejection', reason => console.error(' Unhandled Rejection:', reason));

console.log('server.js loaded');
console.log(' __dirname:', __dirname);
console.log(' process.cwd():', process.cwd());
console.log(' Env vars:', {
  API_KEY: API_KEY ? ' loaded' : ' missing',
  SEARCH_ENGINE_ID: SEARCH_ENGINE_ID ? ' loaded' : ' missing',
});

// 4) Google AI client
const genAI = new GoogleGenerativeAI(API_KEY);

// ... (Middleware remains the same) ...
app.use(express.json());
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://ec2-16-171-254-122.eu-north-1.compute.amazonaws.com:3000',
    'http://16.171.254.122:3000',
    'http://localhost',
    'http://ec2-16-171-254-122.eu-north-1.compute.amazonaws.com',
    'http://16.171.254.122',
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers','X-Requested-With,content-type');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});

app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!' });
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
          const rawDate = metatags?.["article:published_time"] || metatags?.["og:updated_time"];
          if (!rawDate) return null;
          const date = new Date(rawDate);
          return isNaN(date.getTime()) ? null : date.toLocaleDateString('en-US');
        } catch (e) {
          return null;
        }
      }

      // Format the results into a string for the LLM
      const context = searchResults.slice(0, 5).map(item => {
        const published = extractPublishedDate(item);
        return (
          `Title: ${item.title}\n` +
          (published ? `Published: ${published}\n` : '') +
          `Link: ${item.link}\n` +
          `Snippet: ${item.snippet}\n---`
        );
      }).join('\n\n');


      console.log('Search context created, length:', context.length);
      return context;
    } catch (error) {
        console.error('Error during web search:', error.response ? error.response.data : error.message);
        return ''; // Return empty string on error
    }
}

app.post('/chat', async (req, res) => {
    try {
        const claim = req.body.question;
        
        // 1. Search for real-time information first
        const searchContext = await searchTheWeb(claim);

        // 2. Augment the prompt with the search results
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const systemPrompt = `
          You are a professional fact-checking AI. Your job is to verify whether a specific factual claim is TRUE, FALSE, or UNCERTAIN using ONLY the context provided from recent web search results.

          Today’s date is ${today}. If the claim is about today's date, (or other future or past dates e.g. 'tomorrow is xx.xx.xxxx', 'one week ago the date was...') compare it directly to this value without needing additional sources.

          If the claim contains time-sensitive words like "currently", "today", or "as of now", use the most recent information available in the context to determine the truth.

          If multiple sources conflict, resolve contradictions by preferring:
          1. The most recent publication date, if available.
          2. Official or highly credible sources (e.g., .gov, .edu, Wikipedia, major news outlets).

          If no clear conclusion can be reached from the context alone, return **UNCERTAIN**.

          If the claim is a known conspiracy theory and the context either avoids confirming it or presents it as a myth, you may return **FALSE**.

          If the claim is nonsense, ghibberish, or not a factual statement,(e.g. 'ihfdbvoih', 'i love you', 'i think my friend's hair is ugly', 'justin biber is a bad singer') return **UNCERTAIN**, mention in the summary that you didnt understand what the user meant in this statement, and dont mention any source.

          If the claim expresses an opinion, feeling, or subjective judgment (e.g., "X is better", "I love Y", "Z is ugly"), return **UNCERTAIN**, mention that it cannot be verified as a factual claim, and dont mention any source.

          If the claim is vague, lacks clear subjects, or refers to unspecified times, people, or events, return **UNCERTAIN** and explain that the claim is too ambiguous to verify.

          If the claim appears to be a joke, meme, satire, or intentionally absurd statement, return **UNCERTAIN** and explain that you do not interpret jokes or satire as factual claims.

          If the claim is a conditional, hypothetical, or speculative statement (e.g., "if X, then Y"), return **UNCERTAIN** and explain that such statements cannot be verified as true or false.

          Do not use your own internal definitions or facts. If the meaning of a word, location, or term is not explained in the context, return **UNCERTAIN**.

          If the claim includes a specific number, statistic, or date, only verify it if an exact match is found in the context. Do not estimate or guess.

          If the context contains directly conflicting statements with no clear resolution (e.g., two credible sources saying opposite things), return **UNCERTAIN**.

          Respond in this EXACT format and only lowercase:
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

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const answer = response.text();

        console.log(' Fact Check Reply:\n', answer);

        res.json({ reply: answer });
    } catch (err) {
        console.error(' Google AI error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
  console.log(` Server listening on port ${PORT}`);
});