import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

async function deleteUser(userId: string) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete account" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (bearerToken) {
    try {
      const admin = createAdminClient();
      const {
        data: { user },
        error,
      } = await admin.auth.getUser(bearerToken);

      if (error || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      return deleteUser(user.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete account";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await deleteUser(user.id);
    await supabase.auth.signOut();
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
