/**
 * モーダルコンポーネントのストーリー
 */

import { expect, userEvent, within } from '@storybook/test';

export default {
  title: 'コンポーネント/モーダル',
  parameters: {
    layout: 'fullscreen',
  },
};

// 基本モーダル
export const Basic = {
  render: () => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';

    overlay.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <h2>モーダルタイトル</h2>
        </div>
        <div class="modal-body">
          <p>これは基本的なモーダルのコンテンツです。</p>
          <p>複数の段落を含むことができます。</p>
        </div>
        <div class="modal-footer">
          <button class="btn-modal-close">閉じる</button>
        </div>
      </div>
    `;

    return overlay;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const modal = canvas.getByRole('heading', { name: /モーダルタイトル/ });
    await expect(modal).toBeInTheDocument();

    const closeButton = canvas.getByRole('button', { name: /閉じる/ });
    await expect(closeButton).toBeInTheDocument();
  },
};

// ガイドモーダル（サイズ: Wide）
export const GuideModal = () => {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';

  overlay.innerHTML = `
    <div class="modal-container modal-container--wide">
      <div class="modal-header modal-header--sticky">
        <h2>Schema Viewer & AI Advisor - 使い方ガイド</h2>
      </div>
      <div class="modal-body">
        <section class="modal-section">
          <h3 class="modal-section-title">このアプリでできること</h3>
          <p class="modal-lead-text">
            Web構造化データの可視化から、AIによるSEO最適化支援まで、Webサイトの品質向上を総合的にサポートします。
          </p>
        </section>

        <section class="modal-section">
          <h3 class="modal-section-title">基本操作</h3>
          <div class="modal-subsection">
            <h4 class="modal-subsection-title">1. URLを入力して分析開始</h4>
            <ol class="modal-ordered-list">
              <li>画面上部のURL入力欄に、分析したいWebページのURLを貼り付けます</li>
              <li>「取得」ボタンをクリック、またはEnterキーを押します</li>
              <li>数秒後、分析結果が表示されます</li>
            </ol>
          </div>
        </section>
      </div>
      <div class="modal-footer">
        <button class="btn-modal-close">閉じる</button>
      </div>
    </div>
  `;

  return overlay;
};

GuideModal.storyName = 'ガイドモーダル（Wide）';

// 情報ボックス付きモーダル
export const ModalWithInfoBoxes = () => {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';

  overlay.innerHTML = `
    <div class="modal-container">
      <div class="modal-header">
        <h2>認証情報の保存について</h2>
      </div>
      <div class="modal-body">
        <p>Basic認証のユーザー名とパスワードをブラウザに保存する方法を選択できます。</p>

        <div class="modal-info-box modal-info-box--green">
          <h4>保存しない（最もセキュア）</h4>
          <p>ページをリロードするたびに再入力が必要です。セキュリティを最優先する場合に推奨します。</p>
        </div>

        <div class="modal-info-box modal-info-box--orange">
          <h4>タブを閉じるまで保存（推奨）</h4>
          <p>ブラウザのタブを閉じると自動的に削除されます。セキュリティと利便性のバランスが取れた推奨オプションです。</p>
        </div>

        <div class="modal-info-box modal-info-box--red">
          <h4>永続保存（期限なし、最もリスク高）</h4>
          <p>期限なしで永続的に保存されます。最も利便性が高い一方、セキュリティリスクも最大です。</p>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-modal-close">閉じる</button>
      </div>
    </div>
  `;

  return overlay;
};

ModalWithInfoBoxes.storyName = '情報ボックス付きモーダル';

// テーブル付きモーダル
export const ModalWithTable = () => {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';

  overlay.innerHTML = `
    <div class="modal-container">
      <div class="modal-header modal-header--sticky">
        <h2>Robots メタタグの設定方法</h2>
      </div>
      <div class="modal-body">
        <section class="modal-section">
          <h3>各値の意味</h3>
          <table class="modal-table">
            <tbody>
              <tr>
                <td><strong>index</strong></td>
                <td>Google が このページを検索対象に含めてもいい</td>
              </tr>
              <tr>
                <td><strong>follow</strong></td>
                <td>ページ内のリンクをたどってもいい</td>
              </tr>
              <tr>
                <td><strong>noindex</strong></td>
                <td>このページを検索結果から除外する</td>
              </tr>
              <tr>
                <td><strong>nofollow</strong></td>
                <td>リンクをたどらない（ページは表示されるが）</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
      <div class="modal-footer">
        <button class="btn-modal-close">閉じる</button>
      </div>
    </div>
  `;

  return overlay;
};

ModalWithTable.storyName = 'テーブル付きモーダル';

// ナローモーダル
export const NarrowModal = () => {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';

  overlay.innerHTML = `
    <div class="modal-container modal-container--narrow">
      <div class="modal-header">
        <h2>確認</h2>
      </div>
      <div class="modal-body">
        <p>この操作を実行してもよろしいですか？</p>
      </div>
      <div class="modal-footer" style="display: flex; gap: 12px; justify-content: flex-end;">
        <button style="padding: 8px 16px; background: var(--secondary-bg-color); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">キャンセル</button>
        <button class="btn-modal-close">実行</button>
      </div>
    </div>
  `;

  return overlay;
};

NarrowModal.storyName = 'ナローモーダル（確認ダイアログ）';
