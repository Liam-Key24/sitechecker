/** Shared dot pattern used across landing sections (matches Hero / Why it matters). */
export function LandingDotGrid({
  className = "",
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "hero";
}) {
  const density =
    variant === "hero"
      ? "bg-size-[18px_18px] opacity-50"
      : "bg-size-[14px_14px] opacity-35";
  return (
    <div
      className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-stone-300)_1px,transparent_1px)] ${density} ${className}`}
      aria-hidden
    />
  );
}
