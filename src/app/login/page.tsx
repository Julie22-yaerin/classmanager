"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { ensureUserProfile } from "@/lib/firestore/profile";
import LaurelAvatar from "@/components/LaurelAvatar";

function friendlyError(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email hoặc mật khẩu không đúng.";
    case "auth/email-already-in-use":
      return "Email này đã có tài khoản — thử đăng nhập thay vì đăng ký.";
    case "auth/weak-password":
      return "Mật khẩu cần ít nhất 6 ký tự.";
    case "auth/invalid-email":
      return "Email không hợp lệ.";
    default:
      return "Có lỗi xảy ra, thử lại nhé.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const blockedBySignupGate = mode === "signup" && !ageConfirmed;

  async function afterAuth() {
    if (auth.currentUser) {
      const profile = await ensureUserProfile(auth.currentUser);
      router.push(profile.onboardingComplete ? "/app" : "/onboarding");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      await afterAuth();
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setError(friendlyError(code));
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      await afterAuth();
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // User closed the popup themselves — not an error worth showing.
      } else if (code === "auth/unauthorized-domain") {
        setError(
          `Domain "${window.location.hostname}" chưa được cấp phép trong Firebase Console → Authentication → Settings → Authorized domains — thêm domain này vào đó.`,
        );
      } else if (code === "auth/popup-blocked") {
        setError("Trình duyệt đang chặn popup đăng nhập — cho phép popup cho trang này rồi thử lại.");
      } else {
        setError("Đăng nhập Google thất bại, thử lại nhé.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onForgotPassword() {
    if (!email.trim()) {
      setError("Nhập email trước, rồi bấm quên mật khẩu.");
      return;
    }
    setError(null);
    setResetStatus(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch {
      // Same message whether or not the email exists — avoids leaking which emails have accounts.
    } finally {
      setResetStatus("Nếu email này có tài khoản, chúng tôi đã gửi link đặt lại mật khẩu.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-[#212121]">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <LaurelAvatar size={48} />
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">School AI</h1>
          <p className="text-sm text-zinc-500">{mode === "signin" ? "Đăng nhập để tiếp tục" : "Tạo tài khoản mới"}</p>
        </div>

        {mode === "signup" && (
          <label className="mb-4 flex items-start gap-2 text-xs text-zinc-500">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="mt-0.5"
            />
            Tôi từ 16 tuổi trở lên, hoặc tài khoản này được phụ huynh/người giám hộ tạo và đồng ý cho tôi sử dụng.
          </label>
        )}

        <button
          type="button"
          onClick={onGoogle}
          disabled={busy || blockedBySignupGate}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.96 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3-2.33z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z" />
          </svg>
          Tiếp tục với Google
        </button>

        <div className="mb-4 flex items-center gap-3 text-xs text-zinc-400">
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          hoặc
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="rounded-xl border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu"
            className="rounded-xl border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          {mode === "signin" && (
            <button type="button" onClick={onForgotPassword} className="self-end text-xs text-zinc-500 hover:underline">
              Quên mật khẩu?
            </button>
          )}
          {resetStatus && <p className="text-sm text-green-600 dark:text-green-400">{resetStatus}</p>}
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={busy || blockedBySignupGate}
            className="rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          >
            {busy ? "Đang xử lý…" : mode === "signin" ? "Đăng nhập" : "Đăng ký"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500">
          {mode === "signin" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setAgeConfirmed(false);
            }}
            className="font-medium text-zinc-900 underline dark:text-zinc-50"
          >
            {mode === "signin" ? "Đăng ký" : "Đăng nhập"}
          </button>
        </p>

        <p className="mt-6 text-center text-xs text-zinc-400">
          <a href="/privacy" className="underline">
            Privacy Policy
          </a>{" "}
          ·{" "}
          <a href="/terms" className="underline">
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  );
}
