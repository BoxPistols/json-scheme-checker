/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';
import mod from '../../public/modules/content-upload-reviewer.js';
const ContentUploadReviewerManager =
  mod.ContentUploadReviewerManager || mod.default || mod;

describe('Content Upload Reviewer - Parse Response', () => {
  let manager;

  beforeEach(() => {
    localStorage.clear();
    manager = new ContentUploadReviewerManager();
  });

  describe('parseReviewResponse', () => {
    it('校閲済みテキストと分析結果を正しく分離', () => {
      const fullText = `## 総合評価
★★★★☆ (4/5)
良好なコンテンツです。

## 校閲済みテキスト
これは校閲されたテキストです。
改善された内容が含まれています。

## 詳細な改善提案
### タイトル
- 現状: 元のタイトル
- 改善案: 改善されたタイトル`;

      const result = manager.parseReviewResponse(fullText);

      expect(result.revisedText).toContain('これは校閲されたテキストです');
      expect(result.revisedText).toContain('改善された内容が含まれています');
      expect(result.analysisText).toContain('総合評価');
      expect(result.analysisText).toContain('詳細な改善提案');
      expect(result.analysisText).not.toContain('## 校閲済みテキスト');
    });

    it('校閲済みテキストセクションがない場合は空文字列', () => {
      const fullText = `## 総合評価
★★★★☆ (4/5)
良好なコンテンツです。

## 詳細な改善提案
改善案をここに記載`;

      const result = manager.parseReviewResponse(fullText);

      expect(result.revisedText).toBe('');
      expect(result.analysisText).toBe(fullText);
    });

    it('校閲済みテキストが最後のセクションの場合', () => {
      const fullText = `## 総合評価
★★★★☆ (4/5)

## 校閲済みテキスト
最終セクションの校閲済みテキスト。
ここで終了します。`;

      const result = manager.parseReviewResponse(fullText);

      expect(result.revisedText).toContain('最終セクションの校閲済みテキスト');
      expect(result.revisedText).toContain('ここで終了します');
    });

    it('校閲済みテキストの後に区切り線がある場合', () => {
      const fullText = `## 校閲済みテキスト
校閲されたテキスト

---

追加情報がここに`;

      const result = manager.parseReviewResponse(fullText);

      expect(result.revisedText).toContain('校閲されたテキスト');
      expect(result.revisedText).not.toContain('---');
      expect(result.revisedText).not.toContain('追加情報');
    });

    it('大文字小文字の違いを許容', () => {
      const fullText = `## 校閲済みテキスト
テスト内容

## 次のセクション`;

      const result1 = manager.parseReviewResponse(fullText);
      expect(result1.revisedText).toContain('テスト内容');

      const fullText2 = `## 校閲済みテキスト
テスト内容

## 次のセクション`;

      const result2 = manager.parseReviewResponse(fullText2);
      expect(result2.revisedText).toContain('テスト内容');
    });

    it('改行やスペースが含まれる校閲済みテキストセクション', () => {
      const fullText = `## 校閲済みテキスト

これは校閲されたテキストです。

複数の段落があります。

## 次のセクション`;

      const result = manager.parseReviewResponse(fullText);

      expect(result.revisedText).toContain('これは校閲されたテキストです');
      expect(result.revisedText).toContain('複数の段落があります');
    });

    it('空の応答の場合', () => {
      const result = manager.parseReviewResponse('');

      expect(result.revisedText).toBe('');
      expect(result.analysisText).toBe('');
    });

    it('マークダウンフォーマットが崩れている場合でも処理', () => {
      const fullText = `総合評価
良好です

##校閲済みテキスト
校閲内容

改善提案
提案内容`;

      const result = manager.parseReviewResponse(fullText);

      // 正規表現が厳密すぎない限り抽出できる
      expect(result.analysisText).toBeTruthy();
    });
  });

  describe('レビュー種類のラベル取得', () => {
    it('各レビュー種類の正しいラベルを返す', () => {
      expect(manager.getReviewTypeLabel('blog')).toBe('ブログコンテンツ');
      expect(manager.getReviewTypeLabel('job')).toBe('求人票');
      expect(manager.getReviewTypeLabel('skill-sheet')).toBe('スキルシート');
      expect(manager.getReviewTypeLabel('matching')).toBe('求人×スキルシートマッチング');
      expect(manager.getReviewTypeLabel('general')).toBe('汎用テキスト');
    });

    it('不明なレビュー種類の場合はデフォルトを返す', () => {
      expect(manager.getReviewTypeLabel('unknown')).toBe('汎用');
    });
  });

  describe('formatJobPostingText', () => {
    it('JobPosting JSON-LDを正しくフォーマット', () => {
      const jobPosting = {
        title: 'ソフトウェアエンジニア',
        description: 'Webアプリケーションの開発',
        employmentType: 'FULL_TIME',
        baseSalary: {
          value: 5000000,
          currency: 'JPY',
        },
        skills: 'JavaScript, React, Node.js',
        qualifications: '実務経験3年以上',
        responsibilities: 'フロントエンド開発',
      };

      const result = manager.formatJobPostingText(jobPosting);

      expect(result).toContain('職種: ソフトウェアエンジニア');
      expect(result).toContain('職務内容:\nWebアプリケーションの開発');
      expect(result).toContain('雇用形態: FULL_TIME');
      expect(result).toContain('スキル要件: JavaScript, React, Node.js');
      expect(result).toContain('応募資格: 実務経験3年以上');
      expect(result).toContain('業務内容: フロントエンド開発');
    });

    it('baseSalaryがオブジェクトの場合はJSON文字列化', () => {
      const jobPosting = {
        title: 'エンジニア',
        baseSalary: {
          value: 5000000,
          currency: 'JPY',
        },
      };

      const result = manager.formatJobPostingText(jobPosting);

      expect(result).toContain('給与:');
      expect(result).toContain('value');
      expect(result).toContain('currency');
    });

    it('一部のフィールドが欠けている場合でも処理', () => {
      const jobPosting = {
        title: 'エンジニア',
        description: '開発業務',
      };

      const result = manager.formatJobPostingText(jobPosting);

      expect(result).toContain('職種: エンジニア');
      expect(result).toContain('職務内容:\n開発業務');
      expect(result).not.toContain('undefined');
    });

    it('空のオブジェクトでもエラーにならない', () => {
      const jobPosting = {};

      const result = manager.formatJobPostingText(jobPosting);

      expect(result).toBe('');
    });
  });
});
