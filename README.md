# switch-guard

Public repository for Switch-related guard/notification workflow experiments.

## What is here

- Testable project shell at the repository root
- Cloudflare Worker code under `worker/`
- Local scripts and browser/payment automation experiments are intentionally ignored when not suitable for publication

## Development

Run root tests:

```bash
npm test
```

Worker-specific commands live under `worker/`.

## Secrets and local files

Do not commit account-specific automation scripts, `.dev.vars`, `.env` files, Wrangler state, logs, or generated output. The repository `.gitignore` intentionally excludes local automation experiments that may reference account-specific flows.
