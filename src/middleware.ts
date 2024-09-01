import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { addUser, getRetro } from "./app/api/storage/storage";

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuth = !!token;
  const isStartPage = req.nextUrl.pathname === "/";
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isRetro = req.nextUrl.pathname.startsWith("/retros/");
  if (!isAuth && !isStartPage && !isLoginPage) {
    return NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL)); // req.url));
  }

  if (isRetro) {
    const retroId = req.nextUrl.pathname.split("/retros/")[1];
    const response = await fetch(new URL(`/api/storage/${retroId}`, process.env.NEXTAUTH_URL),{ // req.url), {
      method: "GET",
      // headers: {
      //   Authorization: `Bearer ${token?.accessToken}`
      // }
    });

    if (response.status === 404) {
      return NextResponse.redirect(new URL("/retros", process.env.NEXTAUTH_URL)); // req.url));
    } else {
      // TODO socket message token.email joins retroID
      // or connect socket for particular retro?
      // const retroData = await response.json();
      const res = NextResponse.next();
      // res.cookies.set("retroData", JSON.stringify(retroData), { httpOnly: true });
      return res;
    }
  }

  if (isAuth && (isStartPage || isLoginPage)) {
    return NextResponse.redirect(new URL("/retros", process.env.NEXTAUTH_URL)); // req.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ["/", "/retros", "/retros/:retro_id*", "/login", "/logout"] };
