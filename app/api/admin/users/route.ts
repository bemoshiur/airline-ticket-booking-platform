import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/lib/db";
import { auth } from "@/auth";
import { eq, desc, or, ilike } from "drizzle-orm";

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
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where conditions
    let whereConditions = undefined;
    if (search) {
      whereConditions = or(
        ilike(users.email, `%${search}%`),
        ilike(users.fullName, `%${search}%`)
      );
    }
    if (role) {
      whereConditions = whereConditions
        ? undefined // TODO: Combine conditions properly
        : eq(users.role, role as any);
    }
    if (status) {
      whereConditions = whereConditions
        ? undefined
        : eq(users.status, status as any);
    }

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
