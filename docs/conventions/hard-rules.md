# Conventions: hard rules

The one-line rule is in `CLAUDE.md`; this is what breaking it looked like.

## conventions-rule-1: `.ts` extensions in `src/lib`, never in `src/app`

`node --test` runs the tests with no build step, and Node resolves the whole
import chain, not just the entry, so a module under `src/lib` that a test
reaches needs the `.ts` extension on its own relative imports too; the first
value shared across a tested module made the extension travel up the chain
(#3). Under `src/app` it compiles and then breaks at `next build`. `next build`
and the Docker build both handle the `src/lib` spelling.

## conventions-rule-2: One spelling for `src/lib` imports

`src/lib` was spelling its own relative imports both ways in the same folder
(#4). Two spellings in one folder drift, and the next person copies whichever
file they opened first.

## conventions-rule-3: No semicolons

The choice lived nowhere, so every new file was a coin flip and the same review
note kept coming back (#1). Nothing enforces it yet; add Prettier with
`"semi": false` when the repo gets a CI job to hang it on.
