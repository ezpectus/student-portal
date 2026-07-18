const apiUrl = process.env.API_BASE_URL || 'http://localhost:5000';
const intervalMs = Number(process.env.HEALTH_INTERVAL_MS || 10000);

const check = async () => {
  const startedAt = Date.now();
  try {
    const response = await fetch(apiUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    console.log(`[${new Date().toISOString()}] API ${apiUrl} -> ${response.status} (${Date.now() - startedAt}ms)`);
  } catch (error) {
    console.log(`[${new Date().toISOString()}] API ${apiUrl} -> unavailable: ${error.message}`);
  }
};

console.log(`[health-watch] Monitoring configured backend: ${apiUrl}`);
console.log('[health-watch] This project uses the external REST API; no backend server is hosted in this repository.');
void check();
setInterval(() => void check(), intervalMs);
