'use client';

import { useEffect } from 'react';
import { faro, getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

export function FrontendObservability() {
  useEffect(() => {
    if (faro.api) return;

    const faroUrl = (window as unknown as { __ENV?: { FARO_URL?: string } }).__ENV?.FARO_URL;
    if (!faroUrl) return;

    try {
      initializeFaro({
        url: faroUrl,
        app: {
          name: 'hew-web',
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
        },
        instrumentations: [
          ...getWebInstrumentations(),
          new TracingInstrumentation(),
        ],
      });
    } catch {
      // Silently fail -- observability should never break the app
    }
  }, []);

  return null;
}
