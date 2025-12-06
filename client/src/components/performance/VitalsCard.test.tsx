import { render, screen } from '@testing-library/react';
import { VitalsCard } from './VitalsCard';
import { Metric } from '../../store/performanceStore';
import { describe, it, expect } from 'vitest';

describe('VitalsCard', () => {
  it('renders metric name and value', () => {
    const metric: Metric = {
      name: 'LCP',
      value: 2500.5,
      rating: 'good',
      delta: 0,
      id: '1',
    };

    render(<VitalsCard metric={metric} description="Test Description" />);

    expect(screen.getByText('LCP')).toBeInTheDocument();
    expect(screen.getByText('2501 ms')).toBeInTheDocument(); // Math.round
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('good')).toBeInTheDocument();
  });

  it('applies correct styling for poor rating', () => {
    const metric: Metric = {
      name: 'CLS',
      value: 0.5,
      rating: 'poor',
      delta: 0,
      id: '2',
    };

    render(<VitalsCard metric={metric} description="Test" />);
    screen.getByText('1 ms'); // 0.5 rounds to 1? verify mock
    // We can check if the badge has the red class roughly, or just that it renders.
    // Testing specific classes is brittle but verified per AC "Color Coding".
    const badge = screen.getByText('poor');
    expect(badge).toHaveClass('bg-red-500');
  });
});
