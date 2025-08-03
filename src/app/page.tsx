'use client';

import { useState } from 'react';
import { TextEditor } from '@/components/TextEditor';
import { WordLookupPanel } from '@/components/WordLookupPanel';
import { Footer } from '@/components/Footer';
import { QueryProvider } from '@/components/QueryProvider';
import { useWordLookup } from '@/hooks/useWordLookup';

export default function Home() {
  const [selectedWord, setSelectedWord] = useState<string>('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // フックは常に同じ順序で呼び出す必要がある
  const wordLookupResult = useWordLookup(selectedWord);

  const handleWordSelection = (word: string) => {
    setSelectedWord(word);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedWord('');
  };

  return (
    <QueryProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">WordTree</h1>
            <p className="text-gray-600">
              単語を選択して辞書・類語を調べる
            </p>
          </header>
          
          <main className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <TextEditor onWordSelection={handleWordSelection} />
              </div>
              
              {isPanelOpen && selectedWord && (
                <div>
                  <WordLookupPanel
                    word={selectedWord}
                    data={wordLookupResult.data}
                    isLoading={wordLookupResult.isLoading}
                    error={wordLookupResult.error}
                    onClose={handleClosePanel}
                  />
                </div>
              )}
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </QueryProvider>
  );
}
