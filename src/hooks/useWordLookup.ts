import { useQuery } from '@tanstack/react-query';

interface DictionaryData {
  word: string;
  phonetic?: string;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
    }>;
  }>;
}

interface SynonymsData {
  word: string;
  synonyms: string[];
  antonyms?: string[];
}

interface LookupData {
  dictionary?: DictionaryData;
  synonyms?: SynonymsData;
  error?: string;
}

async function fetchWordLookup(word: string): Promise<LookupData> {
  console.log('fetchWordLookup called with word:', word);
  
  if (!word || word.trim().length === 0) {
    console.log('Word is empty or invalid');
    throw new Error('Word is required');
  }

  const url = `/api/lookup?word=${encodeURIComponent(word.trim())}`;
  console.log('Making API request to:', url);
  
  const response = await fetch(url);
  
  console.log('API response status:', response.status);
  
  if (!response.ok) {
    console.error('API request failed:', response.status, response.statusText);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log('API response data:', data);
  return data;
}

export function useWordLookup(word: string) {
  console.log('useWordLookup called with word:', word);
  console.log('Query enabled:', !!word && word.trim().length > 0);
  
  return useQuery({
    queryKey: ['wordLookup', word],
    queryFn: () => fetchWordLookup(word),
    enabled: !!word && word.trim().length > 0,
    staleTime: 1000 * 60 * 60 * 24, // 24時間
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
} 