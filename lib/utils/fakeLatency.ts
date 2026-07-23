export function fakeLatency(min = 400, max = 1100): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function fakeLatencyShort(): Promise<void> {
  return fakeLatency(200, 600);
}

export function fakeLatencyLong(): Promise<void> {
  return fakeLatency(800, 2000);
}
