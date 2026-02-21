import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useToast from './useToast';

describe('useToast Hook', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toast).toEqual({
      show: false,
      message: '',
      variant: 'info',
    });
  });

  it('shows toast with message', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Test message');
    });

    expect(result.current.toast).toEqual({
      show: true,
      message: 'Test message',
      variant: 'info',
    });
  });

  it('shows toast with custom variant', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Success message', 'success');
    });

    expect(result.current.toast).toEqual({
      show: true,
      message: 'Success message',
      variant: 'success',
    });
  });

  it('hides toast when hideToast is called', () => {
    const { result } = renderHook(() => useToast());

    // First show the toast
    act(() => {
      result.current.showToast('Test message', 'danger');
    });

    expect(result.current.toast.show).toBe(true);

    // Then hide it
    act(() => {
      result.current.hideToast();
    });

    expect(result.current.toast.show).toBe(false);
    // Message and variant should still be there
    expect(result.current.toast.message).toBe('Test message');
    expect(result.current.toast.variant).toBe('danger');
  });

  it('updates toast message when showToast is called multiple times', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('First message', 'info');
    });

    expect(result.current.toast.message).toBe('First message');

    act(() => {
      result.current.showToast('Second message', 'warning');
    });

    expect(result.current.toast).toEqual({
      show: true,
      message: 'Second message',
      variant: 'warning',
    });
  });

  it('maintains stable function references', () => {
    const { result, rerender } = renderHook(() => useToast());

    const firstShowToast = result.current.showToast;
    const firstHideToast = result.current.hideToast;

    rerender();

    // Functions should maintain the same reference (useCallback)
    expect(result.current.showToast).toBe(firstShowToast);
    expect(result.current.hideToast).toBe(firstHideToast);
  });
});
