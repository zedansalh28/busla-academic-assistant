const axios = require('axios');

const COHERE_API_KEY = process.env.COHERE_API_KEY;
const MODEL = process.env.LLM_MODEL || 'command-r-plus-08-2024';

const isKeyMissing = () =>
  !COHERE_API_KEY || COHERE_API_KEY === 'your_cohere_api_key_here';

class LLMClient {
  async chat(messages, maxTokens = 300, temperature = 0.2) {
    if (isKeyMissing()) {
      const err = new Error('API_KEY_NOT_CONFIGURED');
      err.code = 'API_KEY_NOT_CONFIGURED';
      throw err;
    }

    // Convert OpenAI-style messages to Cohere v1 format
    const systemMsg = messages.find(m => m.role === 'system');
    const preamble = systemMsg?.content || '';

    const nonSystem = messages.filter(m => m.role !== 'system');
    const lastUserMsg = nonSystem.filter(m => m.role === 'user').pop();
    const history = nonSystem.slice(0, -1);

    const chatHistory = history.map(m => ({
      role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
      message: m.content,
    }));

    try {
      const response = await axios.post(
        'https://api.cohere.ai/v1/chat',
        {
          model: MODEL,
          message: lastUserMsg?.content || '',
          preamble,
          chat_history: chatHistory,
          max_tokens: maxTokens,
          temperature,
        },
        {
          headers: {
            Authorization: `Bearer ${COHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.data?.text) return response.data.text;

      throw new Error('Unexpected response format from Cohere API');
    } catch (error) {
      if (error.code === 'API_KEY_NOT_CONFIGURED') throw error;

      if (error.response?.status === 401) {
        const err = new Error('API_KEY_INVALID');
        err.code = 'API_KEY_INVALID';
        throw err;
      }

      console.error('LLM API Error:', error.message);
      throw error;
    }
  }
}

module.exports = new LLMClient();
