import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { STORAGE_KEY } from './state/store';

beforeEach(() => {
  window.location.hash = '#/';
});

describe('App', () => {
  it('opens on Today with the featured puzzle and progress', () => {
    render(<App />);
    expect(screen.getByText('Featured', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /0 of 4 puzzles completed/ })).toBeInTheDocument();
  });

  it('saves settings on the device and applies them to the page', async () => {
    window.location.hash = '#/settings';
    render(<App />);
    await userEvent.click(screen.getByRole('radio', { name: 'Larger' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(document.documentElement.dataset.textSize).toBe('larger');
    expect(document.documentElement.dataset.theme).toBe('dark');
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.settings).toMatchObject({ textSize: 'larger', appearance: 'dark' });
  });

  it('asks before resetting data', async () => {
    window.location.hash = '#/settings';
    render(<App />);
    await userEvent.click(screen.getByRole('radio', { name: 'Large' }));
    await userEvent.click(screen.getByRole('button', { name: /Reset all data/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Keep my data' }));
    expect(document.documentElement.dataset.textSize).toBe('large');
    await userEvent.click(screen.getByRole('button', { name: /Reset all data/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(document.documentElement.dataset.textSize).toBe('standard');
    expect(screen.getByRole('status')).toHaveTextContent('reset');
  });
});
