import { v7 as uuidv7 } from 'uuid';

/** UUIDv7 everywhere (CLAUDE.md §5.3): time-ordered and index-friendly. */
export function newId(): string {
  return uuidv7();
}
