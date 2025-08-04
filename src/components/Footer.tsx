'use client';

export function Footer() {
  return (
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
        <p>
          <a 
            href="https://github.com/omwn/omw-data" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Open Multilingual Wordnet data provided by OMW project
          </a>
        </p>
      </div>
    </footer>
  );
} 