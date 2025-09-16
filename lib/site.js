export function getBaseUrl() {
  const v = process.env.NEXT_PUBLIC_APP_URL;
  return (v && v.replace(/\/$/, "")) || "http://localhost:3000";
}
