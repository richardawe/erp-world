const AI_KEYWORDS = [
  // Core AI terms
  'artificial intelligence',
  'ai',
  'machine learning',
  'ml',
  'deep learning',
  'neural network',
  
  // Modern AI
  'generative ai',
  'gen ai',
  'large language model',
  'llm',
  'chatgpt',
  'gpt',
  'copilot',
  'openai',
  'bard',
  'claude',
  'gemini',
  
  // AI Applications
  'ai-powered',
  'ai powered',
  'ai-driven',
  'ai driven',
  'ai-enabled',
  'ai enabled',
  'ai capabilities',
  'ai features',
  'ai technology',
  'ai solution',
  
  // Business AI
  'intelligent automation',
  'cognitive computing',
  'predictive analytics',
  'natural language processing',
  'nlp',
  'robotic process automation',
  'rpa',
  'automated workflow',
  'smart automation',
  'intelligent process',
  'ai transformation',
  'digital assistant',
  'virtual assistant',
  'intelligent assistant',
  'conversational ai',
  'ai analytics',
  'predictive intelligence',
  
  // ERP-specific AI
  'intelligent erp',
  'smart erp',
  'ai integration',
  'automated decision',
  'intelligent decision',
  'smart decision',
  'predictive maintenance',
  'automated reporting',
  'intelligent insights',
  'smart insights',
  'automated processing',
  'intelligent processing'
];

// Helper function to clean text for better matching
function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isAIRelated(text: string): boolean {
  if (!text) return false;
  
  const cleanedText = cleanText(text);
  
  // Check for exact matches first
  const hasExactMatch = AI_KEYWORDS.some(keyword => {
    const cleanedKeyword = cleanText(keyword);
    return cleanedText.includes(` ${cleanedKeyword} `) || 
           cleanedText.startsWith(`${cleanedKeyword} `) || 
           cleanedText.endsWith(` ${cleanedKeyword}`) ||
           cleanedText === cleanedKeyword;
  });

  if (hasExactMatch) {
    return true;
  }

  // Check for compound matches (e.g., "AI" near "automation" or "intelligence")
  const hasAITerm = cleanedText.includes('ai') || 
                    cleanedText.includes('artificial intelligence') ||
                    cleanedText.includes('machine learning');
                    
  if (hasAITerm) {
    const relatedTerms = [
      'automation',
      'intelligence',
      'smart',
      'cognitive',
      'predictive',
      'automated',
      'processing',
      'analytics',
      'insight'
    ];
    
    return relatedTerms.some(term => cleanedText.includes(term));
  }

  return false;
}

export function getAIKeywords(text: string): string[] {
  if (!text) return [];
  
  const cleanedText = cleanText(text);
  return AI_KEYWORDS.filter(keyword => {
    const cleanedKeyword = cleanText(keyword);
    return cleanedText.includes(` ${cleanedKeyword} `) || 
           cleanedText.startsWith(`${cleanedKeyword} `) || 
           cleanedText.endsWith(` ${cleanedKeyword}`) ||
           cleanedText === cleanedKeyword;
  });
} 