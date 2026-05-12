import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AICoachPopup from '../components/ai-coach/AICoachPopup';
import { sendMessage } from '../services/aiCoachService';
import { vi } from 'vitest';

// Mock the service
vi.mock('../services/aiCoachService');

describe('AICoachPopup Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders welcome message and input field', () => {
    render(<AICoachPopup onClose={mockOnClose} />);
    
    // There are multiple instances of AI Coach text (header and message)
    expect(screen.getAllByText(/AI Coach/i).length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/Ask me anything/i)).toBeInTheDocument();
  });

  it('closes when close button is clicked', () => {
    render(<AICoachPopup onClose={mockOnClose} />);
    
    // The close button is the one with the X icon in the header
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons[0]; 
    
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('sends a message and displays response', async () => {
    sendMessage.mockResolvedValue('This is a mock AI response.');
    
    render(<AICoachPopup onClose={mockOnClose} />);
    
    const input = screen.getByPlaceholderText(/Ask me anything/i);
    
    fireEvent.change(input, { target: { value: 'Hello AI' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(screen.getByText(/This is a mock AI response/i)).toBeInTheDocument();
    });
  });
});
