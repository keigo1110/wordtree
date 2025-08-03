import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

interface DictionaryResponse {
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

interface SynonymResponse {
  word: string;
  synonyms: string[];
  antonyms?: string[];
}

interface LookupResponse {
  dictionary?: DictionaryResponse;
  synonyms?: SynonymResponse;
  error?: string;
}

interface DatamuseResponse {
  word: string;
  score: number;
  defs?: string[];
}

// Japanese WordNet データ構造
interface JapaneseWordNetEntry {
  synsetId: string;
  word: string;
  confidence: string;
  partOfSpeech: string;
  definition?: string;
}

// Japanese WordNet データを読み込み
let JAPANESE_WORDNET_DB: Record<string, JapaneseWordNetEntry[]> = {};

// データファイルを読み込む
try {
  const dataPath = path.join(process.cwd(), 'src', 'data', 'japanese-wordnet.json');
  if (fs.existsSync(dataPath)) {
    const wordnetData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    JAPANESE_WORDNET_DB = wordnetData;
    console.log(`Japanese WordNetデータを読み込みました: ${Object.keys(JAPANESE_WORDNET_DB).length} 単語`);
  } else {
    console.warn('Japanese WordNetデータファイルが見つかりません:', dataPath);
    throw new Error('Data file not found');
  }
} catch (error) {
  console.warn('Japanese WordNetデータの読み込みに失敗しました:', error);
  // フォールバック用の基本的なデータ
  JAPANESE_WORDNET_DB = {
    '美しい': [
      {
        synsetId: '00217728-a',
        word: '美しい',
        confidence: 'hand',
        partOfSpeech: '形容詞',
        definition: '感覚を活気づけ、知的情緒的賞賛を喚起する'
      }
    ]
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');

  console.log('API Request received for word:', word);

  if (!word) {
    return NextResponse.json(
      { error: 'Word parameter is required' },
      { status: 400 }
    );
  }

  try {
    console.log('Starting lookup for word:', word);
    console.log('Japanese WordNet DB size:', Object.keys(JAPANESE_WORDNET_DB).length);
    
    const [dictionaryData, synonymsData] = await Promise.allSettled([
      fetchDictionaryData(word),
      fetchSynonymsData(word),
    ]);

    console.log('Dictionary data result:', dictionaryData.status);
    console.log('Synonyms data result:', synonymsData.status);

    const response: LookupResponse = {};

    if (dictionaryData.status === 'fulfilled') {
      response.dictionary = dictionaryData.value;
      console.log('Dictionary data:', response.dictionary);
    }

    if (synonymsData.status === 'fulfilled') {
      response.synonyms = synonymsData.value;
      console.log('Synonyms data:', response.synonyms);
    }

    // エラーハンドリング - どちらか一方でも成功すればOK
    if (dictionaryData.status === 'rejected' && synonymsData.status === 'rejected') {
      console.error('Both dictionary and synonyms failed');
      return NextResponse.json(
        { error: 'Failed to fetch data for the word' },
        { status: 500 }
      );
    }

    console.log('Final response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Lookup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 言語判定関数
function detectLanguage(word: string): 'japanese' | 'english' {
  // 日本語文字（ひらがな、カタカナ、漢字）が含まれているかチェック
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return japaneseRegex.test(word) ? 'japanese' : 'english';
}

async function fetchDictionaryData(word: string): Promise<DictionaryResponse> {
  const language = detectLanguage(word);
  
  if (language === 'japanese') {
    return await fetchJapaneseDictionaryData(word);
  } else {
    return await fetchEnglishDictionaryData(word);
  }
}

async function fetchEnglishDictionaryData(word: string): Promise<DictionaryResponse> {
  try {
    // Datamuse APIを使用して辞書定義を取得
    const response = await fetch(
      `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=d&max=1`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Datamuse API error: ${response.status}`);
    }

    const data = await response.json() as DatamuseResponse[];
    
    if (!Array.isArray(data) || data.length === 0 || !data[0].defs) {
      throw new Error('No dictionary data found');
    }

    const entry = data[0];
    const definitions = entry.defs || [];
    
    // 品詞別に定義を整理
    const meaningsMap = new Map<string, string[]>();
    
    definitions.forEach(def => {
      const [partOfSpeech, definition] = def.split('\t');
      if (partOfSpeech && definition) {
        if (!meaningsMap.has(partOfSpeech)) {
          meaningsMap.set(partOfSpeech, []);
        }
        meaningsMap.get(partOfSpeech)!.push(definition);
      }
    });

    // DictionaryResponse形式に変換
    const meanings = Array.from(meaningsMap.entries()).map(([partOfSpeech, defs]) => ({
      partOfSpeech: partOfSpeech,
      definitions: defs.map(def => ({
        definition: def,
        example: undefined,
      })),
    }));

    return {
      word: entry.word,
      meanings: meanings,
    };
  } catch (error) {
    console.error('English Dictionary API error:', error);
    throw error;
  }
}

async function fetchJapaneseDictionaryData(word: string): Promise<DictionaryResponse> {
  try {
    console.log('Fetching Japanese dictionary data for word:', word);
    console.log('Available words in DB:', Object.keys(JAPANESE_WORDNET_DB).slice(0, 10));
    
    // Japanese WordNetデータベースから検索
    const entries = JAPANESE_WORDNET_DB[word];
    console.log('Direct match entries:', entries);
    
    if (entries && entries.length > 0) {
      console.log('Found direct match for word:', word);
      // 品詞別に整理
      const meaningsMap = new Map<string, Array<{ definition: string; example?: string }>>();
      
      entries.forEach(entry => {
        if (!meaningsMap.has(entry.partOfSpeech)) {
          meaningsMap.set(entry.partOfSpeech, []);
        }
        meaningsMap.get(entry.partOfSpeech)!.push({
          definition: entry.definition || '定義がありません',
          example: undefined,
        });
      });

      const meanings = Array.from(meaningsMap.entries()).map(([partOfSpeech, definitions]) => ({
        partOfSpeech,
        definitions,
      }));

      const result = {
        word,
        meanings,
      };
      console.log('Returning direct match result:', result);
      return result;
    }

    console.log('No direct match found, searching for partial matches...');
    // 部分一致で検索
    for (const [key, entries] of Object.entries(JAPANESE_WORDNET_DB)) {
      if (key.includes(word) || word.includes(key)) {
        console.log('Found partial match with key:', key);
        const meaningsMap = new Map<string, Array<{ definition: string; example?: string }>>();
        
        entries.forEach(entry => {
          if (!meaningsMap.has(entry.partOfSpeech)) {
            meaningsMap.set(entry.partOfSpeech, []);
          }
          meaningsMap.get(entry.partOfSpeech)!.push({
            definition: entry.definition || '定義がありません',
            example: undefined,
          });
        });

        const meanings = Array.from(meaningsMap.entries()).map(([partOfSpeech, definitions]) => ({
          partOfSpeech,
          definitions,
        }));

        const result = {
          word,
          meanings,
        };
        console.log('Returning partial match result:', result);
        return result;
      }
    }

    console.log('No matches found for word:', word);
    // 結果が見つからない場合
    return {
      word,
      meanings: [{
        partOfSpeech: '不明',
        definitions: [{
          definition: '辞書に登録されていない単語です',
        }]
      }]
    };
  } catch (error) {
    console.error('Japanese Dictionary lookup failed:', error);
    return {
      word,
      meanings: [{
        partOfSpeech: 'エラー',
        definitions: [{
          definition: '辞書検索中にエラーが発生しました',
        }]
      }]
    };
  }
}

async function fetchSynonymsData(word: string): Promise<SynonymResponse> {
  try {
    const language = detectLanguage(word);
    
    if (language === 'japanese') {
      // 日本語の場合：Japanese WordNetを使用
      return await fetchJapaneseWordNetData(word);
    } else {
      // 英語の場合：Open English WordNetを使用（DatamuseはWordNetベース）
      return await fetchEnglishWordNetData(word);
    }
  } catch (error) {
    console.error('Synonyms API error:', error);
    throw error;
  }
}

async function fetchEnglishWordNetData(word: string): Promise<SynonymResponse> {
  // Open English WordNet（DatamuseはWordNetデータを使用）
  const response = await fetch(
    `https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=20`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`English WordNet API error: ${response.status}`);
  }

  const data = await response.json();
  
  // 類語を取得
  const synonyms = data.map((item: { word: string }) => item.word);
  
  // 対義語も取得
  const antonymsResponse = await fetch(
    `https://api.datamuse.com/words?rel_ant=${encodeURIComponent(word)}&max=10`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  let antonyms: string[] = [];
  if (antonymsResponse.ok) {
    const antonymsData = await antonymsResponse.json();
    antonyms = antonymsData.map((item: { word: string }) => item.word);
  }
  
  return {
    word,
    synonyms: synonyms.slice(0, 15), // 最大15個の類語
    antonyms: antonyms.length > 0 ? antonyms.slice(0, 10) : undefined, // 最大10個の対義語
  };
}

// Japanese WordNetから類語を取得
async function fetchJapaneseWordNetData(word: string): Promise<SynonymResponse> {
  try {
    // 同じsynsetに属する単語を類語として取得
    const entries = JAPANESE_WORDNET_DB[word];
    const synonyms: string[] = [];
    
    if (entries && entries.length > 0) {
      // 各エントリのsynsetIdから同じsynsetの単語を検索
      const synsetIds = entries.map(entry => entry.synsetId);
      
      for (const [otherWord, otherEntries] of Object.entries(JAPANESE_WORDNET_DB)) {
        if (otherWord !== word) {
          const hasSameSynset = otherEntries.some(entry => 
            synsetIds.includes(entry.synsetId)
          );
          
          if (hasSameSynset) {
            synonyms.push(otherWord);
          }
        }
      }
    }

    return {
      word,
      synonyms: synonyms.slice(0, 15), // 最大15個の類語
      antonyms: undefined,
    };
  } catch (error) {
    console.warn('Japanese WordNet lookup failed:', error);
    return {
      word,
      synonyms: [],
      antonyms: undefined,
    };
  }
} 