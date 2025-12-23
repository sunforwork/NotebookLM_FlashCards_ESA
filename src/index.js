// This is a minimal stub for ESA Pages edge function entry.
// Since we are hosting a static site, this function will primarily handle
// API requests if any, or fall back to 404 for non-static assets.
// The "notFoundStrategy" in esa.jsonc handles the SPA routing (serving index.html).

export default {
  async fetch(request, env, ctx) {
    return new Response("Not Found", { status: 404 });
  }
};
