import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as authApi from '@/client-api/auth';
import { LoginForm } from '@/features/auth/components/login-form';

jest.mock('@/client-api/auth');

const push = jest.fn();
const refresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

const mockedAuthApi = jest.mocked(authApi);

describe('LoginForm', () => {
  it('shows field validation errors without calling the api', async () => {
    const user = userEvent.setup();
    render(<LoginForm redirectTo="/documents" />);

    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(mockedAuthApi.login).not.toHaveBeenCalled();
  });

  it('surfaces the server error on rejected credentials', async () => {
    mockedAuthApi.login.mockResolvedValue({
      success: false,
      error: 'Invalid credentials',
    });
    const user = userEvent.setup();
    render(<LoginForm redirectTo="/documents" />);

    await user.type(screen.getByLabelText('Email'), 'santi@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid credentials'
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('redirects to the sanitized target on success', async () => {
    mockedAuthApi.login.mockResolvedValue({
      success: true,
      user: {
        id: 'user-1',
        email: 'santi@example.com',
        createdAt: new Date().toISOString(),
      },
    });
    const user = userEvent.setup();
    render(<LoginForm redirectTo="/documents" />);

    await user.type(screen.getByLabelText('Email'), 'santi@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByRole('button')).toBeEnabled();
    expect(push).toHaveBeenCalledWith('/documents');
    expect(refresh).toHaveBeenCalled();
  });
});
