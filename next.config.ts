import { readFileSync } from "node:fs"
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
// The upstream fix is for the starter to export these globs next to the code
// that hides the imports, so the list cannot drift. See docs/stack.md.
const runtimePeers = [
  "postgres",
  "better-auth",
  "@better-auth/passkey",
  "resend",
  "@react-email/components",
  "@react-email/render",
]

// Assumes npm's flat node_modules. Peers that are not installed are skipped,
// so the list can name every optional peer the starter has.
function dependencyClosure(roots: string[]): string[] {
  const found = new Set<string>()
  const visit = (name: string) => {
    if (found.has(name)) return
    let manifest: { dependencies?: Record<string, string> }
    try {
      manifest = JSON.parse(readFileSync(`node_modules/${name}/package.json`, "utf8"))
    } catch {
      return
    }
    found.add(name)
    for (const dependency of Object.keys(manifest.dependencies ?? {})) visit(dependency)
  }
  roots.forEach(visit)
  return [...found].map((name) => `./node_modules/${name}/**/*`)
}

const nextConfig: NextConfig = {
  // Bundles the server and its traced node_modules into .next/standalone, so
  // the runtime image needs no npm install of its own.
  output: "standalone",
  // Keyed on every route, not just the auth API: any server component that
  // calls getSession pulls the same peers in.
  outputFileTracingIncludes: { "/**": dependencyClosure(runtimePeers) },
}

export default nextConfig
