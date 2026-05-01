import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

const mockLogin = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

import LoginPage from '../page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn(() => null) }),
}));

describe('minimal test', () => {
  test('renders', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });
});
