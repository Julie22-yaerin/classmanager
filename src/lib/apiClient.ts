import { auth } from "@/lib/firebase";

export class MissingApiKeyClientError extends Error {}

export async function callApi<T>(path: string, body: unknown): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");
  const idToken = await user.getIdToken();

  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(body),
  });
  const json = await res.json();

  if (res.status === 503 && json.code === "MISSING_API_KEY") {
    throw new MissingApiKeyClientError(json.error);
  }
  if (!res.ok) {
    throw new Error(json.error ?? "Request failed");
  }
  return json as T;
}
