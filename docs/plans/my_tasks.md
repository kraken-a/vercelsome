# Ayoub — Répartition des tâches cross-repo (Odoo + Next.js)

Responsable : Ayoub  
Mode : full-stack (backend Odoo + frontend Next.js)  
Objectif : livrer de bout en bout la tranche verticale **Configurateur + Leads/Partage + Contenu**.

---

## 1) Responsabilité principale (feature pod)

- Tunnel configurateur et flux de configuration partagée
- Capture de leads, intégration contact/échantillons
- Surfaces de contenu (inspirations / études de cas / pages marketing statiques)
- Contrat API métier Tier 2 dans Odoo

---

## 2) Tâches Odoo (repo : `/home/rachid/01_Workspace/odoo/tecnibo/website/tasks`)

### Phase A — Données + API Tier 2 (démarrage immédiat)
- [ ] B1-custom-fields.md
- [ ] B2-new-models.md
- [ ] B7-api-tier2.md

### Phase B — Support contenu / recherche / contact
- [ ] B10-api-tier5.md (focus : `/search`, `/testimonials`, `/contact`)

### Phase C — Automatisations métier utilisées par les leads / échantillons
- [ ] B11-automations-emails.md (règles / templates liés aux leads + échantillons en premier)

### Phase D — Contribution à la stabilisation
- [ ] B15-i18n.md (pour les modèles / endpoints possédés ci-dessus)
- [ ] B16-testing.md (tests pour B7/B10 et la logique modèle associée)

---

## 3) Tâches Next.js (repo : `/home/rachid/01_Workspace/oaksome/tasks`)

### Phase A — Configurateur + Leads / Partage
- [ ] M5-leads-contact.md (commencer par M5.1 pour débloquer M4.8)
- [ ] M4-configurator.md

### Phase B — Pages de contenu
- [ ] M8-content-pages.md

### Phase C — Page(s) pro
- [ ] M10-pro-b2b.md

### Phase D — Contribution QA
- [ ] M11-testing-qa.md (tests pour le périmètre M4/M5/M8/M10)

---

## 4) Points de contrôle d’intégration avec Ahmed

- [ ] Point de contrôle 1 : B6 Tier 1 prêt par Ahmed avant de remplacer les mocks sur les pages catalogue/navigation.
- [ ] Point de contrôle 2 : payload B7 leads/partage figé avant de finaliser les formulaires frontend.
- [ ] Point de contrôle 3 : config partagée E2E validée (`POST /leads share=true` -> `GET /config/:token` -> `/configurer?from_share=`).
- [ ] Point de contrôle 4 : fusionner les preuves de tests dans M11/B16 avant la release.

---

## 5) Définition de terminé (Ayoub)

- [ ] Toutes les tâches attribuées sont implémentées sans dérive de contrat.
- [ ] Les réponses API correspondent aux contrats de tâches Odoo et à l’intégration frontend.
- [ ] Couverture i18n FR/NL pour les champs / routes utilisateur modifiés.
- [ ] Tests unitaires / d’intégration ajoutés pour les zones attribuées.
- [ ] Notes de passation publiées (ce qui est fait, endpoints prêts, limites connues).
