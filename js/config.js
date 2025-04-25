const config = {
    // AI API configuration
    ai: {
        apiKey: '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',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'google/gemma-3-12b-it:free'
    },
    
    hints: {
        light: {
            buttonText: "Give a little hint",
            description: "Get a subtle hint that gently guides you towards the solution"
        },
        medium: {
            buttonText: "Give more hints",
            description: "Get a more detailed hint that provides clearer direction"
        },
        answer: {
            buttonText: "Show final answer",
            description: "Reveal the complete solution"
        }
    },
    // Additional configurations can be added here
};

// Prevent modifications to the config object
Object.freeze(config);

// Export the config object
export { config }; 