'use client';

import { useState, useRef } from 'react';
import { TextEditor } from '@/components/TextEditor';
import { WordLookupPanel } from '@/components/WordLookupPanel';
import { useWordLookup } from '@/hooks/useWordLookup';

export default function Home() {
  const [selectedWord, setSelectedWord] = useState<string>('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const { data: lookupData, isLoading, error } = useWordLookup(selectedWord);

  const handleWordSelection = (word: string) => {
    if (word && word.trim()) {
      setSelectedWord(word.trim());
      setIsPanelOpen(true);
    }
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setSelectedWord('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            WordTree
          </h1>
          <p className="text-gray-600">
            単語を選択して多言語訳・類語・語源を即座に取得
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* テキスト入力領域 */}
          <div className="lg:col-span-2">
            <TextEditor
              ref={editorRef}
              onWordSelection={handleWordSelection}
            />
          </div>

          {/* 結果表示パネル */}
          <div className="lg:col-span-1">
            {isPanelOpen && (
              <WordLookupPanel
                word={selectedWord}
                data={lookupData}
                isLoading={isLoading}
                error={error}
                onClose={handleClosePanel}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
