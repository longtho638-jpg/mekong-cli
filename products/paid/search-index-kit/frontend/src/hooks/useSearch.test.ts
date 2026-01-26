import { renderHook, act } from '@testing-library/react-hooks';
import { useSearch } from './useSearch';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      results: [],
      total: 0,
      page: 1,
      page_size: 10
    }),
  })
) as jest.Mock;

test('useSearch initial state', () => {
  const { result } = renderHook(() => useSearch());

  expect(result.current.query).toBe('');
  expect(result.current.results).toBeNull();
  expect(result.current.loading).toBe(false);
});

test('useSearch updates query', () => {
  const { result } = renderHook(() => useSearch());

  act(() => {
    result.current.setQuery('new query');
  });

  expect(result.current.query).toBe('new query');
});
