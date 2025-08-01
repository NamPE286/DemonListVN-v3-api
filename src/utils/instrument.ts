import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: "https://a051a3204dbf41eb600f322b67dd4cdc@o4509770173054976.ingest.us.sentry.io/4509770259365888",
  sendDefaultPii: true,
});