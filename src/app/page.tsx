'use client';

import { useState } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { TextEditor } from '@/components/TextEditor';
import { WordLookupPanel } from '@/components/WordLookupPanel';
import { SearchHistory } from '@/components/SearchHistory';
import { Footer } from '@/components/Footer';
import { QueryProvider } from '@/components/QueryProvider';
import { useWordLookup } from '@/hooks/useWordLookup';
import { useSearchHistory } from '@/hooks/useSearchHistory';

export default function Home() {
  const [selectedWord, setSelectedWord] = useState<string>('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // フックは常に同じ順序で呼び出す必要がある
  const wordLookupResult = useWordLookup(selectedWord);
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();

  const handleWordSelection = (word: string) => {
    setSelectedWord(word);
    setIsPanelOpen(true);
    addToHistory(word);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedWord('');
  };

  const handleHistorySelect = (word: string) => {
    setSelectedWord(word);
    setIsPanelOpen(true);
    // 履歴表示は維持する（ONにしたらOFFにするまで表示され続ける）
  };

  const handleHistoryRemove = (word: string) => {
    removeFromHistory(word);
  };

  const handleHistoryClear = () => {
    clearHistory();
  };

  const handleSynonymClick = (synonym: string) => {
    setSelectedWord(synonym);
    setIsPanelOpen(true);
    addToHistory(synonym);
  };

  return (
    <QueryProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 py-8">
          <header className="text-center mb-8">
            <div className="flex items-center justify-between mb-4">
              <div></div>
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">WordTree</h1>
                <p className="text-gray-600">
                  単語を選択して辞書・類語を調べる
                </p>
              </div>
              <button
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
                title="検索履歴を表示"
              >
                <ClockIcon className="h-5 w-5" />
                <span className="text-sm font-medium">履歴</span>
                {history.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {history.length}
                  </span>
                )}
              </button>
            </div>
          </header>
          
          <main className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <TextEditor onWordSelection={handleWordSelection} />
              </div>
              
              <div>
                {/* 検索履歴パンくずリスト */}
                <SearchHistory
                  history={history}
                  onSelectWord={handleHistorySelect}
                  onRemoveWord={handleHistoryRemove}
                  onClearHistory={handleHistoryClear}
                  isOpen={isHistoryOpen}
                  onClose={() => setIsHistoryOpen(false)}
                />
                
                {isPanelOpen && selectedWord && (
                  <WordLookupPanel
                    word={selectedWord}
                    data={wordLookupResult.data}
                    isLoading={wordLookupResult.isLoading}
                    error={wordLookupResult.error}
                    onClose={handleClosePanel}
                    onSynonymClick={handleSynonymClick}
                  />
                )}
              </div>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </QueryProvider>
  );
}
