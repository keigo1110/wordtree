'use client';

import { TextEditor } from '@/components/TextEditor';
import { QueryProvider } from '@/components/QueryProvider';

export default function Home() {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">WordTree</h1>
            <p className="text-gray-600">
              単語を選択して辞書・類語を調べる
            </p>
          </header>
          
          <main className="max-w-4xl mx-auto">
            <TextEditor />
          </main>

          {/* ライセンス表示 */}
          <footer className="mt-12 text-center">
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <a 
                  href="https://bond-lab.github.io/wnja/index.ja.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  日本語ワードネット（v1.1）© 2009-2011 NICT, 2012-2015 Francis Bond and 2016-2024 Francis Bond, Takayuki Kuribayashi
                </a>
              </p>
              <p>
                <a 
                  href="https://api.datamuse.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  English WordNet data provided by Datamuse API
                </a>
              </p>
            </div>
          </footer>
        </div>
      </div>
    </QueryProvider>
  );
}
