// わざとESLintエラーを含むテストファイル

// 未使用の変数
const unused = "test";
const anotherUnused = 123;

// 未使用の関数
function unusedFunc() {
  console.log("This function is never called")
}

// セミコロンなし（Prettierエラー）
const test = "no semicolon"

// インデントエラー
function badIndent() {
    console.log("bad indent")
      console.log("very bad indent")
}

// 未定義の変数を使用
export default undefinedVariable;
