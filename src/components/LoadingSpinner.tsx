import LaurelAvatar from "@/components/LaurelAvatar";

export default function LoadingSpinner({ size = 40 }: { size?: number }) {
  return (
    <div role="status" className="flex items-center justify-center">
      <LaurelAvatar size={size} className="animate-pulse" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
