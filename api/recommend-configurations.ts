// Vercel function for the describe-account modal. In dev, vite.config.js
// serves the same handler. Relative imports, since Vercel doesn't resolve `@/`.
import { recommendAccountShape } from "../src/flows/lib/jev/recommendAccountShape"
import type { UserPath } from "../src/flows/components/creation-workspace/account-configuration/model"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const description = typeof body?.description === "string" ? body.description : ""
  const userPath: UserPath | undefined = body?.userPath === "direct" || body?.userPath === "platform"
    ? body.userPath
    : undefined
  const files = Array.isArray(body?.files)
    ? body.files.filter((name: unknown) => typeof name === "string").slice(0, 20)
    : []

  const result = await recommendAccountShape({ description, userPath, files })
  return Response.json(result)
}
