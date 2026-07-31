import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, priceAlerts } from "@/lib/db";
import { auth } from "@/auth";

/**
 * Ownership is enforced in the WHERE clause rather than by reading first and
 * comparing — there is no window in which another user's alert is loaded, and
 * a miss is indistinguishable from "does not exist".
 */

const patchSchema = z.object({
  status: z.enum(["active", "paused"]).optional(),
  targetPrice: z.coerce.number().int().positive().max(100_000_000).nullish(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be JSON" },
      { status: 400 }
    );
  }

  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const changes: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.status) {
    changes.status = parsed.data.status;
    // Resuming a watch clears the failure streak that paused it.
    if (parsed.data.status === "active") changes.failureCount = 0;
  }
  if (parsed.data.targetPrice !== undefined) {
    changes.targetPrice = parsed.data.targetPrice ?? null;
  }

  const updated = await db
    .update(priceAlerts)
    .set(changes)
    .where(and(eq(priceAlerts.id, id), eq(priceAlerts.userId, session.user.id)))
    .returning();

  if (!updated[0]) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  return NextResponse.json(updated[0]);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  const deleted = await db
    .delete(priceAlerts)
    .where(and(eq(priceAlerts.id, id), eq(priceAlerts.userId, session.user.id)))
    .returning({ id: priceAlerts.id });

  if (!deleted[0]) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: deleted[0].id });
}
