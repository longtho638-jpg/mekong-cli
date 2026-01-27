import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dashboard } from './Dashboard';
import { jobService } from '../services/api';

// Mock the jobService
vi.mock('../services/api', () => ({
  jobService: {
    getStats: vi.fn(),
    clearFailedJobs: vi.fn(),
    listJobs: vi.fn().mockResolvedValue([]),
    listScheduledJobs: vi.fn().mockResolvedValue([]),
    enqueueJob: vi.fn(),
    scheduleJob: vi.fn(),
    unscheduleJob: vi.fn(),
    retryJob: vi.fn(),
  }
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders dashboard title', async () => {
    (jobService.getStats as any).mockResolvedValue({
      pending: 0,
      processing: 0,
      failed: 0,
      total_jobs: 0
    });

    // Wrapped in async act not strictly needed for initial render but good practice if state updates happen immediately
    render(<Dashboard />);

    expect(screen.getByText('Background Jobs Dashboard')).toBeInTheDocument();
  });

  it('fetches and displays stats', async () => {
    (jobService.getStats as any).mockResolvedValue({
      pending: 5,
      processing: 2,
      failed: 1,
      total_jobs: 8
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // Pending
    });

    expect(screen.getByText('2')).toBeInTheDocument(); // Processing
    expect(screen.getByText('1')).toBeInTheDocument(); // Failed
    expect(screen.getByText('8')).toBeInTheDocument(); // Total
  });
});
