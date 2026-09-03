# M12 — CI/CD & Déploiement

> Statut : À FAIRE
> Dépend de : M11 (tests passing)
> Spécification : autonome dans ce fichier de tâche (les docs externes sont optionnelles, pas nécessaires).


## Résumé du contrat du jalon

- Périmètre de livraison : pipeline CI, workflows de déploiement test/prod, configuration infra, webhook de revalidation, hygiène des secrets.
- Cibles d’exécution : Vercel test deployment + Docker/Nginx production deployment.
- Frontière de sécurité : only `NEXT_PUBLIC_*` exposed client-side; all conversion secrets server-side.

## Critères d’acceptation (obligatoires)

- La CI exécute lint, type-check, tests unitaires et build sur les pushes/PRs.
- Test deploy triggers automatically on main branch updates.
- Le déploiement prod nécessite une approbation manuelle et réussit via workflow_dispatch.
- La route de revalidation fonctionne avec un token secret et une invalidation par chemin.

## Preuves requises

- Workflow run URLs for CI, deploy-test, deploy-prod.
- Deployment checklist with env/secrets verification.
- Successful test à blanc of revalidate endpoint.

## Contraintes globales (décisions validées)

- CI doit inclure lint + type-check + tests pertinents + build.
- Les changements API doivent inclure mise à jour des exemples de contrat avant merge.
- Post-deploy smoke tests obligatoires + fenêtre de confiance en production.

## Tâches

### M12.1 — GitHub Actions: CI [M]
- [ ] `.github/workflows/ci.yml`
- [ ] Déclencheur : push to any branch, PR to main
- [ ] Étapes : install deps, lint, type-check, unit tests, build
- [ ] Node 18
- **Portée** : `.github/workflows/ci.yml`

### M12.2 — GitHub Actions: deploy test [M]
- [ ] `.github/workflows/deploy-test.yml`
- [ ] Déclencheur : merge to main (auto)
- [ ] Deploy to Vercel (or Docker test server)
- [ ] Secrets: VERCEL_TOKEN (or SERVER_SSH_KEY)
- **Portée** : `.github/workflows/deploy-test.yml`

### M12.3 — GitHub Actions: deploy prod [M]
- [ ] `.github/workflows/deploy-prod.yml`
- [ ] Déclencheur : manual (workflow_dispatch) with environment protection
- [ ] Approval required (Rachid)
- [ ] Docker build → push to server → restart service
- [ ] Secrets: SERVER_SSH_KEY, ODOO_URL
- **Portée** : `.github/workflows/deploy-prod.yml`

### M12.4 — Vercel project setup [S]
- [ ] Connect repo to Vercel
- [ ] Configure env vars in Vercel dashboard
- [ ] Vérifier auto-deploy on push to main
- **Portée** : Vercel dashboard (manual)

### M12.5 — Docker production setup [M]
- [ ] Vérifier Dockerfile builds correctly
- [ ] docker-compose for production with env vars
- [ ] Nginx reverse proxy config (if not handled by Cloudflare)
- [ ] SSL via Cloudflare or Let's Encrypt
- **Portée** : `Dockerfile`, `docker-compose.yml`, `nginx.conf` (create if needed)

### M12.6 — Domain & Cloudflare setup [S]
- [ ] Configure `oaksome.com` DNS → Tecnibo prod server
- [ ] Cloudflare CDN rules:
  - Cache images 30 days
  - Cache static pages per ISR TTL
  - No cache for /profile, /commandes, /checkout
- **Portée** : Cloudflare dashboard (manual)

### M12.7 — ISR revalidation webhook [S]
- [ ] `app/api/revalidate/route.ts`
- [ ] Secret token verification
- [ ] Odoo calls this after product/collection/content updates
- [ ] Revalidates specific paths (product, collection, gamme, etc.)
- **Portée** : `app/api/revalidate/route.ts`

### M12.8 — Environment protection [S]
- [ ] Vérifier no secrets in client bundles (NEXT_PUBLIC_ only for public vars)
- [ ] `META_CAPI_ACCESS_TOKEN`, `GOOGLE_ADS_CONVERSION_ID`, `GOOGLE_ADS_CONVERSION_LABEL`, `GA4_API_SECRET` server-side only
- [ ] .env.local not committed
- **Portée** : Verification task
