import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { URLInput, URLInputProps } from './URLInput';
import { OptimizationRequest } from '@/application/dto/OptimizationRequest.dto';

describe('URLInput', () => {
  const defaultProps: URLInputProps = {
    onSubmit: jest.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders with basic props', () => {
      render(<URLInput {...defaultProps} />);
      
      expect(screen.getByLabelText('Airbnb Listing URL')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('https://www.airbnb.com/rooms/12345678')).toBeInTheDocument();
      expect(screen.getByText('Optimize Images')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(<URLInput {...defaultProps} placeholder="Custom placeholder" />);
      
      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <URLInput {...defaultProps} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders with advanced options when enabled', () => {
      render(<URLInput {...defaultProps} showAdvancedOptions={true} />);
      
      expect(screen.getByText('Advanced Options')).toBeInTheDocument();
    });

    it('shows help text', () => {
      render(<URLInput {...defaultProps} />);
      
      expect(screen.getByText('How it works')).toBeInTheDocument();
      expect(screen.getByText(/Enter any Airbnb listing URL/)).toBeInTheDocument();
    });
  });

  describe('URL Validation', () => {
    it('validates empty URL', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<URLInput {...defaultProps} />);
      
      const input = screen.getByLabelText('Airbnb Listing URL');
      const submitButton = screen.getByText('Optimize Images');
      
      await user.click(submitButton);
      
      expect(screen.getByText('Please enter a URL')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('validates invalid URL format', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<URLInput {...defaultProps} />);
      
      const input = screen.getByLabelText('Airbnb Listing URL');
      
      await user.type(input, 'not-a-url');
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid URL format')).toBeInTheDocument();
      });
    });

    it('validates non-Airbnb URL', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<URLInput {...defaultProps} />);
      
      const input = screen.getByLabelText('Airbnb Listing URL');
      
      await user.type(input, 'https://example.com/rooms/123');
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid Airbnb listing URL/)).toBeInTheDocument();
      });
    });

    it('validates Airbnb URL without listing path', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<URLInput {...defaultProps} />);
      
      const input = screen.getByLabelText('Airbnb Listing URL');
      
      await user.type(input, 'https://www.airbnb.com/');
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/should contain \/rooms\/ or \/listings\//)).toBeInTheDocument();
      });
    });

    it('validates valid Airbnb URL', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<URLInput {...defaultProps} />);
      
      const input = screen.getByLabelText('Airbnb Listing URL');
      
      await user.type(input, 'https://www.airbnb.com/rooms/12345678');
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Valid Airbnb listing URL')).toBeInTheDocument();
      });
    });

    it('validates different Airbnb domains', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<URLInput {...defaultProps} />);
      
      const input = screen.getByLabelText('Airbnb Listing URL');
      
      // Test different valid domains
      const validUrls = [
        'https://www.airbnb.co.uk/rooms/12345678',
        'https://www.airbnb.ca/rooms/12345678',
        'https://www.airbnb.com.au/rooms/12345678',
        'https://www.airbnb.fr/rooms/12345678',
        'https://www.airbnb.de/rooms/12345678',
      ];

      for (const url of validUrls) {
        await user.clear(input);
        await user.type(input, url);
        act(() => {
          jest.advanceTimersByTime(300);
        });
        
        await waitFor(() => {
          expect(screen.getByText('Valid Airbnb listing URL')).toBeInTheDocument();
        });
      }
    });

    it('validates listings path', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<URLInput {...defaultProps} />);
      
      const input = screen.getByLabelText('Airbnb Listing URL');
      
      await user.type(input, 'https://www.airbnb.com/listings/12345678');
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Valid Airbnb listing URL')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits valid form', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const onSubmit = jest.fn();
      render(<URLInput {...defaultProps} onSubmit={onSubmit} />);
      
      const input = screen.getByLabelText('Airbnb Listing URL');
      const submitButton = screen.getByText('Optimize Images');
      
      await user.type(input, 'https://www.airbnb.com/rooms/12345678');
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
      
      await user.click(submitButton);
      
      expect(onSubmit).toHaveBeenCalledWith({
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        maxImages: 10,
      });
    });

    it('submits with custom maxImages', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const onSubmit = jest.fn();
      render(
        <URLInput 
          {...defaultProps} 
          onSubmit={onSubmit}
          showAdvancedOptions={true}
          maxImages={5}
        />
      );
      
      const input = screen.getByLabelText('Airbnb Listing URL');
      
      await user.type(input, 'https://www.airbnb.com/rooms/12345678');
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Valid Airbnb listing URL')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Optimize Images'));
      
      expect(onSubmit).toHaveBeenCalledWith({
        airbnbUrl: 'https://www.airbnb.com/rooms/12345678',
        maxImages: 5,
      });
    });

    it('submits on Enter key press', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const onSubmit = jest.fn();
      render(<URLInput {...defaultProps} onSubmit={onSubmit} />);
      
      const input = screen.getByLabelText('Airbnb Listing URL');
      
      await user.type(input, 'https://www.airbnb.com/rooms/12345678');
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Valid Airbnb listing URL')).toBeInTheDocument();
      });
      
      await user.type(input, '{enter}');
      
      expect(onSubmit).toHaveBeenCalled();
    });

    it('does not submit on Shift+Enter', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const onSubmit = jest.fn();
      render(<URLInput {...defaultProps} onSubmit={onSubmit} />);
      
      const input = screen.getByLabelText('Airbnb Listing URL');
      
      await user.type(input, 'https://www.airbnb.com/rooms/12345678{shift>}{enter}{/shift}');
      
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('shows loading state when isLoading is true', () => {
      render(<URLInput {...defaultProps} isLoading={true} />);
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByLabelText('Airbnb Listing URL')).toBeDisabled();
      expect(screen.getByText('Optimize Images')).toBeDisabled();
    });

    it('shows loading spinner in button', () => {
      render(<URLInput {...defaultProps} isLoading={true} />);
      
      const spinner = screen.getByRole('button').querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('shows external error message', () => {
      render(<URLInput {...defaultProps} error="External error message" />);
      
      expect(screen.getByText('External error message')).toBeInTheDocument();
    });

    it('prioritizes validation error over external error', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<URLInput {...defaultProps} error="External error" />);
      
      const input = screen.getByLabelText('Airbnb Listing URL');
      
      await user.type(input, 'invalid-url');
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid URL format')).toBeInTheDocument();
        expect(screen.queryByText('External error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Paste Detection', () => {
    it('shows paste indicator when pasting', async () => {
      const user = userEvent.setup();
      render(<URLInput {...defaultProps} />);
      
      const input = screen.getByLabelText('Airbnb Listing URL');
      
      await user.click(input);
      await user.paste('https://www.airbnb.com/rooms/12345678');
      
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('clears paste indicator after timeout', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<URLInput {...defaultProps} />);
      
      const input = screen.getByLabelText('Airbnb Listing URL');
      
      await user.click(input);
      await user.paste('https://www.airbnb.com/rooms/12345678');
      
      expect(screen.getByText('✓')).toBeInTheDocument();
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('✓')).not.toBeInTheDocument();
      });
    });
  });

  describe('Clear Input', () => {
    it('shows clear button when input has value', async () => {
      const user = userEvent.setup();
      render(<URLInput {...defaultProps} />);
      
      const input = screen.getByLabelText('Airbnb Listing URL');
      
      await user.type(input, 'https://www.airbnb.com/rooms/12345678');
      
      expect(screen.getByLabelText('Clear URL')).toBeInTheDocument();
    });

    it('clears input when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<URLInput {...defaultProps} />);
      
      const input = screen.getByLabelText('Airbnb Listing URL');
      
      await user.type(input, 'https://www.airbnb.com/rooms/12345678');
      await user.click(screen.getByLabelText('Clear URL'));
      
      expect(input).toHaveValue('');
      expect(screen.queryByLabelText('Clear URL')).not.toBeInTheDocument();
    });

    it('focuses input after clearing', async () => {
      const user = userEvent.setup();
      render(<URLInput {...defaultProps} />);
      
      const input = screen.getByLabelText('Airbnb Listing URL');
      
      await user.type(input, 'https://www.airbnb.com/rooms/12345678');
      await user.click(screen.getByLabelText('Clear URL'));
      
      expect(input).toHaveFocus();
    });
  });

  describe('Advanced Options', () => {
    it('toggles advanced options visibility', async () => {
      const user = userEvent.setup();
      render(<URLInput {...defaultProps} showAdvancedOptions={true} />);
      
      const toggleButton = screen.getByText('Advanced Options');
      
      // Initially collapsed
      expect(screen.queryByLabelText('Maximum Images to Process')).not.toBeInTheDocument();
      
      // Expand
      await user.click(toggleButton);
      expect(screen.getByLabelText('Maximum Images to Process')).toBeInTheDocument();
      
      // Collapse
      await user.click(toggleButton);
      expect(screen.queryByLabelText('Maximum Images to Process')).not.toBeInTheDocument();
    });

    it('updates maxImages with slider', async () => {
      const user = userEvent.setup();
      render(<URLInput {...defaultProps} showAdvancedOptions={true} />);
      
      const toggleButton = screen.getByText('Advanced Options');
      await user.click(toggleButton);
      
      const slider = screen.getByLabelText('Maximum Images to Process');
      const valueDisplay = screen.getByText('10');
      
      await user.type(slider, '{arrowleft}');
      expect(valueDisplay).toHaveTextContent('9');
      
      await user.type(slider, '{arrowright}');
      expect(valueDisplay).toHaveTextContent('10');
    });

    it('enforces maxImages limits', async () => {
      const user = userEvent.setup();
      render(<URLInput {...defaultProps} showAdvancedOptions={true} />);
      
      const toggleButton = screen.getByText('Advanced Options');
      await user.click(toggleButton);
      
      const slider = screen.getByLabelText('Maximum Images to Process');
      const valueDisplay = screen.getByText('10');
      
      // Try to go below minimum
      for (let i = 0; i < 15; i++) {
        await user.type(slider, '{arrowleft}');
      }
      expect(valueDisplay).toHaveTextContent('1');
      
      // Try to go above maximum
      for (let i = 0; i < 15; i++) {
        await user.type(slider, '{arrowright}');
      }
      expect(valueDisplay).toHaveTextContent('10');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<URLInput {...defaultProps} />);
      
      const input = screen.getByLabelText('Airbnb Listing URL');
      expect(input).toHaveAttribute('aria-describedby');
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(input).toHaveAttribute('autoComplete', 'url');
    });

    it('has proper form validation attributes', () => {
      render(<URLInput {...defaultProps} />);
      
      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('noValidate');
    });

    it('has proper error ARIA attributes', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<URLInput {...defaultProps} />);
      
      const input = screen.getByLabelText('Airbnb Listing URL');
      
      await user.type(input, 'invalid-url');
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-describedby', 'url-error');
        expect(screen.getByText('Please enter a valid URL format')).toHaveAttribute('role', 'alert');
      });
    });

    it('has proper button states', () => {
      render(<URLInput {...defaultProps} />);
      
      const submitButton = screen.getByText('Optimize Images');
      expect(submitButton).toHaveAttribute('aria-describedby');
    });
  });

  describe('Debounced Validation', () => {
    it('debounces validation input', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<URLInput {...defaultProps} />);
      
      const input = screen.getByLabelText('Airbnb Listing URL');
      
      // Type quickly
      await user.type(input, 'h');
      await user.type(input, 't');
      await user.type(input, 't');
      await user.type(input, 'p');
      
      // Should not show validation yet
      expect(screen.queryByText(/Please enter a valid URL format/)).not.toBeInTheDocument();
      
      // Advance timer
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid URL format')).toBeInTheDocument();
      });
    });

    it('cancels previous validation when typing', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<URLInput {...defaultProps} />);
      
      const input = screen.getByLabelText('Airbnb Listing URL');
      
      // Start typing invalid URL
      await user.type(input, 'invalid');
      act(() => {
        jest.advanceTimersByTime(200);
      });
      
      // Type valid URL before timeout
      await user.type(input, 'https://www.airbnb.com/rooms/12345678');
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Valid Airbnb listing URL')).toBeInTheDocument();
        expect(screen.queryByText('Please enter a valid URL format')).not.toBeInTheDocument();
      });
    });
  });
});
