import { SYSTEM_PROMPT } from './_prompt.js';

const MAX_MESSAGES = 12;
const MAX_CHARS = 1000;

/** Keeps the latest user and assistant turns that contain text, each trimmed to a sane size. */
function sanitizeMessages(input) {
    if (!Array.isArray(input)) return [];
    return input
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
        .slice(-MAX_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const messages = sanitizeMessages(req.body?.messages);
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    if (messages.length === 0) {
        return res.status(400).json({ error: 'Send at least one message.' });
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // the persona always comes from the server; client system messages were dropped above
                messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
                model: 'llama-3.3-70b-versatile',
                // short, chat-sized replies keep latency and token cost predictable
                max_tokens: 400,
                temperature: 0.6
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to fetch from Groq');
        }

        // pass on only the reply, in the same shape the Play page already reads
        const content = data.choices?.[0]?.message?.content ?? '';
        return res.status(200).json({ choices: [{ message: { role: 'assistant', content } }] });
    } catch (error) {
        // details stay in the server log; the browser only gets a generic message
        console.error('Groq API Error:', error);
        return res.status(502).json({ error: 'The AI service did not respond. Please try again.' });
    }
}
