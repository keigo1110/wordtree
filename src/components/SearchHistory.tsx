'use client';

import { ClockIcon, TrashIcon } from '@heroicons/react/24/outline';

interface SearchHistoryItem {
  word: string;
  timestamp: number;
}

interface SearchHistoryProps {
  history: SearchHistoryItem[];
  onSelectWord: (word: string) => void;
  onRemoveWord: (word: string) => void;
  onClearHistory: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function SearchHistory({
  history,
  onSelectWord,
  onRemoveWord,
  onClearHistory,
  isOpen,
  onClose,
}: SearchHistoryProps) {
  if (!isOpen || history.length === 0) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center text-sm text-gray-600">
          <ClockIcon className="h-4 w-4 mr-1" />
          <span>検索履歴</span>
        </div>
        <button
          onClick={onClearHistory}
          className="text-xs text-red-600 hover:text-red-800 transition-colors px-2 py-1 rounded hover:bg-red-50"
          title="履歴をクリア"
        >
          クリア
        </button>
      </div>
      <div className="overflow-x-auto">
        <div className="flex items-center space-x-2 min-w-max">
          {history.map((item, index) => (
            <div key={`${item.word}-${item.timestamp}`} className="flex items-center flex-shrink-0">
              <button
                onClick={() => onSelectWord(item.word)}
                className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title={item.word}
              >
                <span className="font-medium">{item.word}</span>
              </button>
              <button
                onClick={() => onRemoveWord(item.word)}
                className="ml-1 text-gray-400 hover:text-red-600 transition-colors p-0.5"
                title="履歴から削除"
              >
                <TrashIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 