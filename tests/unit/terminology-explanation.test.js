import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('用語解説セクション: advisor.js', () => {
  const advisorContent = readFileSync(join(__dirname, '../../api/advisor.js'), 'utf-8');

  it('AGENT_PROMPT に用語解説セクションが含まれる', () => {
    expect(advisorContent).toContain('## 用語解説');
    expect(advisorContent).toContain('重要な専門用語・技術キーワードの解説');
    expect(advisorContent).toContain('エージェントが理解しやすいように');
    expect(advisorContent).toContain('最低3つ、最大5つ程度');
  });

  it('AGENT_PROMPT の用語解説に例が含まれる', () => {
    expect(advisorContent).toContain('例:');
    expect(advisorContent).toContain('[用語1]');
    expect(advisorContent).toContain('[わかりやすい説明]');
  });

  it('EMPLOYER_PROMPT と APPLICANT_PROMPT には用語解説がない（エージェント専用）', () => {
    const employerMatch = advisorContent.match(/const EMPLOYER_PROMPT = `([\s\S]*?)`;/);
    const applicantMatch = advisorContent.match(/const APPLICANT_PROMPT = `([\s\S]*?)`;/);

    if (employerMatch) {
      expect(employerMatch[1]).not.toContain('## 用語解説');
    }
    if (applicantMatch) {
      expect(applicantMatch[1]).not.toContain('## 用語解説');
    }
  });
});

describe('用語解説セクション: blog-reviewer.js', () => {
  const blogReviewerContent = readFileSync(join(__dirname, '../../api/blog-reviewer.js'), 'utf-8');

  it('BLOG_REVIEW_PROMPT に用語解説セクションが含まれる', () => {
    expect(blogReviewerContent).toContain('## 用語解説');
    expect(blogReviewerContent).toContain('重要な専門用語・マーケティングキーワードの解説');
    expect(blogReviewerContent).toContain('ライターや編集者が理解しやすいように');
    expect(blogReviewerContent).toContain('最低3つ、最大5つ程度');
  });

  it('BLOG_REVIEW_PROMPT の用語解説に例が含まれる', () => {
    expect(blogReviewerContent).toContain('例:');
    expect(blogReviewerContent).toContain('[用語1]');
    expect(blogReviewerContent).toContain('[わかりやすい説明]');
  });
});

describe('用語解説セクション: chat.js', () => {
  const chatContent = readFileSync(join(__dirname, '../../api/chat.js'), 'utf-8');

  it('agent チャットプロンプトに用語解説が必須化されている', () => {
    expect(chatContent).toContain('agent:');
    expect(chatContent).toContain('回答の最後に、登場した専門用語や技術キーワードについて');
    expect(chatContent).toContain('用語解説');
    expect(chatContent).toContain('エージェントが理解しやすいように');
  });

  it('writer チャットプロンプトに用語解説が必須化されている', () => {
    expect(chatContent).toContain('writer:');
    expect(chatContent).toContain('回答の最後に、登場したSEO用語やマーケティング用語について');
    expect(chatContent).toContain('用語解説');
    expect(chatContent).toContain('ライターが理解しやすいように');
  });

  it('editor チャットプロンプトに用語解説が必須化されている', () => {
    expect(chatContent).toContain('editor:');
    expect(chatContent).toContain('回答の最後に、登場したSEO用語やマーケティング用語について');
    expect(chatContent).toContain('用語解説');
    expect(chatContent).toContain('編集者が理解しやすいように');
  });

  it('employer と applicant チャットプロンプトには用語解説がない', () => {
    const employerMatch = chatContent.match(/employer: `([\s\S]*?)`,/);
    const applicantMatch = chatContent.match(/applicant: `([\s\S]*?)`,/);

    if (employerMatch) {
      expect(employerMatch[1]).not.toContain('用語解説');
    }
    if (applicantMatch) {
      expect(applicantMatch[1]).not.toContain('用語解説');
    }
  });

  it('owner と marketer チャットプロンプトには用語解説がない（一般向け）', () => {
    const ownerMatch = chatContent.match(/owner: `([\s\S]*?)`,/);
    const marketerMatch = chatContent.match(/marketer: `([\s\S]*?)`,/);

    if (ownerMatch) {
      expect(ownerMatch[1]).not.toContain('用語解説');
    }
    if (marketerMatch) {
      expect(marketerMatch[1]).not.toContain('用語解説');
    }
  });
});

describe('用語解説セクション: 一貫性チェック', () => {
  const advisorContent = readFileSync(join(__dirname, '../../api/advisor.js'), 'utf-8');
  const blogReviewerContent = readFileSync(join(__dirname, '../../api/blog-reviewer.js'), 'utf-8');
  const chatContent = readFileSync(join(__dirname, '../../api/chat.js'), 'utf-8');

  it('全ての用語解説で「最低3つ、最大5つ程度」の指示が統一されている', () => {
    expect(advisorContent).toContain('最低3つ、最大5つ程度');
    expect(blogReviewerContent).toContain('最低3つ、最大5つ程度');
    expect(chatContent).toContain('最低3つ、最大5つ');
  });

  it('全ての用語解説で「簡潔に解説」の指示が含まれている', () => {
    expect(advisorContent).toContain('簡潔に解説');
    expect(blogReviewerContent).toContain('簡潔に解説');
    expect(chatContent).toContain('簡潔に解説');
  });
});
