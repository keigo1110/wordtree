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
  if (!word || word.trim().length === 0) {
    throw new Error('Word is required');
  }

  const response = await fetch(`/api/lookup?word=${encodeURIComponent(word.trim())}`);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export function useWordLookup(word: string) {
  return useQuery({
    queryKey: ['wordLookup', word],
    queryFn: () => fetchWordLookup(word),
    enabled: !!word && word.trim().length > 0,
    staleTime: 1000 * 60 * 60 * 24, // 24時間
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
} 