import { faro } from '@grafana/faro-web-sdk';

export function trackEvent(name: string, attributes?: Record<string, string>) {
  try {
    faro.api?.pushEvent(name, attributes);
  } catch {
    // Never let analytics break the app
  }
}

export function trackPostCreated(postType: string) {
  trackEvent('post_created', { postType });
}

export function trackOfferSubmitted(itemRequestId: string) {
  trackEvent('offer_submitted', { itemRequestId });
}
