import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName } from "../../../../lib/admin-session";

export async function POST() {
    const cookieStore = await cookies();
    cookieStore.delete(getSessionCookieName());
    console.log("[AdminAuth] Admin signed out.");

    return NextResponse.json({
        ok: true,
    });
}
