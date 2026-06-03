import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // 🔐 改良版：クッキーが存在し、かつ中身（value）が空っぽ（""）ではないことまで厳密にチェック！
  const allCookies = request.cookies.getAll();
  const isLoggedIn = allCookies.some(
    cookie => cookie.name.startsWith("sb-") && cookie.value.trim() !== ""
  );

  const { pathname } = request.nextUrl;

  // 1. 未ログインなのに、セキュアな画面にアクセスしようとしたらログイン画面へ
  if (!isLoggedIn && pathname !== "/login" && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. すでにログイン済み（中身あり）なのに、ログイン画面を開こうとしたらトップへ
  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/chat/:path*",
    "/history/:path*",
    "/master/:path*",
    "/login"
  ],
};