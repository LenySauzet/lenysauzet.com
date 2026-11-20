export const FINE_POINTER = '(pointer: fine)';

export const hasFinePointer = () => window.matchMedia(FINE_POINTER).matches;
