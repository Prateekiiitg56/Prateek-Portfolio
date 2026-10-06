const express = require('express');
const cors = require('cors');

// Load env from .env/.env.local if present
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  require('dotenv').config({ path: '.env.local' });
  require('dotenv').config();
} catch {
  // dotenv not installed or no env files - that's fine
}

const app = express();
app.use(express.json({ limit: '1mb' }));

// Only needed if you hit the API directly (not via Vite proxy)
app.use(
  cors({
    origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/],
    methods: ['POST', 'OPTIONS'],
  })
);

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post('/api/chat', async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({
      error: 'Missing GROQ_API_KEY',
      details:
        'Create a Groq API key and add GROQ_API_KEY=... to .env.local (do not put it in client code).',
    });
  }
  // Run the same handler Vercel uses in production, so local and deployed behaviour match.
  // api/chat.js is an ES module, hence the dynamic import from this CommonJS file.
  const { default: handler } = await import('../api/chat.js');
  return handler(req, res);
});

// DEV_API_PORT is shared with the Vite proxy (vite.config.ts); set it in .env.local if 8787 is taken.
const port = Number(process.env.DEV_API_PORT || process.env.PORT || 8787);
// Express 5 calls this with an error when the server cannot start.
app.listen(port, (err) => {
  if (err?.code === 'EADDRINUSE') {
    console.error(
      `[dev-api] port ${port} is already in use. Add DEV_API_PORT=<free port> to .env.local and run npm run dev again.`
    );
    process.exit(1);
  }
  if (err) throw err;
  console.log(`[dev-api] listening on http://localhost:${port}`);
});
