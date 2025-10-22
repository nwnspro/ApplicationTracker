import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3001", // 后端服务器地址
});

export async function signInWithGoogle() {
  return authClient.signIn.social({
    provider: "google",
    callbackURL: "http://localhost:5173/",
  });
}

export async function signOut() {
  return authClient.signOut();
}

export async function getSession() {
  return authClient.getSession();
}
