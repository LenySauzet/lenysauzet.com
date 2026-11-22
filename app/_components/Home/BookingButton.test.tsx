import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Tooltip, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { openBooking } from '@/lib/services/booking';
import { InEnglish } from '@/test/intl';

import { BookingButton } from './BookingButton';

vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'dark' }) }));
vi.mock('@/lib/services/booking', () => ({ openBooking: vi.fn() }));

describe('BookingButton', () => {
  it('opens the booking even as a tooltip trigger, which merges its own click in', async () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <BookingButton>Your company next?</BookingButton>
          </TooltipTrigger>
        </Tooltip>
      </TooltipProvider>,
      { wrapper: InEnglish }
    );

    await userEvent.click(screen.getByRole('button', { name: 'Your company next?' }));

    expect(openBooking).toHaveBeenCalledWith('dark', 'Booking is unreachable');
  });
});
