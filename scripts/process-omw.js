#!/usr/bin/env node

/**
 * Open Multilingual Wordnet (OMW) データ処理スクリプト
 * 
 * 使用方法:
 * 1. OMWデータをダウンロード: curl -L "https://github.com/omwn/omw-data/releases/download/v1.4/omw-1.4.tar.xz" -o data/omw-1.4.tar.xz
 * 2. 展開: tar -xf data/omw-1.4.tar.xz -C data/
 * 3. このスクリプトを実行: node scripts/process-omw.js
 */

const fs = require('fs');
const path = require('path');
const { DOMParser } = require('xmldom');

// 設定
const OMW_DIR = path.join(__dirname, '../data/omw-1.4');
const OUTPUT_PATH = path.join(__dirname, '../src/data/multilingual-wordnet.json');

// 主要言語のリスト（ファイルサイズ制限のため主要言語のみ）
const TARGET_LANGUAGES = [
  'omw-en', 'omw-ja', 'omw-fr', 'omw-es', 'omw-de', 'omw-it', 'omw-pt', 'omw-ru', 'omw-cmn', 'omw-ko',
  'omw-nl', 'omw-sv', 'omw-da', 'omw-no', 'omw-fi', 'omw-pl', 'omw-cs', 'omw-sk', 'omw-hu', 'omw-ro',
  'omw-bg', 'omw-hr', 'omw-sr', 'omw-sl', 'omw-et', 'omw-lv', 'omw-lt', 'omw-el', 'omw-tr', 'omw-ar'
];

/**
 * 言語コードを表示名に変換
 */
function getLanguageDisplayName(code) {
  const languageNames = {
    'omw-en': 'English',
    'omw-ja': '日本語',
    'omw-fr': 'Français',
    'omw-es': 'Español',
    'omw-de': 'Deutsch',
    'omw-it': 'Italiano',
    'omw-pt': 'Português',
    'omw-ru': 'Русский',
    'omw-cmn': '中文',
    'omw-ko': '한국어',
    'omw-nl': 'Nederlands',
    'omw-sv': 'Svenska',
    'omw-da': 'Dansk',
    'omw-no': 'Norsk',
    'omw-fi': 'Suomi',
    'omw-pl': 'Polski',
    'omw-cs': 'Čeština',
    'omw-sk': 'Slovenčina',
    'omw-hu': 'Magyar',
    'omw-ro': 'Română',
    'omw-bg': 'Български',
    'omw-hr': 'Hrvatski',
    'omw-sr': 'Српски',
    'omw-sl': 'Slovenščina',
    'omw-et': 'Eesti',
    'omw-lv': 'Latviešu',
    'omw-lt': 'Lietuvių',
    'omw-el': 'Ελληνικά',
    'omw-tr': 'Türkçe',
    'omw-ar': 'العربية'
  };
  return languageNames[code] || code;
}

/**
 * XMLファイルからlemmaとsynsetのマッピングを抽出
 */
function extractLemmasFromXML(xmlContent, langCode) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');
  
  const lemmas = new Map();
  
  // LexicalEntryを取得
  const lexicalEntries = doc.getElementsByTagName('LexicalEntry');
  
  for (let i = 0; i < lexicalEntries.length; i++) {
    const entry = lexicalEntries[i];
    const lemmaElement = entry.getElementsByTagName('Lemma')[0];
    const senseElement = entry.getElementsByTagName('Sense')[0];
    
    if (lemmaElement && senseElement) {
      const writtenForm = lemmaElement.getAttribute('writtenForm');
      const synset = senseElement.getAttribute('synset');
      
      if (writtenForm && synset) {
        // synset IDを標準形式に変換 (omw-en-08641944-n -> 08641944-n)
        const synsetId = synset.replace(/^omw-[a-z]+-/, '');
        
        if (!lemmas.has(synsetId)) {
          lemmas.set(synsetId, []);
        }
        
        // 重複を避けて追加
        if (!lemmas.get(synsetId).includes(writtenForm)) {
          lemmas.get(synsetId).push(writtenForm);
        }
      }
    }
  }
  
  return lemmas;
}

