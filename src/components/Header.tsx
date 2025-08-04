'use client';

import { ClockIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  historyCount: number;
  onHistoryToggle: () => void;
  isHistoryOpen: boolean;
}

export function Header({ historyCount, onHistoryToggle, isHistoryOpen }: HeaderProps) {

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900">
                <span className="text-blue-600">Lexi</span>Atlas
              </h1>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* History button */}
            <button
              onClick={onHistoryToggle}
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isHistoryOpen
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="検索履歴を表示"
            >
              <ClockIcon className="h-4 w-4" />
              <span className="hidden sm:inline">履歴</span>
              {historyCount > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-1.5 py-0.5 rounded-full">
                  {historyCount}
                </span>
              )}
            </button>


          </div>
        </div>

        {/* Mobile menu - removed since no navigation items */}
      </div>
    </header>
  );
} 