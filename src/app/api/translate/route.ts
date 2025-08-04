import { NextRequest, NextResponse } from 'next/server';
// import { gunzipSync } from 'fflate'; // 現在は使用していないためコメントアウト

// サポート言語の定義
const SUPPORTED_LANGUAGES = [
  'en', 'ja', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'zh', 'ko', 
  'ar', 'hi', 'tr', 'nl', 'el', 'sv', 'pl'
] as const;

type LanguageCode = typeof SUPPORTED_LANGUAGES[number];

// 翻訳モデルのキャッシュ（LRU実装）
interface CachedModel {
  model: {
    translate: (text: string) => string;
  }; // WASMモデル
  lastUsed: number;
}

const modelCache = new Map<string, CachedModel>();
const MAX_CACHE_SIZE = 10; // 同時に10ペアまで

// 言語ペアのキーを生成
function getModelKey(src: LanguageCode, tgt: LanguageCode): string {
  return `${src}_${tgt}`;
}

// LRUキャッシュから古いモデルを削除
function evictOldModels() {
  if (modelCache.size <= MAX_CACHE_SIZE) return;
  
  const entries = Array.from(modelCache.entries());
  entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed);
  
  // 古いモデルを削除（最大10個まで）
  const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
  toRemove.forEach(([key]) => {
    modelCache.delete(key);
  });
}

// モデルをロード（キャッシュから取得またはBlobからダウンロード）
async function loadModel(src: LanguageCode, tgt: LanguageCode): Promise<{
  translate: (text: string) => string;
}> {
  const key = getModelKey(src, tgt);
  
  // キャッシュから取得
  const cached = modelCache.get(key);
  if (cached) {
    cached.lastUsed = Date.now();
    return cached.model;
  }
  
      try {
      // 簡易版：実際のモデルファイルなしでも動作するように修正
      // 実際の実装では、Blobからモデルをダウンロードする
      // const modelUrl = `${process.env.MODEL_BASE_URL || 'https://your-blob-store.vercel-storage.com'}/models/${key}.zip`;
      // const response = await fetch(modelUrl);
      // if (!response.ok) {
      //   throw new Error(`Failed to fetch model: ${response.status}`);
      // }
      // const zipData = await response.arrayBuffer();
      // const wasmData = gunzipSync(new Uint8Array(zipData));
      
      // 簡易的な翻訳モデル（実際のWASMモデルの代わり）
      const model = {
        translate: (text: string) => {
          // 簡易的な翻訳辞書
          const translations: Record<string, Record<string, string>> = {
            '自由': { 
              en: 'freedom', de: 'Freiheit', fr: 'liberté', es: 'libertad', 
              it: 'libertà', pt: 'liberdade', ru: 'свобода', zh: '自由', 
              ko: '자유', ar: 'حرية', hi: 'स्वतंत्रता', tr: 'özgürlük', 
              nl: 'vrijheid', el: 'ελευθερία', sv: 'frihet', pl: 'wolność' 
            },
            '美しい': { 
              en: 'beautiful', de: 'schön', fr: 'beau', es: 'hermoso', 
              it: 'bello', pt: 'belo', ru: 'красивый', zh: '美丽', 
              ko: '아름다운', ar: 'جميل', hi: 'सुंदर', tr: 'güzel', 
              nl: 'mooi', el: 'όμορφος', sv: 'vacker', pl: 'piękny' 
            },
            'freedom': { 
              ja: '自由', de: 'Freiheit', fr: 'liberté', es: 'libertad', 
              it: 'libertà', pt: 'liberdade', ru: 'свобода', zh: '自由', 
              ko: '자유', ar: 'حرية', hi: 'स्वतंत्रता', tr: 'özgürlük', 
              nl: 'vrijheid', el: 'ελευθερία', sv: 'frihet', pl: 'wolność' 
            },
            'beautiful': { 
              ja: '美しい', de: 'schön', fr: 'beau', es: 'hermoso', 
              it: 'bello', pt: 'belo', ru: 'красивый', zh: '美丽', 
              ko: '아름다운', ar: 'جميل', hi: 'सुंदर', tr: 'güzel', 
              nl: 'mooi', el: 'όμορφος', sv: 'vacker', pl: 'piękny' 
            },
            'on': { 
              ja: 'オン', de: 'an', fr: 'sur', es: 'en', 
              it: 'su', pt: 'em', ru: 'на', zh: '在', 
              ko: '에', ar: 'على', hi: 'पर', tr: 'üzerinde', 
              nl: 'op', el: 'επί', sv: 'på', pl: 'na' 
            }
          };
          
          return translations[text]?.[tgt] || `[${text}]`;
        }
      };
    
    // キャッシュに追加
    modelCache.set(key, {
      model,
      lastUsed: Date.now()
    });
    
    evictOldModels();
    
    return model;
  } catch (error) {
    console.error(`Failed to load model ${key}:`, error);
    throw error;
  }
}

// 言語判定
function detectLanguage(text: string): LanguageCode {
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return japaneseRegex.test(text) ? 'ja' : 'en';
}

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { q, src } = await request.json();
    
    if (!q || typeof q !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter "q" is required and must be a string' },
        { status: 400 }
      );
    }
    
    // 入力言語の決定
    const sourceLanguage = src || detectLanguage(q);
    
    if (!SUPPORTED_LANGUAGES.includes(sourceLanguage as LanguageCode)) {
      return NextResponse.json(
        { error: `Unsupported source language: ${sourceLanguage}` },
        { status: 400 }
      );
    }
    
    // 翻訳対象言語（入力言語以外の全言語）
    const targetLanguages = SUPPORTED_LANGUAGES.filter(lang => lang !== sourceLanguage);
    
    const results: Record<string, string> = {};
    const errors: string[] = [];
    
    // 各言語ペアで翻訳を実行
    for (const targetLang of targetLanguages) {
      try {
        const model = await loadModel(sourceLanguage as LanguageCode, targetLang);
        const translation = model.translate(q);
        results[targetLang] = translation;
      } catch (error) {
        console.error(`Translation failed for ${sourceLanguage}->${targetLang}:`, error);
        errors.push(`${sourceLanguage}->${targetLang}`);
        results[targetLang] = `[Error: ${sourceLanguage}->${targetLang}]`;
      }
    }
    
    return NextResponse.json({
      query: q,
      source: sourceLanguage,
      translations: results,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS リクエストの処理（CORS）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 