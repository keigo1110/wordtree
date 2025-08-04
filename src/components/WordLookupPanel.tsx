'use client';

import { XMarkIcon, MagnifyingGlassIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

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

// 複合語の要素を抽出する関数
function extractCompoundElements(etymology: string): Array<{ word: string; meaning: string }> {
  const compoundMatch = etymology.match(/a compound of ([^.]+)/);
  const compoundInfo = compoundMatch ? compoundMatch[1] : null;
  
  if (!compoundInfo) return [];
  
  // hēl ("health") + lā ("lo") の形式を解析
  // 特殊文字（ēなど）も含めるように正規表現を修正
  const elementMatches = compoundInfo.match(/([a-zA-Zēāōūī]+)\s*\("([^"]+)"\)/g);
  
  if (!elementMatches) return [];
  
  return elementMatches.map(element => {
    const match = element.match(/([a-zA-Zēāōūī]+)\s*\("([^"]+)"\)/);
    return match ? { word: match[1], meaning: match[2] } : null;
  }).filter((element): element is { word: string; meaning: string } => element !== null);
}

// 語源を解析して系譜を抽出する関数
function parseEtymology(etymology: string): Array<{ 
  language: string; 
  word: string; 
  meaning?: string;
  isCompound?: boolean;
  compoundElements?: Array<{ word: string; meaning: string }>;
}> {
  const lineage: Array<{ 
    language: string; 
    word: string; 
    meaning?: string;
    isCompound?: boolean;
    compoundElements?: Array<{ word: string; meaning: string }>;
  }> = [];
  
  console.log('Parsing etymology:', etymology);
  
  // 複合語の要素を抽出
  const compoundElements = extractCompoundElements(etymology);
  console.log('Compound elements:', compoundElements);
  
  // より確実な解析方法
  const parts = etymology.split(',').map(part => part.trim());
  
  parts.forEach((part, index) => {
    console.log(`Processing part ${index}:`, part);
    
    // "From Middle English visual" パターン
    if (part.startsWith('From ')) {
      // From の後の部分を取得し、最後の単語を実際の単語として抽出
      const afterFrom = part.substring(5); // "From " を除去
      const words = afterFrom.split(' ');
      if (words.length >= 2) {
        const actualWord = words[words.length - 1].replace(/[""]/g, '').replace(/\.$/, '');
        const language = words.slice(0, -1).join(' ');
        console.log(`Found From: ${language} - ${actualWord}`);
        
        // 複合語の情報があるかチェック
        if (compoundElements.length > 0) {
          lineage.push({ 
            language, 
            word: actualWord, 
            isCompound: true,
            compoundElements
          });
        } else {
          lineage.push({ language, word: actualWord });
        }
      }
    }
    // "from Old French visuel" パターン
    else if (part.startsWith('from ')) {
      // from の後の部分を取得し、最後の単語を実際の単語として抽出
      const afterFrom = part.substring(5); // "from " を除去
      const words = afterFrom.split(' ');
      if (words.length >= 2) {
        const actualWord = words[words.length - 1].replace(/[""]/g, '').replace(/\.$/, '');
        const language = words.slice(0, -1).join(' ');
        console.log(`Found from: ${language} - ${actualWord}`);
        lineage.push({ language, word: actualWord });
      }
    }
  });
  
  console.log('Final lineage:', lineage);
  
  // 重複を除去
  const uniqueLineage = lineage.filter((item, index, self) => 
    index === self.findIndex(t => t.language === item.language && t.word === item.word)
  );
  
  // 古いものから新しいものへの正しい時系列順に並び替え
  // 語源テキストの順序: From Middle English → from Old English → from Proto-Germanic
  // 表示順序: Proto-Germanic → Old English → Middle English → Modern English
  const sortedLineage = [...uniqueLineage].reverse();
  
  return sortedLineage;
}

// 語源系譜図コンポーネント
function EtymologyTree({ etymology, currentWord }: { etymology: string; currentWord: string }) {
  const lineage = parseEtymology(etymology);
  
  // デバッグ用
  console.log('Etymology:', etymology);
  console.log('Parsed lineage:', lineage);
  
  if (lineage.length === 0) {
    return (
      <div className="text-sm text-gray-700 leading-relaxed">
        {etymology}
      </div>
    );
  }

  // 複合語の要素を抽出
  const compoundElements = extractCompoundElements(etymology);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-700 leading-relaxed">
        {etymology}
      </div>
      
      <div className="border-l-4 border-orange-300 pl-4">
        <h5 className="text-sm font-medium text-orange-700 mb-3">語源系譜</h5>
        <div className="space-y-3">
          {/* 複合語の要素がある場合は最初に表示 */}
          {compoundElements.length > 0 && (
            <div className="relative">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      構成要素
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {compoundElements.map((elem, idx) => 
                        `${elem.word} ("${elem.meaning}")${idx < compoundElements.length - 1 ? ' + ' : ''}`
                      ).join('')}
                    </span>
                  </div>
                </div>
              </div>
              {/* 次の要素への矢印 */}
              <div className="absolute left-1 top-6 w-0.5 h-3 bg-orange-300"></div>
            </div>
          )}
          
          {/* 古いものから新しいものへの流れ（上から下へ） */}
          {lineage.map((item, index) => (
            <div key={index} className="relative">
              {/* 時系列の矢印 */}
              {index < lineage.length - 1 && (
                <div className="absolute left-1 top-6 w-0.5 h-3 bg-orange-300"></div>
              )}
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-3 h-3 bg-orange-500 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                      {item.language}
                    </span>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {item.word}
                    </span>
                    {item.isCompound && (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        複合語
                      </span>
                    )}
                  </div>
                  {item.meaning && (
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {item.meaning}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* 現在の単語を最後に表示 */}
          <div className="relative">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    Modern English
                  </span>
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {currentWord}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// タブの種類を定義
type TabType = 'dictionary' | 'synonyms' | 'translations' | 'etymology';

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

  if (!data || (!data.dictionary && !data.synonyms && !data.translations && !data.etymology)) {
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

  // 利用可能なタブを決定
  const availableTabs: TabType[] = [];
  if (data.dictionary) availableTabs.push('dictionary');
  if (data.synonyms) availableTabs.push('synonyms');
  if (data.translations) availableTabs.push('translations');
  if (data.etymology) availableTabs.push('etymology');

  // デフォルトタブを設定
  if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
    setActiveTab(availableTabs[0]);
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

      {/* タブナビゲーション */}
      {availableTabs.length > 1 && (
        <div className="flex border-b border-gray-200 bg-gray-50">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab === 'dictionary' && '辞書'}
              {tab === 'synonyms' && '類語'}
              {tab === 'translations' && '翻訳'}
              {tab === 'etymology' && '語源'}
            </button>
          ))}
        </div>
      )}

      {/* コンテンツ - スクロール可能 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 辞書セクション */}
        {activeTab === 'dictionary' && data.dictionary && (
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
        {activeTab === 'synonyms' && data.synonyms && (
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
        {activeTab === 'translations' && data.translations && (
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

        {/* 語源セクション */}
        {activeTab === 'etymology' && data.etymology && (
          <section className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <h4 className="text-base font-semibold text-gray-900">語源</h4>
            </div>
            {data.etymology.etymology ? (
              <div className="bg-orange-50 rounded-lg p-3">
                <EtymologyTree etymology={data.etymology.etymology} currentWord={word} />
                <div className="text-xs text-gray-500 border-t border-orange-200 pt-2 mt-4">
                  <span>出典: DBnary / Wiktionary (CC-BY-SA 3.0)</span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-center text-sm">語源情報が見つかりませんでした。</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
} 