'use client';



export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">

          {/* Data Sources */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <p>データソース：</p>
            <a 
              href="https://bond-lab.github.io/wnja/index.ja.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              日本語ワードネット
            </a>
            <a 
              href="https://api.datamuse.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Datamuse API
            </a>
            <a 
              href="https://github.com/omwn/omw-data" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              OMW project
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} WordTree
          </p>
        </div>
      </div>
    </footer>
  );
} 