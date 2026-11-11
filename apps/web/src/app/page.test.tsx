import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HomePage from './page';

describe('HomePage', () => {
  it('renders the product promise', () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain('verified community for financial-services professionals');
    expect(html).toContain('<h1');
  });
});
