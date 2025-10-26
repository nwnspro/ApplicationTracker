import { createAuthClient } from "better-auth/client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const FRONTEND_URL = window.location.origin;

export const authClient = createAuthClient({
  baseURL: API_URL,
});

export async function signInWithGoogle() {
  return authClient.signIn.social({
    provider: "google",
    callbackURL: FRONTEND_URL,
  });
}

export async function signOut() {
  return authClient.signOut();
}

export async function getSession() {
  return authClient.getSession();
}
