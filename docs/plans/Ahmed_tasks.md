# Ahmed — Répartition des tâches cross-repo (Odoo + Next.js)

Responsable : Ahmed  
Mode : full-stack (backend Odoo + frontend Next.js)  
Objectif : livrer de bout en bout la tranche verticale **Catalogue + Commerce + Compte + Infrastructure de livraison**.

---

## 1) Responsabilité principale (feature pod)

- Navigation / catalogue de base et pages taxonomiques
- Flux panier / checkout / compte
- APIs Odoo Tier 1/3/4 et modules workflow
- Stabilisation sécurité, déploiement et release

---

## 2) Tâches Odoo (repo : `/home/rachid/01_Workspace/odoo/tecnibo/website/tasks`)

### Phase A — Bloqueurs API pour le frontend
- [ ] B6-api-tier1.md (bloqueur prioritaire)
- [ ] B8-api-tier3.md
- [ ] B9-api-tier4.md

### Phase B — Modules workflow / backend
- [ ] B3-sale-workflow.md
- [ ] B4-fsm-access.md
- [ ] B5-portal-tracker.md

### Phase C — Stabilisation plateforme
- [ ] B12-config-data.md
- [ ] B13-dashboard-views.md
- [ ] B14-security-access.md

### Phase D — Contribution tests
- [ ] B16-testing.md (tests for B6/B8/B9 + security)

---

## 3) Tâches Next.js (repo : `/home/rachid/01_Workspace/oaksome/tasks`)

### Phase A — Fondations layout + catalogue
- [ ] M1-layout-navigation.md
- [ ] M2-catalogue-products.md
- [ ] M3-taxonomy-pages.md

### Phase B — Auth + commerce
- [ ] M6-auth-account.md
- [ ] M7-cart-checkout.md

### Phase C — SEO / tracking + release
- [ ] M9-seo-tracking.md (incluant le `/api/tracking/capi`)
- [ ] M12-cicd-deploy.md

### Phase D — Contribution QA
- [ ] M11-testing-qa.md (tests pour le périmètre M1/M2/M3/M6/M7/M9/M12)

---

## 4) Points de contrôle d’intégration avec Ayoub

- [ ] Point de contrôle 1 : exposer des payloads Tier 1 stables pour qu’Ayoub puisse passer aux données live.
- [ ] Point de contrôle 2 : confirmer le contrat Tier 2 leads/partage consommé par le frontend d’Ayoub.
- [ ] Point de contrôle 3 : valider le parcours checkout/compte sur les endpoints Tier 3/4.
- [ ] Point de contrôle 4 : passage final de régression avec preuves combinées M11 + B16.

---

## 5) Définition de terminé (Ahmed)

- [ ] Toutes les tâches attribuées sont implémentées avec des contrats API stables.
- [ ] Aucune implémentation Odoo de `/api/tracking/capi` (propriété Next.js respectée).
- [ ] Les règles de sécurité / accès sont appliquées pour les frontières user/public/admin.
- [ ] Les checks CI/build/deploy sont verts pour le frontend, et les checks API sont verts pour le backend.
- [ ] Notes de passation publiées (ce qui est fait, endpoints prêts, limites connues).
