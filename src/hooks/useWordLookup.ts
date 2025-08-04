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

interface TranslationsData {
  word: string;
  translations: Record<string, string[]>;
}

interface EtymologyData {
  word: string;
  etymology?: string;
  source: 'dbnary';
  retrievedAt: string;
}

interface LookupData {
  dictionary?: DictionaryData;
  synonyms?: SynonymsData;
  translations?: TranslationsData;
  etymology?: EtymologyData;
  error?: string;
}

async function fetchWordLookup(word: string, includeEtymology: boolean = false): Promise<LookupData> {
  console.log('fetchWordLookup called with word:', word, 'etymology:', includeEtymology);
  
  if (!word || word.trim().length === 0) {
    console.log('Word is empty or invalid');
    throw new Error('Word is required');
  }

  const params = new URLSearchParams({
    word: word.trim(),
  });
  
  if (includeEtymology) {
    params.append('etymology', 'true');
  }

  const url = `/api/lookup?${params.toString()}`;
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

export function useWordLookup(word: string, includeEtymology: boolean = false) {
  console.log('useWordLookup called with word:', word, 'etymology:', includeEtymology);
  console.log('Query enabled:', !!word && word.trim().length > 0);
  
  return useQuery({
    queryKey: ['wordLookup', word, includeEtymology],
    queryFn: () => fetchWordLookup(word, includeEtymology),
    enabled: !!word && word.trim().length > 0,
    staleTime: 1000 * 60 * 60 * 24, // 24時間
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
} 