import { WAITLIST_POLICY_VERSION } from '@circle/contracts';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HomePage from './page';
import PrivacyPage from './privacy/page';

describe('HomePage', () => {
  const html = renderToStaticMarkup(<HomePage />);

  it('states the product promise and renders the waitlist form', () => {
    expect(html).toContain('A private circle for people in Lagos finance.');
    expect(html).toContain('name="email"');
    expect(html).toContain('href="/privacy"');
  });

  // CLAUDE.md §1.1 rules 8 and 9 apply to marketing copy too.
  it('carries the non-affiliation disclaimer', () => {
    expect(html).toContain('not affiliated with, sponsored or endorsed by any bank');
  });

  it('makes no end-to-end encryption claim', () => {
    expect(html.toLowerCase()).not.toMatch(/end-to-end|e2ee/);
  });

  it('does not offer sensitive relationship intentions as interests', () => {
    expect(html).not.toMatch(/SERIOUS_RELATIONSHIP|MARRIAGE_MINDED/);
  });
});

describe('PrivacyPage', () => {
  it('shows the policy version that signups record', () => {
    expect(renderToStaticMarkup(<PrivacyPage />)).toContain(`Version ${WAITLIST_POLICY_VERSION}`);
  });
});
