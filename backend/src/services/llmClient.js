const axios = require('axios');

const COHERE_API_KEY = process.env.COHERE_API_KEY;
const MODEL = process.env.LLM_MODEL || 'command-r-plus';

class LLMClient {
  async chat(messages, maxTokens = 300, temperature = 0.2) {
    if (!COHERE_API_KEY) {
      throw new Error('COHERE_API_KEY not set in environment variables');
    }

    try {
      const response = await axios.post(
        'https://api.cohere.com/v1/chat',
        {
          model: MODEL,
          messages: messages,
          max_tokens: maxTokens,
          temperature: temperature,
        },
        {
          headers: {
            'Authorization': `Bearer ${COHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // v1 API response format
      if (response.data && response.data.text) {
        return response.data.text;
      }

      // v2 API response format
      if (response.data?.message?.content?.[0]?.text) {
        return response.data.message.content[0].text;
      }

      throw new Error('Unexpected response format from Cohere API');
    } catch (error) {
      console.error('LLM API Error:', error.message);
      throw error;
    }
  }
}

module.exports = new LLMClient();
