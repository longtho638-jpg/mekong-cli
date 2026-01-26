import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from './SearchBar';

test('renders search input', () => {
  render(<SearchBar onSearch={() => {}} />);
  const inputElement = screen.getByPlaceholderText(/Search documentation/i);
  expect(inputElement).toBeInTheDocument();
});

test('calls onSearch when form is submitted', () => {
  const handleSearch = jest.fn();
  render(<SearchBar onSearch={handleSearch} />);
  const inputElement = screen.getByPlaceholderText(/Search documentation/i);

  fireEvent.change(inputElement, { target: { value: 'test query' } });
  fireEvent.submit(inputElement);

  expect(handleSearch).toHaveBeenCalledWith('test query');
});
