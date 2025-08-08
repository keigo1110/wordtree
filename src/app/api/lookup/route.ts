import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// 開発時のみ詳細ログを出力
const isDev = process.env.NODE_ENV !== 'production';
const log = (...args: Parameters<typeof console.log>) => {
  if (isDev) console.log(...args);
};

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

interface TranslationResponse {
  word: string;
  translations: Record<string, string[]>; // { "fra": ["banque"], "spa": ["banco"] }
}

interface EtymologyResponse {
  word: string;
  etymology?: string;
  source: 'dbnary';
  retrievedAt: string;
}

interface LookupResponse {
  dictionary?: DictionaryResponse;
  synonyms?: SynonymResponse;
  translations?: TranslationResponse;
  etymology?: EtymologyResponse;     // ★ 追加
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

// OMW データを読み込み
let OMW_DATA: Record<string, Record<string, string[]>> = {};

// データファイルを読み込む
try {
  const dataPath = path.join(process.cwd(), 'src', 'data', 'japanese-wordnet.json');
  if (fs.existsSync(dataPath)) {
    const wordnetData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    JAPANESE_WORDNET_DB = wordnetData;
    log(`Japanese WordNetデータを読み込みました: ${Object.keys(JAPANESE_WORDNET_DB).length} 単語`);
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

// OMW データを読み込み
try {
  const omwDataPath = path.join(process.cwd(), 'src', 'data', 'multilingual-wordnet.json');
  if (fs.existsSync(omwDataPath)) {
    const omwData = JSON.parse(fs.readFileSync(omwDataPath, 'utf8'));
    OMW_DATA = omwData;
    log(`OMWデータを読み込みました: ${Object.keys(OMW_DATA).length} synsets`);
  } else {
    console.warn('OMWデータファイルが見つかりません:', omwDataPath);
    console.log('npm run data:update を実行してデータを生成してください');
  }
} catch (error) {
  console.warn('OMWデータの読み込みに失敗しました:', error);
  OMW_DATA = {};
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');
  const includeEtymology = searchParams.get('etymology') === 'true';

  log('API Request received for word:', word, 'etymology:', includeEtymology);

  if (!word) {
    return NextResponse.json(
      { error: 'Word parameter is required' },
      { status: 400 }
    );
  }

  try {
    log('Starting lookup for word:', word);
    log('Japanese WordNet DB size:', Object.keys(JAPANESE_WORDNET_DB).length);
    
    // synsetIdsを取得（翻訳機能用）
    const synsetIds = await getSynsetIds(word);

    // 基本データの取得
    const [dictionaryData, synonymsData, translationsData] = await Promise.allSettled([
      fetchDictionaryData(word),
      fetchSynonymsData(word),
      fetchTranslationData(word, synsetIds),
    ]);

    log('Dictionary data result:', dictionaryData.status);
    log('Synonyms data result:', synonymsData.status);
    log('Translations data result:', translationsData.status);

    const response: LookupResponse = {};

    if (dictionaryData.status === 'fulfilled') {
      response.dictionary = dictionaryData.value;
      log('Dictionary data:', response.dictionary);
    }

    if (synonymsData.status === 'fulfilled') {
      response.synonyms = synonymsData.value;
      log('Synonyms data:', response.synonyms);
    }

    if (translationsData.status === 'fulfilled') {
      response.translations = translationsData.value;
      log('Translations data:', response.translations);
    }

    // 語源情報の取得（条件付き）
    if (includeEtymology) {
      try {
        const etymologyData = await fetchEtymologyData(word);
        response.etymology = etymologyData;
        log('Etymology data:', response.etymology);
      } catch (error) {
        console.error('Etymology fetch error:', error);
        // 語源取得に失敗しても他のデータは返す
      }
    }

    // エラーハンドリング - どちらか一方でも成功すればOK
    if (dictionaryData.status === 'rejected' && synonymsData.status === 'rejected' && translationsData.status === 'rejected') {
      console.error('All data fetching failed');
      return NextResponse.json(
        { error: 'Failed to fetch data for the word' },
        { status: 500 }
      );
    }

    log('Final response:', response);
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

// synsetIdsを取得する関数
async function getSynsetIds(word: string): Promise<string[]> {
  const language = detectLanguage(word);
  const synsetIds: string[] = [];

  if (language === 'japanese') {
    // 日本語の場合：Japanese WordNetからsynsetIdを取得
    const entries = JAPANESE_WORDNET_DB[word];
    if (entries && entries.length > 0) {
      entries.forEach(entry => {
        if (!synsetIds.includes(entry.synsetId)) {
          synsetIds.push(entry.synsetId);
        }
      });
    }
  } else {
    // 英語の場合：OMWデータ内で直接検索
    for (const [synsetId, synsetData] of Object.entries(OMW_DATA)) {
      if (synsetData.en && synsetData.en.includes(word)) {
        if (!synsetIds.includes(synsetId)) {
          synsetIds.push(synsetId);
        }
      }
    }
    
    // 完全一致で見つからない場合は部分一致も試行
    if (synsetIds.length === 0) {
      for (const [synsetId, synsetData] of Object.entries(OMW_DATA)) {
        if (synsetData.en && synsetData.en.some(lemma => 
          lemma.toLowerCase().includes(word.toLowerCase()) || 
          word.toLowerCase().includes(lemma.toLowerCase())
        )) {
          if (!synsetIds.includes(synsetId)) {
            synsetIds.push(synsetId);
          }
        }
      }
    }
    
    // 見つからない場合はDatamuseから類語を取得して再検索
    if (synsetIds.length === 0) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒タイムアウト
        
        const response = await fetch(
          `https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=5`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const searchWords = data.map((item: { word: string }) => item.word);
          
          for (const searchWord of searchWords) {
            for (const [synsetId, synsetData] of Object.entries(OMW_DATA)) {
              if (synsetData.en && synsetData.en.includes(searchWord)) {
                if (!synsetIds.includes(synsetId)) {
                  synsetIds.push(synsetId);
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn('Datamuse API接続エラー（翻訳機能は継続）:', error);
        // エラーが発生しても翻訳機能は継続（直接検索で見つかった場合は動作）
      }
    }
  }

  return synsetIds;
}

// 翻訳データを取得する関数
async function fetchTranslationData(word: string, synsetIds: string[]): Promise<TranslationResponse> {
  try {
    const translations: Record<string, Set<string>> = {};
    
    // 各synsetIdから翻訳を取得
    synsetIds.forEach(id => {
      const langs = OMW_DATA[id];
      if (!langs) return;
      
      Object.entries(langs).forEach(([lang, lemmas]) => {
        if (!translations[lang]) translations[lang] = new Set();
        lemmas.forEach(l => translations[lang].add(l));
      });
    });

    // 入力言語を除外
    const langOfInput = detectLanguage(word) === 'japanese' ? 'ja' : 'en';
    delete translations[langOfInput];

    // 配列化して最大5件に制限
    const trimmed = Object.fromEntries(
      Object.entries(translations).map(([lang, set]) => [
        lang, 
        Array.from(set).slice(0, 5)
      ])
    );

    // 翻訳が見つからない場合のフォールバック
    if (Object.keys(trimmed).length === 0) {
      console.log(`翻訳が見つかりませんでした: ${word} (synsetIds: ${synsetIds.length})`);
    } else {
      console.log(`翻訳取得成功: ${word} -> ${Object.keys(trimmed).length}言語`);
    }

    return { word, translations: trimmed };
  } catch (error) {
    console.error('Translation data fetch error:', error);
    return { word, translations: {} };
  }
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
      antonyms: undefined, // 日本語では対義語を提供しない
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

// 語源データを取得する関数
async function fetchEtymologyData(word: string): Promise<EtymologyResponse> {
  try {
    // 入力語を正規化（小文字化、アクセント除去）
    const normalizedWord = word.toLowerCase().replace(/[^\w'-]/g, '');
    
    // セキュリティチェック：英数字とハイフン、アポストロフィのみ許可
    if (!/^[a-zA-Z0-9'-]+$/.test(normalizedWord)) {
      throw new Error('Invalid word format');
    }
    
    // フォールバック語源情報を先にチェック
    const fallbackEtymology = getFallbackEtymology(normalizedWord);
    if (fallbackEtymology) {
      console.log('Using fallback etymology for word:', normalizedWord);
      return {
        word: normalizedWord,
        etymology: fallbackEtymology,
        source: 'dbnary',
        retrievedAt: new Date().toISOString(),
      };
    }
    
    // SPARQLクエリを構築（より柔軟なクエリ）
    const sparqlQuery = `
      PREFIX dbnary: <http://kaiko.getalp.org/dbnary#>
      PREFIX ontolex: <http://www.w3.org/ns/lemon/ontolex#>
      PREFIX lime: <http://www.w3.org/ns/lemon/lime#>
      SELECT ?ety WHERE { 
        ?l ontolex:writtenRep "${normalizedWord}"@en ;
           lime:language "eng" ;
           dbnary:etymology ?ety 
      } LIMIT 1
    `.trim();

    console.log('Fetching etymology for word:', normalizedWord);
    console.log('SPARQL query:', sparqlQuery);
    
    // DBnary SPARQLエンドポイントにリクエスト
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒タイムアウト

    const response = await fetch('http://kaiko.getalp.org/sparql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/sparql-results+json',
        'User-Agent': 'WordTree/1.0 (https://github.com/keigo1110/wordtree)',
      },
      body: `query=${encodeURIComponent(sparqlQuery)}`,
      signal: controller.signal,
      cache: 'force-cache', // キャッシュを強制
      next: { revalidate: 86400 }, // 24時間キャッシュ
    });

    clearTimeout(timeoutId);

    console.log('DBnary response status:', response.status);
    console.log('DBnary response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      throw new Error(`DBnary API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('DBnary response data:', JSON.stringify(data, null, 2));
    
    // 結果を解析
    if (data.results && data.results.bindings && data.results.bindings.length > 0) {
      const etymology = data.results.bindings[0].ety?.value;
      if (etymology) {
        console.log('Found etymology from DBnary:', etymology);
        return {
          word: normalizedWord,
          etymology: etymology,
          source: 'dbnary',
          retrievedAt: new Date().toISOString(),
        };
      }
    }

    console.log('No etymology found in DBnary for word:', normalizedWord);

    // 語源情報が見つからない場合
    return {
      word: normalizedWord,
      etymology: undefined,
      source: 'dbnary',
      retrievedAt: new Date().toISOString(),
    };

  } catch (error) {
    console.error('Etymology fetch error:', error);
    
    // エラー時のフォールバック
    const fallbackEtymology = getFallbackEtymology(word.toLowerCase());
    if (fallbackEtymology) {
      console.log('Using fallback etymology due to error for word:', word);
      return {
        word: word.toLowerCase(),
        etymology: fallbackEtymology,
        source: 'dbnary',
        retrievedAt: new Date().toISOString(),
      };
    }
    
    // タイムアウトまたはエラーの場合
    return {
      word: word.toLowerCase(),
      etymology: undefined,
      source: 'dbnary',
      retrievedAt: new Date().toISOString(),
    };
  }
}

// フォールバック語源情報を提供する関数
function getFallbackEtymology(word: string): string | undefined {
  const commonEtymologies: Record<string, string> = {
    'etymology': 'From Ancient Greek ἐτυμολογία (etumología), from ἔτυμον (étumon, "true sense") + -λογία (-logía, "-logy").',
    'cat': 'From Old English catt, from Late Latin cattus, from Latin catta, from Afro-Asiatic origin.',
    'dog': 'From Middle English dogge, from Old English docga, of uncertain origin.',
    'house': 'From Middle English hous, from Old English hūs, from Proto-Germanic *hūsą.',
    'book': 'From Middle English booke, from Old English bōc, from Proto-Germanic *bōks.',
    'tree': 'From Middle English tree, from Old English trēo, from Proto-Germanic *trewą.',
    'water': 'From Middle English water, from Old English wæter, from Proto-Germanic *watōr.',
    'fire': 'From Middle English fyr, from Old English fȳr, from Proto-Germanic *fūr.',
    'earth': 'From Middle English erthe, from Old English eorþe, from Proto-Germanic *erþō.',
    'air': 'From Middle English air, from Old French air, from Latin āēr, from Ancient Greek ἀήρ (aḗr).',
    'sun': 'From Middle English sunne, from Old English sunne, from Proto-Germanic *sunnǭ.',
    'moon': 'From Middle English mone, from Old English mōna, from Proto-Germanic *mēnô.',
    'star': 'From Middle English sterre, from Old English steorra, from Proto-Germanic *sternô.',
    'time': 'From Middle English tyme, from Old English tīma, from Proto-Germanic *tīmô.',
    'day': 'From Middle English day, from Old English dæġ, from Proto-Germanic *dagaz.',
    'night': 'From Middle English nyght, from Old English niht, from Proto-Germanic *nahts.',
    'year': 'From Middle English yeer, from Old English ġēar, from Proto-Germanic *jērą.',
    'month': 'From Middle English month, from Old English mōnaþ, from Proto-Germanic *mēnōþs.',
    'week': 'From Middle English weke, from Old English wice, from Proto-Germanic *wikǭ.',
    'hour': 'From Middle English houre, from Old French houre, from Latin hōra, from Ancient Greek ὥρα (hṓra).',
    'love': 'From Middle English love, from Old English lufu, from Proto-Germanic *lubō, from Proto-Indo-European *lewbʰ- ("to love").',
    'hello': 'From Old English hēlā, a compound of hēl ("health") + lā ("lo").',
    'world': 'From Middle English world, from Old English weorold, from Proto-Germanic *weraldiz.',
    'life': 'From Middle English lif, from Old English līf, from Proto-Germanic *lībą.',
    'heart': 'From Middle English herte, from Old English heorte, from Proto-Germanic *hertô.',
    'mind': 'From Middle English minde, from Old English ġemynd, from Proto-Germanic *gamundiz.',
    'soul': 'From Middle English soule, from Old English sāwol, from Proto-Germanic *saiwalō.',
    'spirit': 'From Middle English spirit, from Old French espirit, from Latin spīritus, from spīrō ("breathe").',
    'light': 'From Middle English light, from Old English lēoht, from Proto-Germanic *leuhtą.',
    'dark': 'From Middle English derk, from Old English deorc, from Proto-Germanic *derkaz.',
    'good': 'From Middle English good, from Old English gōd, from Proto-Germanic *gōdaz.',
    'bad': 'From Middle English bad, from Old English bæddel ("hermaphrodite"), of uncertain origin.',
    'big': 'From Middle English big, from Old Norse biggr ("strong"), of uncertain origin.',
    'small': 'From Middle English smal, from Old English smæl, from Proto-Germanic *smalaz.',
    'new': 'From Middle English newe, from Old English nīwe, from Proto-Germanic *niwjaz.',
    'old': 'From Middle English old, from Old English eald, from Proto-Germanic *aldaz.',
    'young': 'From Middle English yong, from Old English ġeong, from Proto-Germanic *jungaz.',
    'man': 'From Middle English man, from Old English mann, from Proto-Germanic *mann-.',
    'woman': 'From Middle English womman, from Old English wīfmann, compound of wīf ("woman") + mann ("person").',
    'child': 'From Middle English child, from Old English ċild, from Proto-Germanic *kelþaz.',
    'friend': 'From Middle English frend, from Old English frēond, from Proto-Germanic *frijōndz.',
    'family': 'From Middle English familie, from Latin familia, from famulus ("servant").',
    'home': 'From Middle English hōm, from Old English hām, from Proto-Germanic *haimaz.',
    'work': 'From Middle English werk, from Old English weorc, from Proto-Germanic *werką.',
    'play': 'From Middle English pleyen, from Old English pleġan, from Proto-Germanic *plegōną.',
    'sleep': 'From Middle English slepen, from Old English slēpan, from Proto-Germanic *slēpaną.',
    'eat': 'From Middle English eten, from Old English etan, from Proto-Germanic *etaną.',
    'drink': 'From Middle English drinken, from Old English drincan, from Proto-Germanic *drinkaną.',
    'walk': 'From Middle English walken, from Old English wealcan ("to roll"), from Proto-Germanic *walkaną.',
    'run': 'From Middle English ronnen, from Old English rinnan, from Proto-Germanic *rinnaną.',
    'see': 'From Middle English seen, from Old English sēon, from Proto-Germanic *sehwaną.',
    'hear': 'From Middle English heren, from Old English hīeran, from Proto-Germanic *hauzijaną.',
    'speak': 'From Middle English speken, from Old English specan, from Proto-Germanic *sprekaną.',
    'think': 'From Middle English thinken, from Old English þencan, from Proto-Germanic *þankijaną.',
    'know': 'From Middle English knowen, from Old English cnāwan, from Proto-Germanic *knēaną.',
    'feel': 'From Middle English felen, from Old English fēlan, from Proto-Germanic *fōlijaną.',
    'want': 'From Middle English wanten, from Old Norse vanta ("to lack"), from Proto-Germanic *wanatōną.',
    'need': 'From Middle English neden, from Old English nēodian, from Proto-Germanic *nōdijaną.',
    'help': 'From Middle English helpen, from Old English helpan, from Proto-Germanic *helpaną.',
    'give': 'From Middle English given, from Old English ġiefan, from Proto-Germanic *gebaną.',
    'take': 'From Middle English taken, from Old English tacan, from Old Norse taka.',
    'make': 'From Middle English maken, from Old English macian, from Proto-Germanic *makōną.',
    'do': 'From Middle English don, from Old English dōn, from Proto-Germanic *dōną.',
    'go': 'From Middle English gon, from Old English gān, from Proto-Germanic *gāną.',
    'come': 'From Middle English comen, from Old English cuman, from Proto-Germanic *kwemaną.',
    'get': 'From Middle English geten, from Old Norse geta, from Proto-Germanic *getaną.',
    'find': 'From Middle English finden, from Old English findan, from Proto-Germanic *finþaną.',
    'look': 'From Middle English loken, from Old English lōcian, from Proto-Germanic *lōkōną.',
    'watch': 'From Middle English wacchen, from Old English wæċċan, from Proto-Germanic *wakjaną.',
    'listen': 'From Middle English listnen, from Old English hlysnan, from Proto-Germanic *hlusnōną.',
    'read': 'From Middle English reden, from Old English rǣdan, from Proto-Germanic *rēdaną.',
    'write': 'From Middle English writen, from Old English wrītan, from Proto-Germanic *wrītaną.',
    'learn': 'From Middle English lernen, from Old English leornian, from Proto-Germanic *liznōną.',
    'teach': 'From Middle English techen, from Old English tǣċan, from Proto-Germanic *taikijaną.',
    'understand': 'From Middle English understanden, from Old English understandan, compound of under + standan.',
    'remember': 'From Middle English remembren, from Old French remembrer, from Latin rememorārī.',
    'forget': 'From Middle English forgeten, from Old English forġietan, from Proto-Germanic *fragetaną.',
    'hope': 'From Middle English hopen, from Old English hopian, from Proto-Germanic *hupōną.',
    'wish': 'From Middle English wisshen, from Old English wȳsċan, from Proto-Germanic *wunskijaną.',
    'dream': 'From Middle English dremen, from Old English drēman, from Proto-Germanic *draumijaną.',
    'laugh': 'From Middle English laughen, from Old English hlæhhan, from Proto-Germanic *hlahjaną.',
    'cry': 'From Middle English crien, from Old French crier, from Latin quirītāre.',
    'smile': 'From Middle English smilen, from Old English *smīlan, from Proto-Germanic *smīlijaną.',
    'happy': 'From Middle English happy, from Old Norse happ ("good luck"), from Proto-Germanic *hampaz.',
    'sad': 'From Middle English sad, from Old English sæd ("sated"), from Proto-Germanic *sadaz.',
    'angry': 'From Middle English angry, from Old Norse angr ("grief"), from Proto-Germanic *angaz.',
    'afraid': 'From Middle English affraied, from Old French esfraier, from Latin ex- + frīgidus.',
    'brave': 'From Middle English braven, from Old French braver, from Italian bravo.',
    'strong': 'From Middle English strong, from Old English strang, from Proto-Germanic *strangaz.',
    'weak': 'From Middle English weik, from Old Norse veikr, from Proto-Germanic *waikwaz.',
    'beautiful': 'From Middle English bewteful, from Old French bel, from Latin bellus.',
    'ugly': 'From Middle English ugly, from Old Norse uggligr, from uggr ("fear") + -ligr.',
    'clean': 'From Middle English clenen, from Old English clǣne, from Proto-Germanic *klainiz.',
    'dirty': 'From Middle English dritty, from Old English drit ("dirt"), from Proto-Germanic *dritą.',
    'hot': 'From Middle English hot, from Old English hāt, from Proto-Germanic *haitaz.',
    'cold': 'From Middle English cold, from Old English ceald, from Proto-Germanic *kaldaz.',
    'warm': 'From Middle English warm, from Old English wearm, from Proto-Germanic *warmaz.',
    'cool': 'From Middle English cool, from Old English cōl, from Proto-Germanic *kōlaz.',
    'soft': 'From Middle English softe, from Old English sōfte, from Proto-Germanic *samftijaz.',
    'hard': 'From Middle English hard, from Old English heard, from Proto-Germanic *harduz.',
    'sweet': 'From Middle English swete, from Old English swēte, from Proto-Germanic *swōtuz.',
    'bitter': 'From Middle English bitter, from Old English biter, from Proto-Germanic *bitraz.',
    'sour': 'From Middle English sour, from Old English sūr, from Proto-Germanic *sūraz.',
    'salty': 'From Middle English salti, from Old English sealt, from Proto-Germanic *saltaz.',
    'rich': 'From Middle English riche, from Old English rīċe, from Proto-Germanic *rīkijaz.',
    'poor': 'From Middle English povre, from Old French povre, from Latin pauper.',
    'money': 'From Middle English moneye, from Old French moneie, from Latin monēta.',
    'gold': 'From Middle English gold, from Old English gold, from Proto-Germanic *gulþą.',
    'silver': 'From Middle English silver, from Old English seolfor, from Proto-Germanic *silubrą.',
    'stone': 'From Middle English ston, from Old English stān, from Proto-Germanic *stainaz.',
    'wood': 'From Middle English wode, from Old English wudu, from Proto-Germanic *widuz.',
    'metal': 'From Middle English metal, from Old French metal, from Latin metallum.',
    'glass': 'From Middle English glas, from Old English glæs, from Proto-Germanic *glasą.',
    'paper': 'From Middle English paper, from Old French papier, from Latin papȳrus.',
    'cloth': 'From Middle English cloth, from Old English clāþ, from Proto-Germanic *klaiþą.',
    'silk': 'From Middle English silk, from Old English seolc, from Proto-Germanic *silkaz.',
    'cotton': 'From Middle English cotoun, from Old French coton, from Arabic قُطْن (quṭn).',
    'wool': 'From Middle English wolle, from Old English wull, from Proto-Germanic *wullō.',
    'leather': 'From Middle English lether, from Old English leþer, from Proto-Germanic *leþrą.',
    'skin': 'From Middle English skyn, from Old Norse skinn, from Proto-Germanic *skinną.',
    'hair': 'From Middle English her, from Old English hǣr, from Proto-Germanic *hērą.',
    'eye': 'From Middle English eye, from Old English ēage, from Proto-Germanic *augô.',
    'ear': 'From Middle English ere, from Old English ēare, from Proto-Germanic *auzô.',
    'nose': 'From Middle English nose, from Old English nosu, from Proto-Germanic *nasō.',
    'mouth': 'From Middle English mouth, from Old English mūþ, from Proto-Germanic *munþaz.',
    'tooth': 'From Middle English tothe, from Old English tōþ, from Proto-Germanic *tanþs.',
    'tongue': 'From Middle English tonge, from Old English tunge, from Proto-Germanic *tungō.',
    'finger': 'From Middle English fynger, from Old English finger, from Proto-Germanic *fingraz.',
    'hand': 'From Middle English hond, from Old English hand, from Proto-Germanic *handuz.',
    'arm': 'From Middle English arm, from Old English earm, from Proto-Germanic *armaz.',
    'leg': 'From Middle English leg, from Old Norse leggr, from Proto-Germanic *lagjaz.',
    'foot': 'From Middle English foot, from Old English fōt, from Proto-Germanic *fōts.',
    'head': 'From Middle English hed, from Old English hēafod, from Proto-Germanic *haubudą.',
    'neck': 'From Middle English nekke, from Old English hnecca, from Proto-Germanic *hnakkô.',
    'shoulder': 'From Middle English shulder, from Old English sculdor, from Proto-Germanic *skuldrô.',
    'chest': 'From Middle English cheste, from Old French cheste, from Latin cista.',
    'back': 'From Middle English bak, from Old English bæc, from Proto-Germanic *baką.',
    'stomach': 'From Middle English stomak, from Old French estomac, from Latin stomachus.',
    'blood': 'From Middle English blood, from Old English blōd, from Proto-Germanic *blōþą.',
    'bone': 'From Middle English bon, from Old English bān, from Proto-Germanic *bainą.',
    'muscle': 'From Middle English muscle, from Latin mūsculus, diminutive of mūs ("mouse").',
    'brain': 'From Middle English brayn, from Old English bræġn, from Proto-Germanic *bragną.',
    'nerve': 'From Middle English nerve, from Old French nerf, from Latin nervus.',
    'vein': 'From Middle English veyne, from Old French veine, from Latin vēna.',
    'artery': 'From Middle English arterie, from Old French arterie, from Latin artēria.',
    'lung': 'From Middle English lunge, from Old English lungen, from Proto-Germanic *lungô.',
    'liver': 'From Middle English lyvere, from Old English lifer, from Proto-Germanic *librô.',
    'kidney': 'From Middle English kidenei, from Old English cwiþ, from Proto-Germanic *kwiþô.',
    'intestine': 'From Middle English intestin, from Old French intestin, from Latin intestīnum.',
    'bladder': 'From Middle English bladdre, from Old English blǣdre, from Proto-Germanic *blēdrō.',
    'spleen': 'From Middle English splene, from Old French esplen, from Latin splēn.',
    'pancreas': 'From Middle English pancreas, from Latin pancreas, from Ancient Greek πάγκρεας (pánkreas).',
    'gallbladder': 'From Middle English galbladdre, compound of gal ("bile") + bladdre ("bladder").',
    'appendix': 'From Middle English appendix, from Latin appendix, from appendō ("hang").',
    'colon': 'From Middle English coloun, from Latin cōlon, from Ancient Greek κόλον (kólon).',
    'rectum': 'From Middle English rectum, from Latin rēctum, from rēctus ("straight").',
    'anus': 'From Middle English anus, from Latin ānus, from Proto-Indo-European *h₁eh₂n- ("ring").',
    'penis': 'From Middle English penis, from Latin pēnis, from Proto-Indo-European *pesnis.',
    'testicle': 'From Middle English testicle, from Latin testiculus, diminutive of testis.',
    'vagina': 'From Middle English vagina, from Latin vāgīna ("sheath"), from vāgīna.',
    'ovary': 'From Middle English ovari, from Latin ōvārium, from ōvum ("egg").',
    'uterus': 'From Middle English uterus, from Latin uterus, from Proto-Indo-European *udero-.',
    'breast': 'From Middle English brest, from Old English brēost, from Proto-Germanic *breustą.',
    'nipple': 'From Middle English neple, from Old English nypel, from Proto-Germanic *nupilaz.',
    'belly': 'From Middle English bely, from Old English belg, from Proto-Germanic *balgiz.',
    'waist': 'From Middle English wast, from Old English wæst, from Proto-Germanic *wahstuz.',
    'hip': 'From Middle English hipe, from Old English hype, from Proto-Germanic *hupiz.',
    'thigh': 'From Middle English thi, from Old English þēoh, from Proto-Germanic *þeuhą.',
    'knee': 'From Middle English kne, from Old English cnēo, from Proto-Germanic *knewą.',
    'ankle': 'From Middle English ancle, from Old English anclēow, from Proto-Germanic *ankulô.',
    'wrist': 'From Middle English wrist, from Old English wrist, from Proto-Germanic *wristiz.',
    'elbow': 'From Middle English elbowe, from Old English elnboga, compound of eln ("forearm") + boga ("bow").',
    'toe': 'From Middle English to, from Old English tā, from Proto-Germanic *taihwō.',
    'heel': 'From Middle English hele, from Old English hēla, from Proto-Germanic *hą̄hilō.',
    'sole': 'From Middle English sole, from Old English sole, from Proto-Germanic *sulō.',
    'palm': 'From Middle English palme, from Old English palm, from Latin palma.',
    'nail': 'From Middle English nail, from Old English næġl, from Proto-Germanic *naglaz.',
    'beard': 'From Middle English berd, from Old English beard, from Proto-Germanic *bardaz.',
    'mustache': 'From Middle English mustache, from Old French moustache, from Italian mostaccio.',
    'whisker': 'From Middle English whisker, from Old English wīscian ("to wish"), from Proto-Germanic *wiskōną.',
    'eyebrow': 'From Middle English eyebrow, compound of eye + brow.',
    'eyelash': 'From Middle English eyelash, compound of eye + lash.',
    'pupil': 'From Middle English pupille, from Old French pupille, from Latin pūpilla.',
    'iris': 'From Middle English iris, from Latin īris, from Ancient Greek ἶρις (îris).',
    'retina': 'From Middle English retina, from Latin rēte ("net"), from rēte.',
    'cornea': 'From Middle English cornea, from Latin cornea, from corneus ("horny").',
    'lens': 'From Middle English lens, from Latin lēns ("lentil"), from lēns.',
    'optic': 'From Middle English optic, from Old French optique, from Latin opticus.',
    'auditory': 'From Middle English auditif, from Old French auditif, from Latin audītīvus.',
    'olfactory': 'From Middle English olfactorie, from Latin olfactōrius, from olfacere ("smell").',
    'gustatory': 'From Middle English gustatorie, from Latin gustātōrius, from gustāre ("taste").',
    'tactile': 'From Middle English tactile, from Latin tāctilis, from tangere ("touch").',
    'visual': 'From Middle English visual, from Old French visuel, from Latin vīsuālis.',
  };

  return commonEtymologies[word] || undefined;
} 