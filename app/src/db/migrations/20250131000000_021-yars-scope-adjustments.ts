/* eslint-disable max-len */
import stamps from '../stamps';

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return Promise.resolve().then(() =>
    // Create public schema tables
    knex.schema.createTable('draft_code', (table) => {
      table.text('draft_code').primary();
      stamps(knex, table);
    })
  );
}

export async function down(knex: Knex): Promise<void> {
  return Promise.resolve();
}
