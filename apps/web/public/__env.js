// Runtime environment config - overwritten by docker-entrypoint.sh in production.
// In local dev, the fallback values in lib/api.ts are used instead.
// FARO_URL is empty in dev (disables frontend observability).
window.__ENV = {};
