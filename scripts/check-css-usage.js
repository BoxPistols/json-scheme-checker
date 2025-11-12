#!/usr/bin/env node

/**
 * CSS整合性チェックスクリプト
 *
 * HTMLで使用されているクラス名とCSSで定義されているセレクタを比較し、
 * 以下をレポートします：
 * - HTMLで使用されているがCSSで未定義のクラス
 * - CSSで定義されているがHTMLで未使用のセレクタ
 */

const fs = require('fs');
const path = require('path');

// グロブパターンのマッチング（簡易版）
function globSync(pattern, baseDir = '.') {
  const results = [];

  function walk(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // node_modules と .git を除外
        if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
          walk(fullPath);
        }
      } else {
        // パターンマッチング（簡易版）
        if (pattern.endsWith('.html') && fullPath.endsWith('.html')) {
          results.push(fullPath);
        } else if (pattern.endsWith('.js') && fullPath.endsWith('.js')) {
          results.push(fullPath);
        } else if (pattern.endsWith('.css') && fullPath.endsWith('.css')) {
          results.push(fullPath);
        }
      }
    }
  }

  walk(baseDir);
  return results;
}

// HTMLファイルから使用されているクラス名を抽出
function extractClassesFromHTML(htmlContent) {
  const classRegex = /class=["']([^"']+)["']/g;
  const classes = new Set();
  let match;

  while ((match = classRegex.exec(htmlContent)) !== null) {
    match[1].split(/\s+/).forEach(cls => {
      if (cls.trim()) {
        classes.add(cls.trim());
      }
    });
  }

  return classes;
}

// JavaScriptファイルから動的に使用されているクラス名を抽出
function extractClassesFromJS(jsContent) {
  const classes = new Set();

  // classList.add('class-name')
  const classListRegex = /classList\.(add|remove|toggle)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;

  while ((match = classListRegex.exec(jsContent)) !== null) {
    classes.add(match[2]);
  }

  // className = 'class-name'
  const classNameRegex = /className\s*=\s*['"]([^'"]+)['"]/g;
  while ((match = classNameRegex.exec(jsContent)) !== null) {
    match[1].split(/\s+/).forEach(cls => {
      if (cls.trim()) {
        classes.add(cls.trim());
      }
    });
  }

  // querySelector('.class-name')
  const querySelectorRegex = /querySelector(?:All)?\s*\(\s*['"]\.([a-zA-Z0-9_-]+)['"]\s*\)/g;
  while ((match = querySelectorRegex.exec(jsContent)) !== null) {
    classes.add(match[1]);
  }

  return classes;
}

// CSSファイルから定義されているセレクタを抽出
function extractSelectorsFromCSS(cssContent) {
  const selectors = new Set();

  // コメントを削除
  cssContent = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');

  // クラスセレクタを抽出（.class-name）
  const selectorRegex = /\.([a-zA-Z0-9_-]+)/g;
  let match;

  while ((match = selectorRegex.exec(cssContent)) !== null) {
    selectors.add(match[1]);
  }

  return selectors;
}

// メイン処理
function main() {
  console.log('\n=== CSS整合性チェック開始 ===\n');

  // HTMLで使われているクラスを収集
  console.log('HTMLファイルをスキャン中...');
  const htmlFiles = globSync('*.html', 'public');
  const usedClasses = new Set();

  htmlFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      extractClassesFromHTML(content).forEach(cls => usedClasses.add(cls));
    } catch (error) {
      console.error(`エラー: ${file} の読み込みに失敗しました`);
    }
  });

  console.log(`  ${htmlFiles.length} 個のHTMLファイルをスキャンしました`);

  // JavaScriptで使われているクラスを収集
  console.log('JavaScriptファイルをスキャン中...');
  const jsFiles = globSync('*.js', 'public');

  jsFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      extractClassesFromJS(content).forEach(cls => usedClasses.add(cls));
    } catch (error) {
      console.error(`エラー: ${file} の読み込みに失敗しました`);
    }
  });

  console.log(`  ${jsFiles.length} 個のJavaScriptファイルをスキャンしました`);
  console.log(`  合計 ${usedClasses.size} 個のクラス名が使用されています\n`);

  // CSSで定義されているセレクタを収集
  console.log('CSSファイルをスキャン中...');
  const cssFiles = globSync('*.css', 'public/styles');
  const definedSelectors = new Set();

  cssFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      extractSelectorsFromCSS(content).forEach(sel => definedSelectors.add(sel));
    } catch (error) {
      console.error(`エラー: ${file} の読み込みに失敗しました`);
    }
  });

  console.log(`  ${cssFiles.length} 個のCSSファイルをスキャンしました`);
  console.log(`  合計 ${definedSelectors.size} 個のセレクタが定義されています\n`);

  // HTMLで使われているがCSSで定義されていないクラスを検出
  const missingCSS = [...usedClasses].filter(cls => !definedSelectors.has(cls));

  // CSSで定義されているがHTMLで使われていないセレクタを検出
  const unusedCSS = [...definedSelectors].filter(sel => !usedClasses.has(sel));

  // 結果表示
  console.log('='.repeat(70));
  console.log('\n【重要】HTMLで使用されているがCSSで未定義のクラス');
  console.log('='.repeat(70));

  if (missingCSS.length > 0) {
    console.log(`\n⚠️  ${missingCSS.length} 個のクラスがCSSで未定義です：\n`);
    missingCSS.sort().forEach(cls => {
      console.log(`  ❌ .${cls}`);
    });
    console.log('\nこれらのクラスは視覚的なスタイルが適用されていない可能性があります。');
  } else {
    console.log('\n✅ すべてのクラスがCSSで定義されています！');
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n【参考】CSSで定義されているがHTMLで未使用のセレクタ');
  console.log('='.repeat(70));

  if (unusedCSS.length > 0) {
    console.log(`\n📊 ${unusedCSS.length} 個のセレクタが未使用です：\n`);

    // 未使用セレクタが多い場合は最初の50個のみ表示
    const displayLimit = 50;
    const displaySelectors = unusedCSS.sort().slice(0, displayLimit);

    displaySelectors.forEach(sel => {
      console.log(`  ℹ️  .${sel}`);
    });

    if (unusedCSS.length > displayLimit) {
      console.log(`\n  ... 他 ${unusedCSS.length - displayLimit} 個のセレクタ`);
    }

    console.log('\n注意: 未使用セレクタには以下が含まれる可能性があります：');
    console.log('  - 動的に生成されるクラス名（このスクリプトでは検出できない）');
    console.log('  - モーダルやツールチップなど、特定の操作で表示される要素');
    console.log('  - 将来使用予定のクラス');
    console.log('  - ライブラリやフレームワークのデフォルトスタイル');
  } else {
    console.log('\n✅ すべてのCSSセレクタが使用されています！');
  }

  console.log('\n' + '='.repeat(70));

  // サマリー
  console.log('\n【サマリー】');
  console.log(`  使用中のクラス数: ${usedClasses.size}`);
  console.log(`  定義済みセレクタ数: ${definedSelectors.size}`);
  console.log(`  未定義のクラス数: ${missingCSS.length}`);
  console.log(`  未使用のセレクタ数: ${unusedCSS.length}`);
  console.log(`  整合性スコア: ${Math.round((1 - missingCSS.length / usedClasses.size) * 100)}%`);

  console.log('\n=== CSS整合性チェック完了 ===\n');

  // 未定義のクラスがある場合は終了コード1を返す
  if (missingCSS.length > 0) {
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  main();
}

module.exports = { extractClassesFromHTML, extractClassesFromJS, extractSelectorsFromCSS };
