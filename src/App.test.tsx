import React from 'react';
import { render, screen } from '@testing-library/react';
import ColumnChooserDemo from './App';

test('renders learn react link', () => {
  render(<ColumnChooserDemo />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
