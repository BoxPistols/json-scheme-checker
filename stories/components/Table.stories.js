/**
 * テーブルコンポーネントのストーリー
 */

export default {
  title: 'コンポーネント/テーブル',
  parameters: {
    layout: 'padded',
  },
};

// データテーブル（スキーマ表示用）
export const DataTable = () => {
  const container = document.createElement('div');
  container.className = 'table-view';
  container.style.maxWidth = '900px';

  const table = document.createElement('table');
  table.className = 'data-table';

  table.innerHTML = `
    <colgroup>
      <col class="col-prop" />
      <col class="col-value" />
      <col class="col-type" />
    </colgroup>
    <thead>
      <tr>
        <th>プロパティ</th>
        <th>値</th>
        <th>型</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="property-name">@type</span></td>
        <td class="property-value">JobPosting</td>
        <td><span class="property-type">string</span></td>
      </tr>
      <tr>
        <td><span class="property-name">title</span></td>
        <td class="property-value">エンジニア募集</td>
        <td><span class="property-type">string</span></td>
      </tr>
      <tr>
        <td><span class="property-name">datePosted</span></td>
        <td class="property-value">2025-01-22</td>
        <td><span class="property-type">string</span></td>
      </tr>
      <tr>
        <td><span class="property-name">baseSalary</span></td>
        <td class="property-value">600000〜800000 円/月</td>
        <td><span class="property-type">object</span></td>
      </tr>
      <tr>
        <td><span class="property-name">employmentType</span></td>
        <td class="property-value">FULL_TIME</td>
        <td><span class="property-type">string</span></td>
      </tr>
    </tbody>
  `;

  container.appendChild(table);

  return container;
};

DataTable.storyName = 'データテーブル（スキーマ表示）';

// ネストされたオブジェクト表示
export const NestedObjectTable = () => {
  const container = document.createElement('div');
  container.className = 'table-view';
  container.style.maxWidth = '900px';

  const mainTable = document.createElement('table');
  mainTable.className = 'data-table';

  mainTable.innerHTML = `
    <colgroup>
      <col class="col-prop" />
      <col class="col-value" />
      <col class="col-type" />
    </colgroup>
    <thead>
      <tr>
        <th>プロパティ</th>
        <th>値</th>
        <th>型</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="property-name">@type</span></td>
        <td class="property-value">JobPosting</td>
        <td><span class="property-type">string</span></td>
      </tr>
      <tr>
        <td><span class="property-name">hiringOrganization</span></td>
        <td>
          <div class="nested-object">
            <table class="data-table">
              <colgroup>
                <col class="col-prop" />
                <col class="col-value" />
                <col class="col-type" />
              </colgroup>
              <tbody>
                <tr>
                  <td><span class="property-name">@type</span></td>
                  <td class="property-value">Organization</td>
                  <td><span class="property-type">string</span></td>
                </tr>
                <tr>
                  <td><span class="property-name">name</span></td>
                  <td class="property-value">株式会社サンプル</td>
                  <td><span class="property-type">string</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </td>
        <td><span class="property-type">object</span></td>
      </tr>
    </tbody>
  `;

  container.appendChild(mainTable);

  return container;
};

NestedObjectTable.storyName = 'ネストされたオブジェクト表示';

// モーダル内テーブル
export const ModalTable = () => {
  const table = document.createElement('table');
  table.className = 'modal-table';
  table.style.maxWidth = '600px';

  table.innerHTML = `
    <thead>
      <tr>
        <th>保存方法</th>
        <th>セキュリティ</th>
        <th>利便性</th>
        <th>保存期間</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>保存しない</strong></td>
        <td class="status-high">高</td>
        <td class="status-low">低</td>
        <td>なし</td>
      </tr>
      <tr>
        <td><strong>タブを閉じるまで</strong></td>
        <td class="status-medium">中</td>
        <td class="status-medium">中</td>
        <td>タブを閉じるまで</td>
      </tr>
      <tr>
        <td><strong>24時間保存</strong></td>
        <td class="status-low">低</td>
        <td class="status-high">高</td>
        <td>24時間</td>
      </tr>
    </tbody>
  `;

  return table;
};

ModalTable.storyName = 'モーダル内テーブル';

// コンパクト配列テーブル
export const CompactArrayTable = () => {
  const table = document.createElement('table');
  table.className = 'compact-array-table';
  table.style.maxWidth = '700px';

  table.innerHTML = `
    <thead>
      <tr>
        <th>#</th>
        <th>スキル</th>
        <th>レベル</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>JavaScript</td>
        <td>上級</td>
      </tr>
      <tr>
        <td>2</td>
        <td>TypeScript</td>
        <td>中級</td>
      </tr>
      <tr>
        <td>3</td>
        <td>React</td>
        <td>上級</td>
      </tr>
    </tbody>
  `;

  return table;
};

CompactArrayTable.storyName = 'コンパクト配列テーブル';

// ストライプテーブル
export const StripedTable = () => {
  const table = document.createElement('table');
  table.className = 'modal-table modal-table--striped';
  table.style.maxWidth = '700px';

  table.innerHTML = `
    <thead>
      <tr>
        <th class="table-col-quarter">タブ</th>
        <th>分析内容</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Schema</strong></td>
        <td>JSON-LD構造化データの詳細表示。テーブル/JSON形式で切り替え可能。</td>
      </tr>
      <tr>
        <td><strong>HTML構造</strong></td>
        <td>HTML要素数、見出しタグ（h1〜h6）の使用状況、ページ構造の分析。</td>
      </tr>
      <tr>
        <td><strong>概要・メタタグ</strong></td>
        <td>SEOスコア、タイトルタグ、メタディスクリプション、Robotsタグの検証。</td>
      </tr>
      <tr>
        <td><strong>SNS</strong></td>
        <td>Open Graph（Facebook/LinkedIn）、Twitter Cardsの設定確認。</td>
      </tr>
    </tbody>
  `;

  return table;
};

StripedTable.storyName = 'ストライプテーブル';
