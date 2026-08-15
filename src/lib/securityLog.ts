/**
 * Structured security-event logging. Goes to stdout/stderr, which Railway
 * (and most hosts) capture as searchable logs — there's no separate log
 * store wired up here, this just makes the events greppable.
 */
export function logSecurityEvent(event: string, details: Record<string, unknown>): void {
  console.warn(
    JSON.stringify({
      securityEvent: event,
      time: new Date().toISOString(),
      ...details,
    }),
  );
}
