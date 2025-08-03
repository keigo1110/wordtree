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

interface LookupData {
  dictionary?: DictionaryData;
  synonyms?: SynonymsData;
  error?: string;
}

interface WordLookupPanelProps {
  word: string;
  data?: LookupData;
  isLoading: boolean;
  error: Error | null;
  onClose: () => void;
}

type TabType = 'dictionary' | 'synonyms';

export function WordLookupPanel({
  word,
  data,
  isLoading,
  error,
  onClose,
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

  if (!data || (!data.dictionary && !data.synonyms)) {
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
                      <p className="text-gray-900 mb-1">{def.definition}</p>
                      {def.example && (
                        <p className="text-sm text-gray-600 italic">
                          「{def.example}」
                        </p>
                      )}
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
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                    >
                      {synonym}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">
                  「{word}」の類語が見つかりませんでした。
                </p>
              </div>
            )}
            {data.synonyms.antonyms && data.synonyms.antonyms.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">対義語</h4>
                <div className="flex flex-wrap gap-2">
                  {data.synonyms.antonyms.map((antonym, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-red-50 text-red-700 text-sm rounded-full"
                    >
                      {antonym}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 