const axios = require('axios');

async function getSentiment(symbol) {
  const apiKey = process.env.OPENAI_API_KEY || '';
  const endpoint = process.env.OPENAI_ENDPOINT || 'https://openrouter.ai/api/v1';
  const model = process.env.OPENAI_MODEL || 'openrouter/free';

  if (!apiKey) {
    return { polarity: 0, headlines: [], sentiment_pol: 'Neutral', pos: 0, neg: 0, neutral: 7 };
  }

  try {
    const prompt = `Fetch the 5 most recent financial news headlines about ${symbol} stock from the web.
Classify each headline's sentiment as positive, neutral, or negative.

Return ONLY a JSON array of objects with exactly these fields:
[{"title": "headline text", "sentiment": "positive"}]

Do not add any additional text, explanations, or markdown formatting.`;

    const url = `${endpoint.replace(/\/$/, '')}/chat/completions`;
    const response = await axios.post(
      url,
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 2000,
        tools: [{ type: 'openrouter:web_search', parameters: { max_results: 5 } }]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    let content = response.data?.choices?.[0]?.message?.content?.trim() || '[]';
    if (content.startsWith('```')) {
      content = content.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
    }

    const data = JSON.parse(content);
    const headlines = [];
    let pos = 0, neg = 0, neutral = 0;

    if (Array.isArray(data)) {
      for (const item of data.slice(0, 5)) {
        const title = item.title || '';
        if (title) {
          headlines.push(title);
          const sentimentStr = (item.sentiment || 'neutral').toLowerCase();
          if (sentimentStr.includes('positive')) pos++;
          else if (sentimentStr.includes('negative')) neg++;
          else neutral++;
        }
      }
    }

    const total = pos + neg + neutral;
    const polarity = total > 0 ? (pos - neg) / total : 0;
    const sentiment_pol = polarity > 0.2 ? 'Positive' : polarity < -0.2 ? 'Negative' : 'Neutral';

    return { polarity, headlines, sentiment_pol, pos, neg, neutral };
  } catch (err) {
    console.error('JS OpenRouter sentiment error:', err.message);
    return { polarity: 0, headlines: [], sentiment_pol: 'Neutral', pos: 0, neg: 0, neutral: 7 };
  }
}

module.exports = { getSentiment };
