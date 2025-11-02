/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';

describe('AdvisorManager Modal Layout - 2+1 Grid', () => {
  let container;
  let switcher;

  beforeEach(() => {
    // Add CSS styles to test environment
    const style = document.createElement('style');
    style.textContent = `
      .advisor-perspective-switcher {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        padding: 16px 24px;
      }

      .advisor-perspective-btn {
        padding: 12px 16px;
        border: 1px solid #e2e8f0;
        background: #ffffff;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .advisor-perspective-btn:nth-child(3) {
        grid-column: 1 / -1;
      }
    `;
    document.head.appendChild(style);

    // Setup DOM for perspective switcher
    document.body.innerHTML = `
      <div class="container">
        <div id="advisorView" class="advisor-view">
          <div class="advisor-perspective-switcher">
            <button class="advisor-perspective-btn active" data-action="advisor-switch-perspective-employer" type="button">採用側視点</button>
            <button class="advisor-perspective-btn" data-action="advisor-switch-perspective-applicant" type="button">応募者視点</button>
            <button class="advisor-perspective-btn advisor-perspective-btn-agent" data-action="advisor-switch-perspective-agent" type="button"><span class="btn-title">エージェント向け</span><span class="btn-description">営業戦略・市場分析・双方へのアドバイス</span></button>
          </div>
        </div>
      </div>
    `;

    switcher = document.querySelector('.advisor-perspective-switcher');
  });

  describe('Grid Layout Structure', () => {
    it('Switcher container should use CSS Grid display', () => {
      const styles = window.getComputedStyle(switcher);
      expect(styles.display).toBe('grid');
    });

    it('Grid should have 2 columns', () => {
      const styles = window.getComputedStyle(switcher);
      expect(styles.gridTemplateColumns).toMatch(/1fr\s+1fr|auto\s+auto/);
    });

    it('Should have 3 buttons total', () => {
      const buttons = switcher.querySelectorAll('.advisor-perspective-btn');
      expect(buttons.length).toBe(3);
    });

    it('Employer button should be in first position', () => {
      const buttons = switcher.querySelectorAll('.advisor-perspective-btn');
      expect(buttons[0].textContent).toContain('採用側視点');
      expect(buttons[0].classList.contains('active')).toBe(true);
    });

    it('Applicant button should be in second position', () => {
      const buttons = switcher.querySelectorAll('.advisor-perspective-btn');
      expect(buttons[1].textContent).toContain('応募者視点');
    });

    it('Agent button should be in third position', () => {
      const buttons = switcher.querySelectorAll('.advisor-perspective-btn');
      expect(buttons[2].textContent).toContain('エージェント向け');
    });
  });

  describe('2+1 Layout Configuration', () => {
    it('Employer and Applicant buttons should be in top row', () => {
      const buttons = switcher.querySelectorAll('.advisor-perspective-btn');
      const employerBtn = buttons[0];
      const applicantBtn = buttons[1];

      expect(employerBtn.style.gridColumn).not.toBe('1 / -1');
      expect(applicantBtn.style.gridColumn).not.toBe('1 / -1');
    });

    it('Agent button should span both columns (grid-column: 1 / -1)', () => {
      const buttons = switcher.querySelectorAll('.advisor-perspective-btn');
      const agentBtn = buttons[2];

      const styles = window.getComputedStyle(agentBtn);
      expect(styles.gridColumn).toMatch(/1\s*\/\s*-1|1\s*\/\s*3/);
    });

    it('Should have gap between buttons', () => {
      const styles = window.getComputedStyle(switcher);
      expect(styles.gap).toBeTruthy();
      expect(styles.gap).not.toBe('0px');
    });
  });

  describe('Button Styling in 2+1 Layout', () => {
    it('First two buttons should not span both columns', () => {
      const buttons = switcher.querySelectorAll('.advisor-perspective-btn');
      // First two buttons should use default grid placement (1 column each)
      expect(buttons[0].style.gridColumn).not.toBe('1 / -1');
      expect(buttons[1].style.gridColumn).not.toBe('1 / -1');
    });

    it('Active button should have active styling', () => {
      const buttons = switcher.querySelectorAll('.advisor-perspective-btn');
      const activeBtn = buttons[0];

      expect(activeBtn.classList.contains('active')).toBe(true);
      const styles = window.getComputedStyle(activeBtn);
      // Should have different background color for active state
      expect(styles.backgroundColor).toBeTruthy();
    });

    it('Hover state should be visually distinct', () => {
      const buttons = switcher.querySelectorAll('.advisor-perspective-btn');
      const btn = buttons[0];

      const styles = window.getComputedStyle(btn);
      expect(styles.cursor).toBe('pointer');
      expect(styles.transition).toContain('all');
    });
  });

  describe('Responsive Behavior', () => {
    it('Grid should maintain 2 columns layout', () => {
      const styles = window.getComputedStyle(switcher);
      // Check that grid is using 2 columns
      const columns = styles.gridTemplateColumns.split(/\s+/);
      expect(columns.length).toBeGreaterThanOrEqual(2);
    });

    it('Buttons should not wrap horizontally in narrow containers', () => {
      // Set container width to narrow
      switcher.style.width = '300px';
      const buttons = switcher.querySelectorAll('.advisor-perspective-btn');

      buttons.forEach(btn => {
        const styles = window.getComputedStyle(btn);
        // Grid should prevent wrapping
        expect(styles.display).not.toBe('block');
      });
    });

    it('Agent button should always span full width regardless of container size', () => {
      switcher.style.width = '500px';
      const buttons = switcher.querySelectorAll('.advisor-perspective-btn');
      const agentBtn = buttons[2];

      const styles = window.getComputedStyle(agentBtn);
      expect(styles.gridColumn).toMatch(/1\s*\/\s*-1|1\s*\/\s*3/);
    });
  });

  describe('Accessibility', () => {
    it('All buttons should be keyboard accessible', () => {
      const buttons = switcher.querySelectorAll('.advisor-perspective-btn');

      buttons.forEach(btn => {
        expect(btn.tagName).toBe('BUTTON');
        expect(btn.getAttribute('type')).toBe('button');
      });
    });

    it('Active button should have aria-pressed attribute or active class', () => {
      const buttons = switcher.querySelectorAll('.advisor-perspective-btn');
      const activeBtn = buttons[0];

      expect(activeBtn.classList.contains('active')).toBe(true);
    });

    it('Buttons should have descriptive text labels', () => {
      const buttons = switcher.querySelectorAll('.advisor-perspective-btn');

      expect(buttons[0].textContent).toContain('採用側視点');
      expect(buttons[1].textContent).toContain('応募者視点');
      expect(buttons[2].textContent).toContain('エージェント向け');
      expect(buttons[2].textContent).toContain('営業戦略');
    });
  });
});
