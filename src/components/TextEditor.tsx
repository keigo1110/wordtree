'use client';

import React, { forwardRef, useRef, useState } from 'react';

interface TextEditorProps {
  onWordSelection: (word: string) => void;
}

export const TextEditor = forwardRef<HTMLDivElement, TextEditorProps>(
  ({ onWordSelection }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isComposing, setIsComposing] = useState(false);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      // contentEditableの内容を更新
      target.innerText;
    };

    const handleCompositionStart = () => {
      setIsComposing(true);
    };

    const handleCompositionEnd = () => {
      setIsComposing(false);
    };

    const handleMouseUp = () => {
      if (isComposing) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const selectedText = range.toString().trim();

      if (selectedText && selectedText.length > 0) {
        // 重複スペース・句読点を除去
        const cleanWord = selectedText.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
        
        if (cleanWord) {
          onWordSelection(cleanWord);
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Ctrl+Shift+K でパネルを開く（デバッグ用）
      if (e.ctrlKey && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
          onWordSelection(selection.toString().trim());
        }
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">テキスト入力</h2>
          <p className="text-sm text-gray-600 mt-1">
            テキストを入力またはペーストして、単語を選択してください
          </p>
        </div>
        
        <div
          ref={editorRef}
          contentEditable
          className="min-h-[400px] p-6 focus:outline-none focus:ring-0 text-gray-900 leading-relaxed"
          onInput={handleInput}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onMouseUp={handleMouseUp}
          onKeyDown={handleKeyDown}
          data-placeholder="ここにテキストを入力またはペーストしてください..."
          suppressContentEditableWarning
        />
        
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>単語を選択して辞書検索</span>
            <span className="text-xs">ショートカット: Ctrl+Shift+K</span>
          </div>
        </div>
      </div>
    );
  }
);

TextEditor.displayName = 'TextEditor'; 