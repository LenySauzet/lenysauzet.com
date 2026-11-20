'use client';

import type { ComponentProps } from 'react';

import { useBooking } from '@/hooks/use-booking';

export function BookingButton({ onClick, ...props }: ComponentProps<'button'>) {
  const book = useBooking();

  return (
    <button
      type="button"
      {...props}
      onClick={(event) => {
        onClick?.(event);
        book();
      }}
    />
  );
}
