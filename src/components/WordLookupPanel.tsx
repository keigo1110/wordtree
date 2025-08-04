'use client';

import { useState } from 'react';
import { XMarkIcon, BookOpenIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

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

type TabType = 'dictionary' | 'synonyms' | 'translations';

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
  const [activeTab, setActiveTab] = useState<TabType>('dictionary');

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">検索中...</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">エラー</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="text-center py-8">
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
    );
  }

  if (!data || (!data.dictionary && !data.synonyms && !data.translations)) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">結果なし</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <BookOpenIcon className="h-12 w-12 mx-auto mb-4" />
          </div>
          <p className="text-gray-600">
            「{word}」の情報が見つかりませんでした。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{word}</h3>
          {data.dictionary?.phonetic && (
            <p className="text-sm text-gray-500 mt-1">[{data.dictionary.phonetic}]</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* タブ */}
      <div className="flex border-b border-gray-200">
        {data.dictionary && (
          <button
            onClick={() => setActiveTab('dictionary')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'dictionary'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            辞書
          </button>
        )}
        {data.synonyms && (
          <button
            onClick={() => setActiveTab('synonyms')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'synonyms'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            類語
          </button>
        )}
        {data.translations && (
          <button
            onClick={() => setActiveTab('translations')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'translations'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            翻訳
          </button>
        )}
      </div>

      {/* コンテンツ */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'dictionary' && data.dictionary && (
          <div className="space-y-4">
            {data.dictionary.meanings.map((meaning, index) => (
              <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                <div className="flex items-center mb-2">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {meaning.partOfSpeech}
                  </span>
                </div>
                <div className="space-y-2">
                  {meaning.definitions.map((def, defIndex) => (
                    <div key={defIndex} className="pl-4">
                      <div className="border-b border-gray-100 pb-2 last:border-b-0">
                        <p className="text-gray-900 mb-1">{def.definition}</p>
                        {def.example && (
                          <p className="text-sm text-gray-600 italic">
                            「{def.example}」
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'synonyms' && data.synonyms && (
          <div className="space-y-4">
            {data.synonyms.synonyms.length > 0 ? (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">類語</h4>
                <div className="flex flex-wrap gap-2">
                  {data.synonyms.synonyms.map((synonym, index) => (
                    <button
                      key={index}
                      onClick={() => onSynonymClick?.(synonym)}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors cursor-pointer"
                      title={`「${synonym}」を検索`}
                    >
                      {synonym}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">類語が見つかりませんでした。</p>
            )}

            {data.synonyms.antonyms && data.synonyms.antonyms.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">対義語</h4>
                <div className="flex flex-wrap gap-2">
                  {data.synonyms.antonyms.map((antonym, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm"
                    >
                      {antonym}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'translations' && data.translations && (
          <div className="space-y-4">
            {Object.keys(data.translations.translations).length > 0 ? (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">翻訳</h4>
                <div className="space-y-3">
                  {Object.entries(data.translations.translations).map(([lang, lemmas]) => (
                    <div key={lang} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <h5 className="text-xs font-medium text-gray-500 mb-2 uppercase">
                        {getLanguageDisplayName(lang)}
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {lemmas.map((lemma, index) => (
                          <button
                            key={index}
                            onClick={() => onSynonymClick?.(lemma)}
                            className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm hover:bg-green-100 transition-colors cursor-pointer"
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
              <p className="text-gray-500 text-center py-4">翻訳が見つかりませんでした。</p>
            )}
          </div>
        )}
      </div>


    </div>
  );
} 