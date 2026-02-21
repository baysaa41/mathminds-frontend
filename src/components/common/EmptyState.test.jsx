import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState from './EmptyState';
import { Inbox } from 'lucide-react';

describe('EmptyState Component', () => {
  it('renders with default props', () => {
    render(<EmptyState />);

    expect(screen.getByText('Хоосон байна')).toBeInTheDocument();
    expect(screen.getByText('Одоогоор мэдээлэл байхгүй байна.')).toBeInTheDocument();
  });

  it('renders with custom title and message', () => {
    render(<EmptyState title="No items found" message="Try adding a new item" />);

    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('Try adding a new item')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const onAction = vi.fn();

    render(<EmptyState actionLabel="Add Item" onAction={onAction} />);

    const button = screen.getByRole('button', { name: /Add Item/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onAction when button is clicked', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(<EmptyState actionLabel="Add Item" onAction={onAction} />);

    const button = screen.getByRole('button', { name: /Add Item/i });
    await user.click(button);

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('does not render button when actionLabel is missing', () => {
    const onAction = vi.fn();

    render(<EmptyState onAction={onAction} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not render button when onAction is missing', () => {
    render(<EmptyState actionLabel="Add Item" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies custom variant class', () => {
    const { container } = render(<EmptyState variant="secondary" />);

    const card = container.querySelector('.bg-secondary');
    expect(card).toBeInTheDocument();
  });
});
