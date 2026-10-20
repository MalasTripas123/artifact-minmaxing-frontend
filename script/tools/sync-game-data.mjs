// Compatibility entry point; --check / --dry-run keep preview mode.
process.argv.splice(2, 0, 'sync');
if (!process.argv.includes('--check') && !process.argv.includes('--dry-run')) process.argv.push('--apply');
await import('../../../tools/catalog-cli.mjs');
