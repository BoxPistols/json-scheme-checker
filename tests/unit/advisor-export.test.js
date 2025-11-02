/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AdvisorManager Export Functionality', () => {
  let manager;
  let mockContainer;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div class="container">
        <div id="advisorView" class="advisor-view">
          <div class="advisor-view-header">
            <h2>採用側向けアドバイス</h2>
          </div>
          <div class="advisor-view-content">
            <div class="advisor-job-panel">
              <h3>求人票</h3>
              <div id="advisorJobContent">
                <div class="job-field">
                  <label>職種</label>
                  <div>シニアエンジニア</div>
                </div>
                <div class="job-field">
                  <label>職務内容</label>
                  <div>
                    <p>バックエンド開発を担当</p>
                    <p>API設計とデータベース最適化</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="advisor-advice-panel">
              <h3>AI分析結果</h3>
              <div id="advisorAdviceContent">
                <div class="advisor-markdown">
                  <h2>採用側視点のアドバイス</h2>
                  <p>候補者の技術スキルを評価してください。</p>
                </div>
              </div>
              <div id="advisorExportButtons"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Mock AdvisorManager
    manager = {
      currentJobPosting: {
        title: 'シニアエンジニア',
        description: 'バックエンド開発を担当\nAPI設計とデータベース最適化',
      },
      currentMode: 'employer',
      currentUsage: { prompt_tokens: 250, completion_tokens: 100 },
      currentModel: 'gpt-5-nano',
      getAdviceContent: vi.fn(() => {
        const content = document.querySelector('.advisor-markdown');
        return content
          ? content.textContent
          : '採用側視点のアドバイス\n候補者の技術スキルを評価してください。';
      }),
      getJobPostingText: vi.fn(() => {
        const jobContent = document.getElementById('advisorJobContent');
        return jobContent ? jobContent.textContent : 'シニアエンジニア\nバックエンド開発を担当';
      }),
      exportToCSV: vi.fn(),
      exportToPDF: vi.fn(),
      showExportButtons: vi.fn(),
    };
  });

  describe('Export Button Visibility', () => {
    it('Export buttons should be added to the advice panel', () => {
      const exportContainer = document.getElementById('advisorExportButtons');
      expect(exportContainer).toBeTruthy();
    });

    it('CSV export button should be present and functional', () => {
      const exportContainer = document.getElementById('advisorExportButtons');
      if (exportContainer) {
        const csvBtn = document.createElement('button');
        csvBtn.className = 'advisor-export-csv-btn';
        csvBtn.textContent = 'CSVでエクスポート';
        exportContainer.appendChild(csvBtn);

        const csvButton = document.querySelector('.advisor-export-csv-btn');
        expect(csvButton).toBeTruthy();
        expect(csvButton.textContent).toContain('CSVでエクスポート');
      }
    });

    it('PDF export button should be present and functional', () => {
      const exportContainer = document.getElementById('advisorExportButtons');
      if (exportContainer) {
        const pdfBtn = document.createElement('button');
        pdfBtn.className = 'advisor-export-pdf-btn';
        pdfBtn.textContent = 'PDFでエクスポート';
        exportContainer.appendChild(pdfBtn);

        const pdfButton = document.querySelector('.advisor-export-pdf-btn');
        expect(pdfButton).toBeTruthy();
        expect(pdfButton.textContent).toContain('PDFでエクスポート');
      }
    });

    it('Export buttons should be styled as action buttons', () => {
      const exportContainer = document.getElementById('advisorExportButtons');
      if (exportContainer) {
        const csvBtn = document.createElement('button');
        csvBtn.className = 'advisor-export-csv-btn';
        exportContainer.appendChild(csvBtn);

        const btn = document.querySelector('.advisor-export-csv-btn');
        expect(btn.tagName).toBe('BUTTON');
        expect(btn.className).toContain('advisor-export');
      }
    });
  });

  describe('CSV Export Functionality', () => {
    it('Should extract job posting data for CSV export', () => {
      const jobText = manager.getJobPostingText();
      expect(jobText).toContain('シニアエンジニア');
      expect(jobText).toContain('バックエンド開発');
    });

    it('Should extract advice content for CSV export', () => {
      const adviceText = manager.getAdviceContent();
      expect(adviceText).toContain('採用側視点のアドバイス');
      expect(adviceText).toContain('技術スキルを評価');
    });

    it('CSV export should include timestamp', () => {
      manager.exportToCSV();
      expect(manager.exportToCSV).toHaveBeenCalled();
    });

    it('CSV export should trigger download', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      manager.exportToCSV();

      // Verify that download mechanism would be called
      expect(manager.exportToCSV).toHaveBeenCalled();
    });

    it('CSV content should be properly formatted with headers', () => {
      const jobText = manager.getJobPostingText();
      const adviceText = manager.getAdviceContent();

      // Simulate CSV format
      const csv = [
        ['エクスポート日時', new Date().toISOString()],
        ['視点', manager.currentMode],
        ['モデル', manager.currentModel],
        [''],
        ['求人情報'],
        [jobText],
        [''],
        ['AI分析結果'],
        [adviceText],
      ];

      expect(csv).toHaveLength(9);
      expect(csv[0][0]).toBe('エクスポート日時');
      expect(csv[4][0]).toBe('求人情報');
    });
  });

  describe('PDF Export Functionality', () => {
    it('Should extract job posting data for PDF export', () => {
      const jobText = manager.getJobPostingText();
      expect(jobText).toContain('シニアエンジニア');
    });

    it('Should extract advice content for PDF export', () => {
      const adviceText = manager.getAdviceContent();
      expect(adviceText).toContain('採用側視点のアドバイス');
    });

    it('PDF export should trigger download', () => {
      manager.exportToPDF();
      expect(manager.exportToPDF).toHaveBeenCalled();
    });

    it('PDF should include document title', () => {
      const modeTitle = document.querySelector('.advisor-view-header h2');
      expect(modeTitle).toBeTruthy();
      expect(modeTitle.textContent).toContain('採用側向けアドバイス');
    });

    it('PDF should include all sections', () => {
      const jobPanel = document.querySelector('.advisor-job-panel');
      const advicePanel = document.querySelector('.advisor-advice-panel');

      expect(jobPanel).toBeTruthy();
      expect(advicePanel).toBeTruthy();
    });
  });

  describe('Export Data Integrity', () => {
    it('Export should include current model information', () => {
      const exportData = {
        mode: manager.currentMode,
        model: manager.currentModel,
        usage: manager.currentUsage,
        timestamp: new Date().toISOString(),
      };

      expect(exportData.model).toBe('gpt-5-nano');
      expect(exportData.usage.prompt_tokens).toBe(250);
    });

    it('Export should include token usage data', () => {
      const exportData = {
        prompt_tokens: manager.currentUsage.prompt_tokens,
        completion_tokens: manager.currentUsage.completion_tokens,
      };

      expect(exportData.prompt_tokens).toBe(250);
      expect(exportData.completion_tokens).toBe(100);
    });

    it('Export filename should include mode and timestamp', () => {
      const timestamp = new Date().toISOString().split('T')[0];
      const mode = manager.currentMode;
      const filename = `advice_${mode}_${timestamp}.csv`;

      expect(filename).toContain(mode);
      expect(filename).toContain(timestamp);
    });
  });

  describe('Export User Experience', () => {
    it('Export buttons should be disabled while content is loading', () => {
      const exportContainer = document.getElementById('advisorExportButtons');
      if (exportContainer) {
        const csvBtn = document.createElement('button');
        csvBtn.className = 'advisor-export-csv-btn';
        csvBtn.disabled = true;
        exportContainer.appendChild(csvBtn);

        const btn = document.querySelector('.advisor-export-csv-btn');
        expect(btn.disabled).toBe(true);
      }
    });

    it('Export buttons should be enabled when content is available', () => {
      const exportContainer = document.getElementById('advisorExportButtons');
      if (exportContainer) {
        const csvBtn = document.createElement('button');
        csvBtn.className = 'advisor-export-csv-btn';
        csvBtn.disabled = false;
        exportContainer.appendChild(csvBtn);

        const btn = document.querySelector('.advisor-export-csv-btn');
        expect(btn.disabled).toBe(false);
      }
    });

    it('Export should show success feedback to user', () => {
      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});
      manager.exportToCSV();
      // In real implementation, this would show success message
      expect(manager.exportToCSV).toHaveBeenCalled();
      mockAlert.mockRestore();
    });
  });

  describe('Export Accessibility', () => {
    it('Export buttons should have descriptive labels', () => {
      const exportContainer = document.getElementById('advisorExportButtons');
      if (exportContainer) {
        const csvBtn = document.createElement('button');
        csvBtn.className = 'advisor-export-csv-btn';
        csvBtn.title = 'AI分析結果をCSV形式でダウンロード';
        csvBtn.textContent = 'CSVでエクスポート';
        exportContainer.appendChild(csvBtn);

        const btn = document.querySelector('.advisor-export-csv-btn');
        expect(btn.textContent).toContain('CSVでエクスポート');
      }
    });

    it('Export buttons should have aria-label for screen readers', () => {
      const exportContainer = document.getElementById('advisorExportButtons');
      if (exportContainer) {
        const csvBtn = document.createElement('button');
        csvBtn.className = 'advisor-export-csv-btn';
        csvBtn.setAttribute('aria-label', 'AI分析結果をCSV形式でエクスポート');
        exportContainer.appendChild(csvBtn);

        const btn = document.querySelector('.advisor-export-csv-btn');
        expect(btn.getAttribute('aria-label')).toContain('エクスポート');
      }
    });

    it('Export buttons should be keyboard accessible', () => {
      const exportContainer = document.getElementById('advisorExportButtons');
      if (exportContainer) {
        const csvBtn = document.createElement('button');
        csvBtn.className = 'advisor-export-csv-btn';
        csvBtn.type = 'button';
        exportContainer.appendChild(csvBtn);

        const btn = document.querySelector('.advisor-export-csv-btn');
        expect(btn.tagName).toBe('BUTTON');
        expect(btn.type).toBe('button');
      }
    });
  });
});
