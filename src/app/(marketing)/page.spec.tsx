import { render, screen } from '@testing-library/react';

import MarketingHomePage from './page';

describe('Marketing home page', () => {
  it('renders the main landmark with the hero headline', () => {
    render(<MarketingHomePage />);

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /write faster, think clearer/i,
      })
    ).toBeInTheDocument();
  });

  it('links the hero CTA to registration', () => {
    render(<MarketingHomePage />);

    expect(
      screen.getByRole('link', { name: 'Try Drafty free' })
    ).toHaveAttribute('href', '/register');
  });

  it('links both pricing plans to registration', () => {
    render(<MarketingHomePage />);

    expect(screen.getByRole('link', { name: 'Start free' })).toHaveAttribute(
      'href',
      '/register'
    );
    expect(screen.getByRole('link', { name: 'Go Pro' })).toHaveAttribute(
      'href',
      '/register'
    );
  });

  it('renders every FAQ question', () => {
    render(<MarketingHomePage />);

    const questions = [
      'What is Drafty?',
      'What does the Free plan include?',
      'How does billing work?',
      'Is my work saved automatically?',
      'Can I cancel anytime?',
    ];

    for (const question of questions) {
      expect(screen.getByText(question)).toBeInTheDocument();
    }
  });
});
