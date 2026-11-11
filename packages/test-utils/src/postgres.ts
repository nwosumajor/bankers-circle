import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

export type { StartedPostgreSqlContainer };

/** Keep in step with docker-compose.yml and the Supabase major version. */
export const POSTGRES_IMAGE = 'postgres:17-alpine';

/** Starts a throwaway PostgreSQL for integration tests. Caller must `stop()` it. */
export function startPostgres(): Promise<StartedPostgreSqlContainer> {
  return new PostgreSqlContainer(POSTGRES_IMAGE).start();
}
