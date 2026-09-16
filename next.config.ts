import { existsSync, readFileSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import type { NextConfig } from "next"

// The starter reaches its optional peers in ways static analysis cannot see:
// some through `import()` calls marked `turbopackIgnore`, others through a
// require of a variable string. Either way the standalone file tracer never
// learns they exist, so `docker compose up` starts fine and then every
// sign-in request dies with "Optional peer 'postgres' is not installed".
// Walking each peer's dependency tree and handing the result to the tracer
// puts the real files in the runtime image.
//
// `better-auth` is on this list even though the starter imports it statically:
// the bundler inlines it into the server chunk, but `@better-auth/passkey`
// loads it by name at runtime and needs it on disk as well.
//
// `@naeemba/next-starter` itself is here for the migrate CLI, which the
// container's entrypoint runs before the server. Nothing in app code imports
// `bin/cli.mjs` or `migrations/*.sql`, so without this the package is absent
// from the image and a fresh database can never get its tables.
//
// The upstream fix is for the starter to export these globs next to the code
// that hides the imports, so the list cannot drift. See docs/stack.md.
const runtimePeers = [
  "@naeemba/next-starter",
  "postgres",
  "better-auth",
  "@better-auth/passkey",
  "resend",
  "@react-email/components",
  "@react-email/render",
]

// Peers this app neither installs nor needs, so absent is a normal install.
// Not the same list as the starter's `peerDependenciesMeta`: that also marks
// `postgres` and `@better-auth/passkey` optional, and this app depends on both,
// so a missing one has to fail the build rather than be skipped. Do not add
// them here to "complete" the list.
const optionalPeers = new Set([
  "resend",
  "@react-email/components",
  "@react-email/render",
])

// Node's own lookup: nearest node_modules first, then up the tree. npm nests a
// package whenever two dependents need different versions, and the nested copy
// is the one its parent actually loads — `node_modules/<name>` alone would ship
// the hoisted version and leave the required one out of the image.
const projectRoot = process.cwd()

function resolvePackageDirectory(name: string, fromDirectory: string) {
  let directory = fromDirectory
  for (;;) {
    const candidate = join(directory, "node_modules", name)
    if (existsSync(join(candidate, "package.json"))) return candidate
    // Stop at the project root. A copy found above it — a stray install in a
    // parent directory or in $HOME — becomes a `./../..` glob that resolves
    // outside the tracing root and matches nothing, so the package would
    // silently not ship. Treating it as missing lets the throw below name it.
    const parent = dirname(directory)
    if (directory === projectRoot || parent === directory) return undefined
    directory = parent
  }
}

function dependencyClosure(roots: string[]): string[] {
  const found = new Set<string>()
  const visit = (name: string, fromDirectory: string) => {
    const packageDirectory = resolvePackageDirectory(name, fromDirectory)
    if (!packageDirectory) {
      // Silence only for peers that are meant to be missing. Anything else —
      // a typo in runtimePeers, a dependency that failed to install — is a
      // production 500 on the first sign-in, so fail the build instead.
      if (optionalPeers.has(name)) return
      throw new Error(
        `Cannot resolve "${name}" from ${fromDirectory} while tracing runtime peers.`,
      )
    }
    if (found.has(packageDirectory)) return
    found.add(packageDirectory)
    const manifest: { dependencies?: Record<string, string> } = JSON.parse(
      readFileSync(join(packageDirectory, "package.json"), "utf8"),
    )
    for (const dependency of Object.keys(manifest.dependencies ?? {})) {
      visit(dependency, packageDirectory)
    }
  }
  roots.forEach((name) => visit(name, projectRoot))
  return [...found].map(
    (directory) => `./${relative(projectRoot, directory)}/**/*`,
  )
}

const runtimeIncludes = dependencyClosure(runtimePeers)

// The closure is the only thing keeping the database driver and the migrate
// CLI in the image, and both fail long after the build looks green — the
// container boots, serves `/`, and dies on the first sign-in. Check here so a
// regression stops the build instead.
for (const required of ["postgres", "@naeemba/next-starter", "drizzle-orm"]) {
  if (!runtimeIncludes.some((glob) => glob.endsWith(`/${required}/**/*`))) {
    throw new Error(
      `Runtime peer closure is missing "${required}" — the container would start and then fail on the first sign-in.`,
    )
  }
}

const nextConfig: NextConfig = {
  // Bundles the server and its traced node_modules into .next/standalone, so
  // the runtime image needs no npm install of its own.
  output: "standalone",
  // Keyed on every route, not just the auth API: any server component that
  // calls getSession pulls the same peers in.
  outputFileTracingIncludes: { "/**": runtimeIncludes },
}

export default nextConfig
