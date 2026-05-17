export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Dynamically import the sync service to avoid edge runtime issues
    const { startObsidianSync } = await import('./lib/vector/obsidianSync');
    startObsidianSync();
  }
}
