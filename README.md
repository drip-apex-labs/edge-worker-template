# Apex Edge Worker

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/drip-apex-labs/edge-worker-template)

This repository is the deployable template for the [Apex Edge Worker](https://github.com/drip-apex-labs/Apex/tree/main/packages/edge-worker). It contains a prebuilt worker, so a clone can deploy without a build step.

## Deploy

1. Select **Deploy to Cloudflare** above and sign in to Cloudflare and GitHub when asked.
2. Select the Cloudflare account that owns the storefront zone.
3. In the Apex dashboard install surface, create the shop-specific ingest token and copy the env/secrets block backed by `/api/edge-worker/ingest-token`. Use its `SHOP_ID`, `CONFIG_API_URL`, and `APEX_INGEST_TOKEN` values when prompted. Leave `CONFIG_API_URL` blank to use `https://app.drip-apex.com`.
4. Set `ORIGIN_URL` to your storefront's direct origin URL. The hostname must not resolve through the Worker route.
5. Complete the deployment. Do not add a route during the build.

The deployment creates the Worker but does not attach storefront traffic. Cloudflare deploy buttons cannot select a safe route for another account.

## Add the Worker route

1. Open **Workers & Pages** in Cloudflare and select the deployed Apex Edge Worker.
2. Open **Settings** → **Domains & Routes**.
3. Select **Add** → **Route**, select the storefront zone, and enter the smallest route pattern that needs Apex. Start with one test path when possible.
4. Save the route.

Do not add a `routes` block to `wrangler.jsonc`. A fixed route can bind the wrong zone or break deployment in another account.

## Verify

Request `GET /_drip/status` on the Worker's `workers.dev` URL (Cloudflare shows it after the deployment). A successful response returns secret-free worker and config diagnostics. A route scoped to a test path does not match `/_drip/status`, so do not use the storefront route for this check.

## Local development

Copy `.dev.vars.example` to `.dev.vars`, fill in the values from the Apex dashboard, then run `npm install` and `npm run dev`. Wrangler loads `.dev.vars` only for local development — it is never uploaded by a deploy. Never commit `.dev.vars`.

## Deploy from your machine

The deploy button flow prompts for the values. For a manual `npm run deploy` instead:

1. Fill in `SHOP_ID`, `ORIGIN_URL`, and optionally `CONFIG_API_URL` under `vars` in `wrangler.jsonc`.
2. Run `npm install` and `npm run deploy`.
3. Run `npx wrangler secret put APEX_INGEST_TOKEN` and paste the token from the Apex dashboard. This uploads the secret and activates a new version.

Until the secret is set, the worker serves pages in SDK-only mode and `GET /_drip/status` reports the missing token.
