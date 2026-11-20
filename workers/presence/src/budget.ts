export class Budget {
  private tokens: number;
  private refilledAt: number;

  constructor(
    private readonly capacity: number,
    private readonly perSecond: number,
    now: number
  ) {
    this.tokens = capacity;
    this.refilledAt = now;
  }

  spend(now: number) {
    this.tokens = Math.min(this.capacity, this.tokens + ((now - this.refilledAt) / 1000) * this.perSecond);
    this.refilledAt = now;
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}