/**
 * OMWデータを処理
 */
function processOMWData() {
  console.log('OMWデータの処理を開始...');

  try {
    // OMWディレクトリが存在するかチェック
    if (!fs.existsSync(OMW_DIR)) {
      console.error(`OMWデータディレクトリが見つかりません: ${OMW_DIR}`);
      console.log('以下のコマンドでデータをダウンロードしてください:');
      console.log('curl -L "https://github.com/omwn/omw-data/releases/download/v1.4/omw-1.4.tar.xz" -o data/omw-1.4.tar.xz');
      console.log('tar -xf data/omw-1.4.tar.xz -C data/');
      return;
    }

    // 利用可能な言語を取得
    const availableLangs = fs.readdirSync(OMW_DIR).filter(lang => 
      TARGET_LANGUAGES.includes(lang)
    );

    console.log(`処理対象言語: ${availableLangs.length}/${TARGET_LANGUAGES.length}`);
    console.log('対象言語:', availableLangs.join(', '));

    // synset → {lang: [lemma...]} のマップを作成
    const synsetMap = {};

    // 各言語のXMLファイルを処理
    for (const lang of availableLangs) {
      const xmlPath = path.join(OMW_DIR, lang, `${lang}.xml`);
      
      if (!fs.existsSync(xmlPath)) {
        console.warn(`XMLファイルが見つかりません: ${xmlPath}`);
        continue;
      }

      console.log(`処理中: ${lang} (${getLanguageDisplayName(lang)})`);

      try {
        const xmlContent = fs.readFileSync(xmlPath, 'utf8');
        const lemmas = extractLemmasFromXML(xmlContent, lang);
        
        // 言語コードを短縮形に変換 (omw-en -> eng)
        const shortLangCode = lang.replace('omw-', '');
        
        lemmas.forEach((lemmaList, synsetId) => {
          if (!synsetMap[synsetId]) {
            synsetMap[synsetId] = {};
          }
          synsetMap[synsetId][shortLangCode] = lemmaList;
        });
        
        console.log(`  ${lang}: ${lemmas.size} synsets, ${Array.from(lemmas.values()).flat().length} lemmas`);
      } catch (error) {
        console.error(`${lang}の処理中にエラーが発生:`, error);
      }
    }

    // 出力ディレクトリを作成
    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 統計情報を計算
    const stats = {
      totalSynsets: Object.keys(synsetMap).length,
      languages: availableLangs,
      languageStats: {}
    };

    availableLangs.forEach(lang => {
      const shortLangCode = lang.replace('omw-', '');
      let count = 0;
      Object.values(synsetMap).forEach(synset => {
        if (synset[shortLangCode]) count += synset[shortLangCode].length;
      });
      stats.languageStats[lang] = count;
    });

    // JSONファイルとして出力
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(synsetMap, null, 2));

    console.log('\n処理完了!');
    console.log(`出力ファイル: ${OUTPUT_PATH}`);
    console.log(`総synset数: ${stats.totalSynsets}`);
    console.log('\n言語別統計:');
    Object.entries(stats.languageStats).forEach(([lang, count]) => {
      console.log(`  ${lang} (${getLanguageDisplayName(lang)}): ${count} lemmas`);
    });

    // ファイルサイズを表示
    const fileSize = fs.statSync(OUTPUT_PATH).size;
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
    console.log(`\nファイルサイズ: ${fileSizeMB} MB`);

    if (fileSize > 50 * 1024 * 1024) { // 50MB
      console.warn('⚠️  ファイルサイズが大きいため、Vercel Edge Functionsの制限に注意してください');
    }

  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// スクリプトが直接実行された場合のみ処理を実行
if (require.main === module) {
  processOMWData();
}

module.exports = { processOMWData }; 