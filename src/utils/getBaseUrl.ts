export const getBaseUrl = () => {
  // Check if we're in development
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    "http://localhost:3000";

  // Make sure to include `https://` when not localhost.
  url = url.includes("http") ? url : `https://${url}`;

  // Remove trailing slash if present
  url = url.endsWith("/") ? url.slice(0, -1) : url;

  return url;
};
