import { useSocketEvent } from './useSocket.js';

/**
 * Subscribes a dashboard to the events that should make it refetch:
 * a status change, a reassignment, or a newly logged interaction.
 * Centralised here so Founder/Team/BDE dashboards all react to the same
 * set of events without repeating the wiring three times.
 *
 * `refetch` should be a stable function (e.g. wrapped in useCallback, or
 * simply a function defined in the component body that doesn't need to
 * be memoised because it's cheap - matches how the dashboards already
 * define their fetch functions).
 */
export function useLiveDashboardRefresh(refetch) {
  useSocketEvent('lead:statusChanged', refetch);
  useSocketEvent('lead:reassigned', refetch);
  useSocketEvent('interaction:created', refetch);
}
