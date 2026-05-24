import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RevalidateBody = {
  tags?: unknown;
  secret?: unknown;
};

export async function POST(request: Request) {
  const expectedSecret = process.env.REVALIDATE_SECRET;
  if (!expectedSecret) {
    return NextResponse.json(
      { error: "REVALIDATE_SECRET is not configured" },
      { status: 500 },
    );
  }

  let body: RevalidateBody;
  try {
    body = (await request.json()) as RevalidateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.secret !== "string" || body.secret !== expectedSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!Array.isArray(body.tags) || body.tags.length === 0) {
    return NextResponse.json({ error: "tags must be a non-empty array" }, { status: 400 });
  }

  const tags = body.tags.filter((t): t is string => typeof t === "string" && t.length > 0);
  for (const tag of tags) {
    // External webhook → expire immediately so the next request fetches fresh.
    revalidateTag(tag, { expire: 0 });
  }

  return NextResponse.json({ revalidated: tags });
}
