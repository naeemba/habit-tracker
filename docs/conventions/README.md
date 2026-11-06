# Conventions

Rules that hold for every feature: how code is spelled and how modules are
split. They own no files.

## Code

- TypeScript with no semicolons, in code and config files
  ([conventions-rule-3](hard-rules.md#conventions-rule-3-no-semicolons)).
- `allowImportingTsExtensions` is on so `node --test` can resolve `./dates.ts`.
  Every relative import inside `src/lib` carries the `.ts` extension; nothing
  under `src/app` does
  ([conventions-rule-1](hard-rules.md#conventions-rule-1-ts-extensions-in-srclib-never-in-srcapp),
  [conventions-rule-2](hard-rules.md#conventions-rule-2-one-spelling-for-srclib-imports)).
- One `pgTable` per file under `src/lib/schema`, named after the table.
- A decision with no database and no React goes in its own module beside a
  `*.test.ts` that `node --test` runs (`dates.ts`, `items.ts`, `today.ts`,
  `ledger.ts`); the reads and writes go in a `*-queries.ts` that owns one table.
- No secrets in committed files. Read from the environment, and name each
  variable in `.env.example`.

## Checks

    npm test               # node --test over src/**/*.test.ts
    npx tsc --noEmit
    npm run lint
    npm run build

There is no CI; pull requests say which of these were run locally.
