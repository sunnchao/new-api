import TurnstileModule from 'react-turnstile';

export function resolveTurnstileComponent(turnstileModule) {
  if (typeof turnstileModule === 'function') {
    return turnstileModule;
  }

  if (
    turnstileModule &&
    typeof turnstileModule === 'object' &&
    typeof turnstileModule.default === 'function'
  ) {
    return turnstileModule.default;
  }

  return turnstileModule;
}

export const Turnstile = resolveTurnstileComponent(TurnstileModule);
