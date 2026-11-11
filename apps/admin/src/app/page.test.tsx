import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AdminHomePage from './page';

describe('AdminHomePage', () => {
  it('renders the admin heading', () => {
    expect(renderToStaticMarkup(<AdminHomePage />)).toContain('Admin</h1>');
  });
});
