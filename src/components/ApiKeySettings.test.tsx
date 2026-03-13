import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApiKeySettings } from './ApiKeySettings';

const STORAGE_KEY = 'deepgram_api_key';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('ApiKeySettings', () => {
  it('renders the settings modal', () => {
    render(<ApiKeySettings onClose={vi.fn()} />);
    expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows Web Speech API status when no key is saved', () => {
    render(<ApiKeySettings onClose={vi.fn()} />);
    expect(screen.getByText(/Web Speech API/)).toBeInTheDocument();
  });

  it('shows Deepgram active status when key is saved', () => {
    localStorage.setItem(STORAGE_KEY, 'test-api-key-1234');
    render(<ApiKeySettings onClose={vi.fn()} />);
    expect(screen.getByText(/Deepgram Nova-3 active/)).toBeInTheDocument();
  });

  it('masks the saved key showing only last 4 chars', () => {
    localStorage.setItem(STORAGE_KEY, 'abcdefgh5678');
    render(<ApiKeySettings onClose={vi.fn()} />);
    expect(screen.getByText('••••••••5678')).toBeInTheDocument();
  });

  it('saves key to localStorage on Save click', () => {
    render(<ApiKeySettings onClose={vi.fn()} />);
    fireEvent.change(screen.getByTestId('deepgram-key-input'), {
      target: { value: 'my-new-key' },
    });
    fireEvent.click(screen.getByTestId('save-key-button'));
    expect(localStorage.getItem(STORAGE_KEY)).toBe('my-new-key');
  });

  it('shows Deepgram active after saving a key', () => {
    render(<ApiKeySettings onClose={vi.fn()} />);
    fireEvent.change(screen.getByTestId('deepgram-key-input'), {
      target: { value: 'my-new-key' },
    });
    fireEvent.click(screen.getByTestId('save-key-button'));
    expect(screen.getByText(/Deepgram Nova-3 active/)).toBeInTheDocument();
  });

  it('clears input after saving', () => {
    render(<ApiKeySettings onClose={vi.fn()} />);
    fireEvent.change(screen.getByTestId('deepgram-key-input'), {
      target: { value: 'my-new-key' },
    });
    fireEvent.click(screen.getByTestId('save-key-button'));
    expect(screen.getByTestId('deepgram-key-input')).toHaveValue('');
  });

  it('saves key on Enter key press', () => {
    render(<ApiKeySettings onClose={vi.fn()} />);
    fireEvent.change(screen.getByTestId('deepgram-key-input'), {
      target: { value: 'enter-key' },
    });
    fireEvent.keyDown(screen.getByTestId('deepgram-key-input'), { key: 'Enter' });
    expect(localStorage.getItem(STORAGE_KEY)).toBe('enter-key');
  });

  it('does not save empty or whitespace-only input', () => {
    render(<ApiKeySettings onClose={vi.fn()} />);
    fireEvent.change(screen.getByTestId('deepgram-key-input'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByTestId('save-key-button'));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('removes key from localStorage on Remove click', () => {
    localStorage.setItem(STORAGE_KEY, 'existing-key');
    render(<ApiKeySettings onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('clear-key-button'));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('shows Web Speech API status after removing key', () => {
    localStorage.setItem(STORAGE_KEY, 'existing-key');
    render(<ApiKeySettings onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('clear-key-button'));
    expect(screen.getByText(/Web Speech API/)).toBeInTheDocument();
  });

  it('does not show Remove button when no key is saved', () => {
    render(<ApiKeySettings onClose={vi.fn()} />);
    expect(screen.queryByTestId('clear-key-button')).not.toBeInTheDocument();
  });

  it('calls onClose when × is clicked', () => {
    const onClose = vi.fn();
    render(<ApiKeySettings onClose={onClose} />);
    fireEvent.click(screen.getByTestId('settings-close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('save button is disabled when input is empty', () => {
    render(<ApiKeySettings onClose={vi.fn()} />);
    expect(screen.getByTestId('save-key-button')).toBeDisabled();
  });

  it('save button is enabled when input has text', () => {
    render(<ApiKeySettings onClose={vi.fn()} />);
    fireEvent.change(screen.getByTestId('deepgram-key-input'), {
      target: { value: 'some-key' },
    });
    expect(screen.getByTestId('save-key-button')).not.toBeDisabled();
  });
});
