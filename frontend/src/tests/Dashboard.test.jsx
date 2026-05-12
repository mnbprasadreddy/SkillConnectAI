import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../pages/Dashboard';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { vi } from 'vitest';

// Mock the hooks and services
vi.mock('../context/AuthContext');
vi.mock('../services/api');

// Mock recharts to avoid ResponsiveContainer issues in JSDOM
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }) => <div>{children}</div>,
  };
});

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock user context
    useAuth.mockReturnValue({
      user: { displayName: 'Naga' }
    });

    // Mock API responses
    api.get.mockImplementation((url) => {
      if (url === '/analytics/dashboard') {
        return Promise.resolve({ data: { stats: { problemsSolved: 42, accuracy: 85, completedInterviews: 3 } } });
      }
      if (url === '/recommendations') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/analytics/coding') {
        return Promise.resolve({ data: { submissionTrend: [] } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('renders dashboard with user greeting', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Welcome back,/i)).toBeInTheDocument();
      expect(screen.getByText(/Naga/i)).toBeInTheDocument();
    });
  });

  it('displays statistic cards with correct values', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Problems Solved')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });
});
