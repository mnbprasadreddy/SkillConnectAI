import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InterviewSetup from '../pages/InterviewSetup';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ search: '?type=technical' }),
  };
});

describe('InterviewSetup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders role selections for technical interview', () => {
    render(
      <BrowserRouter>
        <InterviewSetup />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Target Discipline/i)).toBeInTheDocument();
    expect(screen.getByText(/Frontend/i)).toBeInTheDocument();
    expect(screen.getByText(/Backend/i)).toBeInTheDocument();
  });

  it('allows selecting a role and changes button state', () => {
    render(
      <BrowserRouter>
        <InterviewSetup />
      </BrowserRouter>
    );
    
    const frontendButton = screen.getByText(/Frontend/i).closest('button');
    const startButton = screen.getByText(/Launch Protocol/i).closest('button');

    // Initially disabled if no role selected (for technical)
    expect(startButton).toBeDisabled();

    fireEvent.click(frontendButton);
    
    expect(startButton).not.toBeDisabled();
  });

  it('allows changing difficulty and duration', () => {
    render(
      <BrowserRouter>
        <InterviewSetup />
      </BrowserRouter>
    );
    
    const advancedButton = screen.getByText('Advanced').closest('button');
    const fortyFiveMinButton = screen.getByText('45m').closest('button');

    fireEvent.click(advancedButton);
    fireEvent.click(fortyFiveMinButton);

    // Verify visual change via class or state (harder to test classes accurately with Tailwind but we can check if they are "selected")
    expect(advancedButton).toHaveClass('border-secondary'); // Based on current code
  });
});
