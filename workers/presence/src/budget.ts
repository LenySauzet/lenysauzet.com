export class Budget {
  private tokens: number;
  private refused = 0;
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
    const earned = ((now - this.refilledAt) / 1000) * this.perSecond;
    this.refilledAt = now;
    this.tokens = Math.min(this.capacity, this.tokens + earned);
    this.refused = Math.max(0, this.refused - earned);
    if (this.tokens < 1) {
      this.refused += 1;
      return false;
    }
    this.tokens -= 1;
    return true;
  }

  get overdrawn() {
    return this.refused;
  }
}
