#!/usr/bin/env node

/**
 * Japanese WordNet データ処理スクリプト
 * 
 * 使用方法:
 * 1. Japanese WordNetのデータをダウンロード
 * 2. このスクリプトを実行してデータを処理
 * 3. 生成されたJSONファイルをAPIで使用
 */

const fs = require('fs');
const path = require('path');

// データファイルのパス
const WORDNET_DATA_PATH = path.join(__dirname, '../data/wnjpn-ok.tab');
const DEFINITIONS_DATA_PATH = path.join(__dirname, '../data/wnjpn-def.tab');
const OUTPUT_PATH = path.join(__dirname, '../src/data/japanese-wordnet.json');

/**
 * Japanese WordNetデータを処理
 */
function processJapaneseWordNet() {
  console.log('Japanese WordNetデータの処理を開始...');

  try {
    // データファイルが存在するかチェック
    if (!fs.existsSync(WORDNET_DATA_PATH)) {
      console.error(`データファイルが見つかりません: ${WORDNET_DATA_PATH}`);
      console.log('以下のコマンドでデータをダウンロードしてください:');
      console.log('curl -L https://github.com/bond-lab/wnja/releases/download/v1.1/wnjpn-ok.tab.gz -o data/wnjpn-ok.tab.gz');
      console.log('gunzip data/wnjpn-ok.tab.gz');
      return;
    }

    // 単語データを読み込み
    const wordData = fs.readFileSync(WORDNET_DATA_PATH, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [synsetId, word, confidence] = line.split('\t');
        return { synsetId, word, confidence };
      });

    // 定義データを読み込み（存在する場合）
    let definitions = new Map();
    if (fs.existsSync(DEFINITIONS_DATA_PATH)) {
      const defData = fs.readFileSync(DEFINITIONS_DATA_PATH, 'utf8')
        .split('\n')
        .filter(line => line.trim())
        .forEach(line => {
          const [synsetId, senseNum, englishDef, japaneseDef] = line.split('\t');
          if (synsetId && japaneseDef) {
            definitions.set(synsetId, japaneseDef.trim());
          }
        });
    }

    // 品詞を判定
    function getPartOfSpeech(synsetId) {
      const pos = synsetId.split('-')[1];
      switch (pos) {
        case 'n': return '名詞';
        case 'v': return '動詞';
        case 'a': return '形容詞';
        case 'r': return '副詞';
        default: return 'その他';
      }
    }

    // 単語別にデータを整理
    const wordMap = new Map();

    wordData.forEach(({ synsetId, word, confidence }) => {
      if (!wordMap.has(word)) {
        wordMap.set(word, []);
      }

      wordMap.get(word).push({
        synsetId,
        word,
        confidence,
        partOfSpeech: getPartOfSpeech(synsetId),
        definition: definitions.get(synsetId) || undefined
      });
    });

    // 信頼度の高いデータのみをフィルタリング
    const filteredData = {};
    wordMap.forEach((entries, word) => {
      // hand（手動）または mono（単一）の信頼度の高いデータのみを保持
      const highConfidenceEntries = entries.filter(entry => 
        entry.confidence === 'hand' || entry.confidence === 'mono'
      );

      if (highConfidenceEntries.length > 0) {
        filteredData[word] = highConfidenceEntries;
      }
    });

    // 出力ディレクトリを作成
    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // JSONファイルとして出力
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(filteredData, null, 2));

    console.log(`処理完了: ${Object.keys(filteredData).length} 単語`);
    console.log(`出力ファイル: ${OUTPUT_PATH}`);

    // 統計情報を表示
    const stats = {
      totalWords: Object.keys(filteredData).length,
      totalEntries: Object.values(filteredData).flat().length,
      byPartOfSpeech: {}
    };

    Object.values(filteredData).flat().forEach(entry => {
      const pos = entry.partOfSpeech;
      stats.byPartOfSpeech[pos] = (stats.byPartOfSpeech[pos] || 0) + 1;
    });

    console.log('\n統計情報:');
    console.log(`- 総単語数: ${stats.totalWords}`);
    console.log(`- 総エントリ数: ${stats.totalEntries}`);
    console.log('- 品詞別分布:');
    Object.entries(stats.byPartOfSpeech).forEach(([pos, count]) => {
      console.log(`  ${pos}: ${count}`);
    });

  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// スクリプトが直接実行された場合のみ処理を実行
if (require.main === module) {
  processJapaneseWordNet();
}

module.exports = { processJapaneseWordNet }; 