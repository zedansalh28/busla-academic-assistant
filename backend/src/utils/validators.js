const { v4: uuidv4 } = require('uuid');

const generateSessionId = () => uuidv4();
const generateUserId = () => uuidv4();
const generateId = () => uuidv4();

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateRequired = (data, fields) => {
  for (const field of fields) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
};

const validateMessage = (message) => {
  if (!message || typeof message !== 'string') {
    throw new Error('Message must be a non-empty string');
  }
  if (message.trim().length === 0) {
    throw new Error('Message cannot be empty');
  }
  if (message.length > 5000) {
    throw new Error('Message too long (max 5000 characters)');
  }
};

const validateProfile = (profile) => {
  const required = ['major', 'year', 'learning_style'];
  for (const field of required) {
    if (!profile[field]) {
      throw new Error(`Missing profile field: ${field}`);
    }
  }
};

module.exports = {
  generateSessionId,
  generateUserId,
  generateId,
  validateEmail,
  validateRequired,
  validateMessage,
  validateProfile,
};
