'use client';

import React, { useRef, useState } from 'react';

interface TextEditorProps {
  onWordSelection: (word: string) => void;
}

export const TextEditor = React.forwardRef<HTMLTextAreaElement, TextEditorProps>(
  ({ onWordSelection }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [value, setValue] = useState('');

    const handleMouseUp = () => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const selectionStart = textarea.selectionStart;
      const selectionEnd = textarea.selectionEnd;
      if (selectionStart === selectionEnd) return;
      const selectedText = value.substring(selectionStart, selectionEnd).trim();
      if (selectedText && selectedText.length > 0) {
        const cleanWord = selectedText
          .replace(/[ -  - ]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (cleanWord) {
          onWordSelection(cleanWord);
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Ctrl+Shift+K でパネルを開く（デバッグ用）
      if (e.ctrlKey && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        const textarea = textareaRef.current;
        if (textarea) {
          const selectionStart = textarea.selectionStart;
          const selectionEnd = textarea.selectionEnd;
          if (selectionStart !== selectionEnd) {
            const selectedText = value.substring(selectionStart, selectionEnd).trim();
            if (selectedText) {
              onWordSelection(selectedText);
            }
          }
        }
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <h2 className="text-lg font-semibold text-gray-900">テキスト入力</h2>
          </div>
          <p className="text-sm text-gray-700">
            テキストを入力またはペーストして、単語を選択してください
          </p>
        </div>
        <textarea
          ref={ref || textareaRef}
          className="h-[calc(100vh-16rem)] min-h-[300px] w-full p-6 focus:outline-none focus:ring-0 text-gray-900 leading-relaxed resize-y"
          placeholder="ここにテキストを入力またはペーストしてください..."
          value={value}
          onChange={e => setValue(e.target.value)}
          onMouseUp={handleMouseUp}
          onKeyDown={handleKeyDown}
        />
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span className="text-sm text-gray-700 font-medium">単語を選択して辞書検索</span>
          </div>
        </div>
      </div>
    );
  }
);

TextEditor.displayName = 'TextEditor'; 