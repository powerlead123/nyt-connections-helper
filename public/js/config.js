/**
 * Configuration file for NYT Connections Helper
 */

const config = {
  // OpenAI API configuration
  openai: {
    apiKey: '', // Add your OpenAI API key here
    model: 'gpt-3.5-turbo', // Default model
    endpoint: 'https://api.openai.com/v1/chat/completions'
  },
  
  // AI hint configuration
  hints: {
    // System messages for different hint types
    systemMessages: {
      light: `You are an AI assistant helping with the NYT Connections game. 
        For light hints, be very vague and only hint at the general theme or category. 
        Never mention specific words from the puzzle.`,
      
      medium: `You are an AI assistant helping with the NYT Connections game. 
        For medium hints, you can mention one specific word and suggest how it relates to others, 
        but don't reveal the full category.`,
      
      answer: `You are an AI assistant helping with the NYT Connections game. 
        For answer hints, explain the full category and list all words that belong to it. 
        Also explain why these words are connected.`
    },
    
    // Temperature settings for different hint types
    temperature: {
      light: 0.7,
      medium: 0.6,
      answer: 0.5
    },
    
    // Max tokens for different hint types
    maxTokens: {
      light: 50,
      medium: 100,
      answer: 150
    }
  }
}; 