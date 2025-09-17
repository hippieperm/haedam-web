import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "change_this_to_a_secure_secret_key_in_production"
);

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  exp?: number;
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  if (!token) return null;
  return verifyJWT(token.value);
}

export async function setSession(payload: JWTPayload): Promise<void> {
  const token = await signJWT(payload);
  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("token");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        role: true,
        profileImage: true,
        phone: true,
        createdAt: true,
      },
    });
    return user;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("인증이 필요합니다.");
  }
  if (user.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다.");
  }
  return user;
}
