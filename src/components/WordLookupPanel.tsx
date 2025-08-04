'use client';

import { XMarkIcon, MagnifyingGlassIcon, BookOpenIcon } from '@heroicons/react/24/outline';

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
  translations: Record<string, string[]>; // { "fra": ["banque"], "spa": ["banco"] }
}

interface LookupData {
  dictionary?: DictionaryData;
  synonyms?: SynonymsData;
  translations?: TranslationsData;
  error?: string;
}

interface WordLookupPanelProps {
  word: string;
  data?: LookupData;
  isLoading: boolean;
  error: Error | null;
  onClose: () => void;
  onSynonymClick?: (synonym: string) => void;
}

// 言語コードを表示名に変換する関数
function getLanguageDisplayName(code: string): string {
  const languageNames: Record<string, string> = {
    // 標準的な3文字コード
    'eng': '英語',
    'jpn': '日本語',
    'fra': 'フランス語',
    'spa': 'スペイン語',
    'deu': 'ドイツ語',
    'ita': 'イタリア語',
    'por': 'ポルトガル語',
    'rus': 'ロシア語',
    'cmn': '中国語',
    'kor': '韓国語',
    'nld': 'オランダ語',
    'swe': 'スウェーデン語',
    'dan': 'デンマーク語',
    'nor': 'ノルウェー語',
    'fin': 'フィンランド語',
    'pol': 'ポーランド語',
    'ces': 'チェコ語',
    'slk': 'スロバキア語',
    'hun': 'ハンガリー語',
    'ron': 'ルーマニア語',
    'bul': 'ブルガリア語',
    'hrv': 'クロアチア語',
    'srp': 'セルビア語',
    'slv': 'スロベニア語',
    'est': 'エストニア語',
    'lav': 'ラトビア語',
    'lit': 'リトアニア語',
    'ell': 'ギリシャ語',
    'tur': 'トルコ語',
    'ara': 'アラビア語',
    // 短縮形コード（実際のデータで使用されているもの）
    'el': 'ギリシャ語',
    'hr': 'クロアチア語',
    'it': 'イタリア語',
    'nl': 'オランダ語',
    'es': 'スペイン語',
    'en': '英語',
    'ja': '日本語',
    'fr': 'フランス語',
    'de': 'ドイツ語',
    'pt': 'ポルトガル語',
    'ru': 'ロシア語',
    'ko': '韓国語',
    'sv': 'スウェーデン語',
    'da': 'デンマーク語',
    'no': 'ノルウェー語',
    'fi': 'フィンランド語',
    'pl': 'ポーランド語',
    'cs': 'チェコ語',
    'sk': 'スロバキア語',
    'hu': 'ハンガリー語',
    'ro': 'ルーマニア語',
    'bg': 'ブルガリア語',
    'sr': 'セルビア語',
    'sl': 'スロベニア語',
    'et': 'エストニア語',
    'lv': 'ラトビア語',
    'lt': 'リトアニア語',
    'tr': 'トルコ語',
    'ar': 'アラビア語'
  };
  return languageNames[code] || code;
}

export function WordLookupPanel({
  word,
  data,
  isLoading,
  error,
  onClose,
  onSynonymClick,
}: WordLookupPanelProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col h-[calc(100vh-12rem)] min-h-[400px] max-h-[80vh]">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-blue-50 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">検索中...</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col h-[calc(100vh-12rem)] min-h-[400px] max-h-[80vh]">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-blue-50 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">エラー</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-4" />
            </div>
            <p className="text-gray-600">
              「{word}」の検索中にエラーが発生しました。
            </p>
            <p className="text-sm text-gray-500 mt-2">
              しばらく時間をおいて再度お試しください。
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || (!data.dictionary && !data.synonyms && !data.translations)) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col h-[calc(100vh-12rem)] min-h-[400px] max-h-[80vh]">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-blue-50 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">結果なし</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <BookOpenIcon className="h-12 w-12 mx-auto mb-4" />
            </div>
            <p className="text-gray-600">
              「{word}」の情報が見つかりませんでした。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col h-[calc(100vh-12rem)] min-h-[400px] max-h-[80vh]">
      {/* ヘッダー - 固定 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-blue-50 flex-shrink-0">
        <div>
          <h3 className="text-base font-semibold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">{word}</h3>
          {data.dictionary?.phonetic && (
            <p className="text-xs text-blue-600 mt-0.5">[{data.dictionary.phonetic}]</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* コンテンツ - スクロール可能 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 辞書セクション */}
        {data.dictionary && (
          <section className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h4 className="text-base font-semibold text-gray-900">辞書</h4>
            </div>
            <div className="space-y-2">
              {data.dictionary.meanings.map((meaning, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      {meaning.partOfSpeech}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {meaning.definitions.map((def, defIndex) => (
                      <div key={defIndex} className="border-l-4 border-blue-200 pl-3">
                        <p className="text-gray-900 text-sm leading-tight">{def.definition}</p>
                        {def.example && (
                          <p className="text-xs text-gray-600 italic mt-0.5">
                            「{def.example}」
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 類語セクション */}
        {data.synonyms && (
          <section className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h4 className="text-base font-semibold text-gray-900">類語</h4>
            </div>
            {data.synonyms.synonyms.length > 0 ? (
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex flex-wrap gap-1.5">
                  {data.synonyms.synonyms.map((synonym, index) => (
                    <button
                      key={index}
                      onClick={() => onSynonymClick?.(synonym)}
                      className="px-3 py-1.5 bg-white text-green-700 rounded-full text-xs hover:bg-green-100 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                      title={`「${synonym}」を検索`}
                    >
                      {synonym}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-center text-sm">類語が見つかりませんでした。</p>
              </div>
            )}

            {/* 対義語（英語のみ） */}
            {data.synonyms.antonyms && data.synonyms.antonyms.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <h5 className="text-sm font-medium text-gray-900">対義語</h5>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {data.synonyms.antonyms.map((antonym, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-white text-red-700 rounded-full text-sm shadow-sm"
                      >
                        {antonym}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* 翻訳セクション */}
        {data.translations && (
          <section className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <h4 className="text-base font-semibold text-gray-900">翻訳</h4>
            </div>
            {Object.keys(data.translations.translations).length > 0 ? (
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-0">
                  {Object.entries(data.translations.translations)
                    .sort(([langA], [langB]) => {
                      // 英語を一番上位に配置
                      if (langA === 'en' || langA === 'eng') return -1;
                      if (langB === 'en' || langB === 'eng') return 1;
                      // その他の言語はアルファベット順
                      return langA.localeCompare(langB);
                    })
                    .map(([lang, lemmas], index) => (
                    <div key={lang} className={`p-2 ${index % 2 === 0 ? 'border-r border-purple-200' : ''} ${index < 2 ? 'border-b border-purple-200' : index >= Object.entries(data.translations!.translations).length - 2 ? '' : 'border-b border-purple-200'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <h5 className="text-xs font-medium text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-full">
                          {getLanguageDisplayName(lang)}
                        </h5>
                        <span className="text-xs text-purple-600">{lemmas.length}語</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {lemmas.map((lemma, index) => (
                          <button
                            key={index}
                            onClick={() => onSynonymClick?.(lemma)}
                            className="px-2 py-0.5 bg-white text-purple-700 rounded-full text-xs hover:bg-purple-100 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                            title={`「${lemma}」を検索`}
                          >
                            {lemma}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-center text-sm">翻訳が見つかりませんでした。</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
} 