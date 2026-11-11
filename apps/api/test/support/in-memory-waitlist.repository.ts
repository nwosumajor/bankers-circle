import type { NewWaitlistSignup } from '../../src/modules/waitlist/waitlist.repository';

/** Mirrors WaitlistRepository semantics (first signup per case-insensitive email wins). */
export class InMemoryWaitlistRepository {
  readonly rows: NewWaitlistSignup[] = [];

  insertIfAbsent(signup: NewWaitlistSignup): Promise<boolean> {
    const exists = this.rows.some((r) => r.email.toLowerCase() === signup.email.toLowerCase());
    if (!exists) {
      this.rows.push(signup);
    }
    return Promise.resolve(!exists);
  }
}
