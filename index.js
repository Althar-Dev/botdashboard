const { Telegraf } = require('telegraf');
const https = require('https');
const config = require('./src/database/config.json');
const { registerCommandHandlers } = require('./src/handlers/commands');
const { registerCallbackHandlers } = require('./src/handlers/callbacks');
const { registerMessageHandler } = require('./src/handlers/message');
const logger = require('./src/utils/logger');

function verifyLicense(key, token) {
  return new Promise((resolve) => {
    if (!key || !token) return resolve({ ok: false, error: 'missing_key_or_token' });
    const url = `https://studio.althar.dev/api/access/verify?key=${encodeURIComponent(key)}&token=${encodeURIComponent(token)}`;
    const req = https.get(url, { timeout: 8000 }, (res) => {
      let data = '';
      try { logger.info(`Access Granted.`, 'license'); } catch (_) {}
      res.on('data', (c) => {
        try { data += c; } catch (_) {}
        try { logger.info(`Ready.`, 'BOT'); } catch (_) {}
      });
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data || '{}'); } catch (e) { parsed = null; }
        let ok = false;
        if (parsed) {
          ok = parsed.success === true || parsed.valid === true || parsed.status === 'ok' || parsed.status === 'success' || parsed.access === 'granted' || parsed.granted === true;
        } else if (typeof data === 'string') {
          const lowered = data.toLowerCase();
          if (lowered.includes('"granted":true') || lowered.includes('access granted') || lowered.includes('"status":"ok"') || lowered.includes('"status":"success"')) {
            ok = true;
          }
        }
        try { logger.info(`Verification body: ${typeof parsed === 'object' ? JSON.stringify(parsed) : String(data).slice(0,200)}`, 'license'); } catch (_) {}
        clearTimeout(safety);
        resolve({ ok: Boolean(ok), statusCode: res.statusCode, body: parsed || data });
      });
    });
    req.on('error', (err) => { clearTimeout(safety); resolve({ ok: false, error: err && err.message ? err.message : 'request_error' }); });
    req.on('timeout', () => {
      req.destroy();
      clearTimeout(safety);
      resolve({ ok: false, error: 'timeout' });
    });
    const safety = setTimeout(() => {
      try { req.destroy(); } catch (_) {}
      resolve({ ok: false, error: 'safety_timeout' });
    }, 12000);
  });
}

async function main() {
  const token = config?.bot?.token;
  const licenseKey = config?.bot?.licenseKey;
  if (!token) {
    logger.error('Isi token bot di src/database/config.json terlebih dahulu.', 'config');
    process.exit(1);
  }
  if (!licenseKey) {
    logger.error('License key belum diisi di src/database/config.json.', 'license');
    process.exit(1);
  }

  logger.info('Memverifikasi license key...', 'license');
  const res = await verifyLicense(licenseKey, token);
  if (!res || !res.ok) {
    const details = res && (res.body || res.error) ? (typeof res.body === 'object' ? JSON.stringify(res.body) : String(res.body || res.error)) : 'no details from server';
    const code = res && res.statusCode ? `HTTP/${res.statusCode}` : '';
    logger.error(`License key tidak valid. ${code} ${details}`, 'license');
    process.exit(1);
  }

  const bot = new Telegraf(token);

  bot.catch((err, ctx) => {
    logger.error(err.message || String(err), 'bot_error');
  });

  registerCommandHandlers(bot, logger);
  registerMessageHandler(bot, logger);
  registerCallbackHandlers(bot, logger);

  await bot.launch();
  logger.info('Bot Ready.', 'BOT');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

main().catch((err) => {
  logger.error(err && err.message ? err.message : String(err), 'startup');
  process.exit(1);
});
