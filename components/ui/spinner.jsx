export default function Spinner({ size = 16 }) {
  return (
    <div
      aria-label="Loading"
      role="status"
      className="inline-block animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground"
      style={{ width: size, height: size }}
    />
  );
}
