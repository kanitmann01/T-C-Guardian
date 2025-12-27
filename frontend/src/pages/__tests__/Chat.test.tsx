import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Chat from '../Chat';

// Mock dependencies used inside Chat
vi.mock('../../services/api', () => ({
  chatWithContract: vi.fn(),
}));

vi.mock('../../components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('../../components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
}));

vi.mock('../../components/common/BackButton', () => ({
  BackButton: ({ onClick, label }: any) => <button onClick={onClick}>{label}</button>,
}));

// Helper to get mocked chatWithContract
const { chatWithContract } = await import('../../services/api');

describe('Chat page', () => {
  const onBack = vi.fn();
  const contextText = 'This is the full contract text';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no contextText', () => {
    render(<Chat onBack={onBack} />);
    expect(screen.getByText('No Contract Loaded')).toBeInTheDocument();
    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('disables send when input is empty or whitespace', () => {
    render(<Chat onBack={onBack} contextText={contextText} />);
    const sendBtn = screen.getByRole('button', { name: '' });
    expect(sendBtn).toBeDisabled();
    const input = screen.getByPlaceholderText('Ask about data rights, fees, cancellation...');
    fireEvent.change(input, { target: { value: '   ' } });
    expect(sendBtn).toBeDisabled();
  });

  it('sends user message and appends model response on success', async () => {
    (chatWithContract as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ answer: 'Model answer' });

    render(<Chat onBack={onBack} contextText={contextText} />);

    // Type and send
    const input = screen.getByPlaceholderText('Ask about data rights, fees, cancellation...');
    fireEvent.change(input, { target: { value: 'What about cancellation?' } });

    // Click send
    const sendBtn = screen.getByRole('button', { name: '' });
    expect(sendBtn).not.toBeDisabled();
    fireEvent.click(sendBtn);

    // User message should render
    expect(screen.getByText('What about cancellation?')).toBeInTheDocument();

    // Wait for model response
    await waitFor(() => {
      expect(screen.getByText('Model answer')).toBeInTheDocument();
    });

    // Ensure chatWithContract called with correct args
    expect(chatWithContract).toHaveBeenCalledTimes(1);
    const [, , passedContext] = (chatWithContract as any).mock.calls[0];
    expect(passedContext).toBe(contextText);
  });

  it('shows error message on API error', async () => {
    (chatWithContract as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network'));

    render(<Chat onBack={onBack} contextText={contextText} />);

    const input = screen.getByPlaceholderText('Ask about data rights, fees, cancellation...');
    fireEvent.change(input, { target: { value: 'Tell me about fees' } });

    const sendBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('Sorry, I encountered an error checking the contract.')).toBeInTheDocument();
    });
  });

  it('allows sending with Enter key', async () => {
    (chatWithContract as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ answer: 'Done' });

    render(<Chat onBack={onBack} contextText={contextText} />);
    const input = screen.getByPlaceholderText('Ask about data rights, fees, cancellation...');

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Done')).toBeInTheDocument();
    });
  });

  it('shows loading indicator while waiting for response', async () => {
    let resolveFn: (value: any) => void;
    (chatWithContract as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise((resolve) => { resolveFn = resolve; })
    );

    render(<Chat onBack={onBack} contextText={contextText} />);

    const input = screen.getByPlaceholderText('Ask about data rights, fees, cancellation...');
    fireEvent.change(input, { target: { value: 'Check data rights' } });

    const sendBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(sendBtn);

    // loading bubbles visible
    expect(screen.getByTestId('card')).toBeInTheDocument();

    // Now resolve and ensure loading finishes
    resolveFn!({ answer: 'Answer' });
    await waitFor(() => {
      expect(screen.getByText('Answer')).toBeInTheDocument();
    });
  });
});
