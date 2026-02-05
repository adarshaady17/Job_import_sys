const logger = {
  info: (msg, ...rest) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, ...rest),
  error: (msg, ...rest) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, ...rest),
  warn: (msg, ...rest) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, ...rest),
  debug: (msg, ...rest) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`, ...rest);
    }
  },
};

module.exports = logger;


