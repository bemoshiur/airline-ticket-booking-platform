import { NextRequest, NextResponse } from "next/server";
import { db, users, userRoleEnum, userStatusEnum } from "@/lib/db";
import { auth } from "@/auth";
import { eq, desc, or, and, ilike, type SQL } from "drizzle-orm";
import { INVALID, parseEnumParam } from "@/lib/db/enum-param";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Only superadmins can access user management" },
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search");
    const roleParam = searchParams.get("role");
    const statusParam = searchParams.get("status");
    const limitParam = parseInt(searchParams.get("limit") || "50");
    const offsetParam = parseInt(searchParams.get("offset") || "0");

    // Clamp pagination
    const limit = Math.min(Math.max(1, limitParam || 50), 200);
    const offset = Math.max(0, offsetParam || 0);

    // Filter values are validated against the enum rather than cast. An
    // unrecognised value reaching a SQL enum comparison makes Postgres throw,
    // which would surface to the caller as a 500 instead of a 400.
    const role = parseEnumParam(roleParam, userRoleEnum.enumValues);
    if (role === INVALID) {
      return NextResponse.json({ error: "Unknown role" }, { status: 400 });
    }

    const status = parseEnumParam(statusParam, userStatusEnum.enumValues);
    if (status === INVALID) {
      return NextResponse.json({ error: "Unknown status" }, { status: 400 });
    }

    // Build where conditions - combine all with AND
    const conditions: SQL[] = [];
    if (search) {
      const match = or(
        ilike(users.email, `%${search}%`),
        ilike(users.fullName, `%${search}%`)
      );
      if (match) conditions.push(match);
    }
    if (role) conditions.push(eq(users.role, role));
    if (status) conditions.push(eq(users.status, status));

    // Combine all conditions with AND
    const whereConditions =
      conditions.length > 0 ? and(...conditions) : undefined;

    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
        lastLogin: users.lastLogin,
      })
      .from(users)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.createdAt));

    return NextResponse.json({
      users: userList,
      pagination: {
        limit,
        offset,
        count: userList.length,
      },
    });
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// Suspend/activate user
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Only superadmins can manage users" },
        { status: 403 }
      );
    }

    const { userId, status: newStatus } = await req.json();

    if (!userId || !newStatus) {
      return NextResponse.json(
        { error: "Missing userId or status" },
        { status: 400 }
      );
    }

    if (!["active", "suspended", "deleted"].includes(newStatus)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Prevent self-suspension
    if (userId === session.user.id && newStatus !== "active") {
      return NextResponse.json(
        { error: "Cannot change your own status" },
        { status: 403 }
      );
    }

    // Get target user to check role
    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent suspending other superadmins (only active status allowed)
    if (targetUser[0].role === "superadmin" && newStatus !== "active") {
      return NextResponse.json(
        { error: "Cannot change superadmin status" },
        { status: 403 }
      );
    }

    await db
      .update(users)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({
      message: `User ${newStatus}`,
      status: newStatus,
    });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
