# Convex Rules

## Validators

- Every function (`query`, `mutation`, `action`, `internalQuery`, `internalMutation`, `internalAction`) **must** have both `args:` and `returns:` validators.
- Use `returns: v.null()` when a function returns nothing.
- Use `v.int64()` for 64-bit integers — `v.bigint()` is deprecated.
- Use `v.record()` for dynamic-key objects — `v.map()` and `v.set()` are not supported.

## Function visibility

- Use `internalQuery`, `internalMutation`, `internalAction` for private functions. These are only callable by other Convex functions.
- Use `query`, `mutation`, `action` only for public API functions. **They are exposed to the internet.**

## Queries

- Never use `.filter()` — define an index in `schema.ts` and use `.withIndex()` instead.
- No `.delete()` on query results — `.collect()` first, then call `ctx.db.delete(row._id)` in a loop.
- Use `.unique()` to assert a single result; it throws if multiple documents match.

## Actions

- Add `"use node";` at the top of any file where actions use Node.js built-in modules.
- Never use `ctx.db` inside actions — use `ctx.runQuery` / `ctx.runMutation` instead.
- Minimize calls from actions to queries/mutations — each call is a separate transaction and introduces race condition risk.

## TypeScript

- When calling a function in the **same file** via `ctx.runQuery` / `ctx.runMutation`, add a type annotation on the return value to avoid TypeScript circularity errors:
  ```ts
  const result: string = await ctx.runQuery(api.example.f, { name: 'Bob' })
  ```

## Schema

- Index names must include all indexed fields: `by_field1_and_field2`, not `by_field1`.
- Fields must be queryable in the order they are defined in the index.

## Crons

- Only use `crons.interval` or `crons.cron` — not `crons.hourly`, `crons.daily`, or `crons.weekly`.
- Always import `internal` from `_generated/api` when a cron calls an internal function, even if defined in the same file.

## File storage

- Do not use `ctx.storage.getMetadata()` — it is deprecated. Query the `_storage` system table via `ctx.db.system.get` instead.
- Storage items are `Blob` objects — convert to/from `Blob` when reading or writing.
