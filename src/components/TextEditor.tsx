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

      console.log('TextEditor - Selected text:', selectedText);

      if (selectedText && selectedText.length > 0) {
        // 日本語文字を保持しつつ、不要な文字を除去
        const cleanWord = selectedText
          .replace(/[\u3000\u2000-\u200F\u2028-\u202F\u205F-\u206F]/g, '') // 全角・半角スペース類
          .replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uFF00-\uFFEFa-zA-Z0-9\s]/g, '') // 日本語文字、英数字、スペース以外を除去
          .replace(/\s+/g, ' ') // 連続するスペースを単一スペースに
          .trim();
        
        console.log('TextEditor - Cleaned word:', cleanWord);
        
        if (cleanWord) {
          console.log('TextEditor - Calling onWordSelection with:', cleanWord);
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
          const selectedText = selection.toString().trim();
          console.log('TextEditor - Keyboard shortcut selected text:', selectedText);
          onWordSelection(selectedText);
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
          <div className="text-sm text-gray-600">
            <span>単語を選択して辞書検索</span>
          </div>
        </div>
      </div>
    );
  }
);

TextEditor.displayName = 'TextEditor'; 