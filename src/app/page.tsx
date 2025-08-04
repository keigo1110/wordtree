'use client';

import { useState } from 'react';
import { TextEditor } from '@/components/TextEditor';
import { WordLookupPanel } from '@/components/WordLookupPanel';
import { SearchHistory } from '@/components/SearchHistory';
import { Header } from '@/components/Header';
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header
          historyCount={history.length}
          onHistoryToggle={() => setIsHistoryOpen(!isHistoryOpen)}
          isHistoryOpen={isHistoryOpen}
        />
        
        <main className="flex-1 px-4 py-4">
          <div className="max-w-7xl mx-auto h-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              <div className="h-full">
                <TextEditor onWordSelection={handleWordSelection} />
              </div>
              
              <div className="h-full space-y-4">
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
          </div>
        </main>

        <Footer />
      </div>
    </QueryProvider>
  );
}
