import { createServer } from "@naeemba/next-starter/server"
import { auth } from "./auth.ts"

export const { getSession, requireSession } = createServer(auth)
