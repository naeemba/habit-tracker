import { createProxy } from "@naeemba/next-starter/proxy"

export default createProxy({ protect: ["/account/:path*"] })

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth/).*)"] }
