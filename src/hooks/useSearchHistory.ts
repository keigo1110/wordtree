import { useState, useEffect } from 'react';

interface SearchHistoryItem {
  word: string;
  timestamp: number;
}

const HISTORY_STORAGE_KEY = 'wordtree_search_history';
const MAX_HISTORY_ITEMS = 20;

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // 初期化時にローカルストレージから履歴を読み込み
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SearchHistoryItem[];
        setHistory(parsed);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // 履歴をローカルストレージに保存
  const saveHistory = (newHistory: SearchHistoryItem[]) => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  // 新しい検索を履歴に追加
  const addToHistory = (word: string) => {
    if (!word.trim()) return;

    const newItem: SearchHistoryItem = {
      word: word.trim(),
      timestamp: Date.now(),
    };

    setHistory(prevHistory => {
      // 重複を除外（同じ単語は最新のもののみ保持）
      const filtered = prevHistory.filter(item => item.word !== newItem.word);
      
      // 新しいアイテムを先頭に追加
      const updated = [newItem, ...filtered];
      
      // 最大数を制限
      const limited = updated.slice(0, MAX_HISTORY_ITEMS);
      
      // ローカルストレージに保存
      saveHistory(limited);
      
      return limited;
    });
  };

  // 履歴からアイテムを削除
  const removeFromHistory = (word: string) => {
    setHistory(prevHistory => {
      const updated = prevHistory.filter(item => item.word !== word);
      saveHistory(updated);
      return updated;
    });
  };

  // 履歴をクリア
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  };

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
} 