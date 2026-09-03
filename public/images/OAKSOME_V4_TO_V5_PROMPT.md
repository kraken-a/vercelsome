# OAKSOME V4 → V5 — Corrections prioritaires

Revue complète du site effectuée. Voici les corrections à appliquer immédiatement, par ordre de priorité. Ne pas toucher à ce qui fonctionne déjà (nav, mega-menu, footer SVG, pre-labels, page collection Satori, escalade échantillons).

---

## PRIORITÉ 1 — Supprimer TOUS les faux témoignages et faux chiffres

C'est le point le plus urgent. Ces éléments détruisent la crédibilité auprès des professionnels.

### Homepage

Supprimer ENTIÈREMENT la section "Ils nous font confiance" qui contient :
- "127 projets livrés"
- "4.9/5 satisfaction client"  
- "98% recommandent Oaksome"
- Les 3 témoignages fictifs (Sophie D., Marc L., Claire B.)

Remplacer par UNE section sobre :

```
Pre-label : "Oaksome"
H2 : "Mobilier encastré sur mesure, fabriqué en Belgique."
Paragraphe : "Oaksome est un fabricant belge de mobilier encastré sur mesure. Quatre collections, huit types de meubles, plus de 200 000 configurations possibles. Placages bois Shinnoki, laques atelier et stratifiés HPL. Prix à partir de 1 890 €, livraison et installation incluses en Belgique et au Luxembourg."
CTA lien : "Découvrir nos matériaux →" vers /materiaux
```

Ce bloc est factuel, vérifiable, et sert aussi le référencement IA (contenu citable dense en entités).

### Page /collection-satori (et toutes les pages collection)

Supprimer le bloc en bas :
```
"150+ projets livrés. 4.9/5 satisfaction client."
```

Remplacer par :
```
Pre-label : "Projets"
H3 : "Bientôt ici : nos premières réalisations."
Texte : "Nos premiers projets clients sont en cours. Vous serez parmi les pionniers."
CTA : "Devenir client pionnier →" vers /contact
```

### Vérifier et supprimer sur TOUTES les pages

Chercher dans tout le codebase : "127", "150+", "4.8", "4.9", "satisfaction", "projets livrés", "recommandent". Supprimer chaque occurrence. Aucun chiffre de vanité ne doit rester sur le site.

---

## PRIORITÉ 2 — Page /configurer : ne plus être vide

La page configurateur est le CTA principal du site. Actuellement : un titre + rien + footer. C'est un dead-end.

Remplacer le contenu par cette structure :

```
Breadcrumb : Accueil › Configurateur

Pre-label (mono, uppercase) : "Configurateur"
H1 : "Créez votre meuble sur mesure."
Sous-titre : "Notre configurateur 3D est en cours de développement. En attendant, notre équipe vous accompagne pour concevoir votre projet."

--- Section 1 : Deux options ---

Pre-label : "Commencer votre projet"
H2 : "Deux façons d'avancer."

Split (asymétrique 7fr/5fr) :

  Carte gauche (Card L, grande) :
    Image : une ambiance intérieure
    Pre-label : "Accompagné"
    H3 : "Avec un conseiller"
    Texte : "Appelez-nous ou prenez rendez-vous. Notre équipe configure votre meuble avec vous, dimensions et finitions comprises. Devis sous 48h."
    CTA primaire : "Prendre rendez-vous →" vers /contact

  Carte droite (Card L) :
    Image : une ambiance intérieure différente
    Pre-label : "Autonome"  
    H3 : "Explorer les collections"
    Texte : "Parcourez nos quatre collections. Choisissez vos façades, finitions et poignées. Notez vos préférences et contactez-nous avec votre sélection."
    CTA ghost : "Voir les collections →" vers /collections

--- Section 2 : Wizard accessibilité + TVA (NOUVEAU) ---

Pre-label : "Préparez votre projet"
H2 : "Quelques informations pour un prix précis."
Sous-titre : "Ces éléments influencent le coût de livraison et d'installation. Vous pourrez les modifier plus tard."

ÉTAPE 1 — Type d'habitation
Titre : "Vous habitez dans…"
SelectorGrid (Card S avec icônes textuelles, pas d'emojis) :
  - Maison individuelle
  - Appartement
  - Maison en construction / rénovation

ÉTAPE 2 — Accessibilité (conditionnel)

Si Appartement sélectionné :
  Question A : "À quel étage ?"
  SelectorGrid :
    - Rez-de-chaussée
    - 1er – 2e étage
    - 3e – 5e étage
    - 6e étage ou plus
  
  Question B : "Ascenseur disponible ?"
  SelectorGrid :
    - Oui (dimensions min. 80 × 120 cm)
    - Non, escalier uniquement
    - Je ne suis pas sûr(e)

Si Maison sélectionnée :
  Question : "Accès pour la livraison ?"
  SelectorGrid :
    - Accès direct véhicule (garage, allée, jardin)
    - Distance < 20 m entre véhicule et entrée
    - Distance > 20 m ou escaliers extérieurs
    - Je ne suis pas sûr(e)

ÉTAPE 3 — Pièce de destination
Titre : "Le meuble sera installé…"
SelectorGrid :
  - Au rez-de-chaussée
  - Au 1er étage (escalier intérieur)
  - Au 2e étage ou plus
  - Sous combles / sous-pente

ÉTAPE 4 — Contraintes particulières
Titre : "Contraintes d'accès ?"
SelectorGrid (multi-select autorisé) :
  - Passage étroit (< 80 cm)
  - Virage serré dans l'escalier
  - Plafond bas (< 220 cm)
  - Aucune contrainte particulière

ÉTAPE 5 — TVA applicable
Titre : "Quel taux de TVA ?"
SelectorGrid :
  - 6 % — Bâtiment de plus de 10 ans, habitation privée
  - 21 % — Bâtiment de moins de 10 ans ou usage professionnel
  - Je ne sais pas
Sous le choix "Je ne sais pas" : lien "En savoir plus sur la TVA 6% →" vers /tva-6

--- Section 3 : Disclaimer prix ---

InfoBar (fond beige, bordure gauche fine #0C524E) :
"Le prix affiché inclut la livraison, l'installation et la TVA au taux sélectionné. Il constitue une estimation basée sur vos dimensions et vos conditions d'accès. Le prix définitif est confirmé après la visite de métré et peut varier légèrement à la hausse comme à la baisse si les dimensions réelles ou les conditions d'accessibilité diffèrent de celles indiquées."

--- Section 4 : Prochaines étapes ---

Pre-label : "Et ensuite"
H2 : "Vos prochaines étapes."

FeatureRow (3 colonnes) :
  1. "Explorer les collections" — "Quatre univers. Façades, finitions, poignées." — Lien → /collections
  2. "Commander des échantillons" — "Touchez les matériaux avant de décider." — Lien → /echantillons
  3. "Parler à un conseiller" — "On configure votre projet ensemble." — Lien → /contact
```

Le wizard doit stocker les réponses en state React (useState). Pas de soumission serveur — c'est du prototype. Les réponses s'affichent dans un récap sous le wizard.

---

## PRIORITÉ 3 — Créer /etudes-de-cas (hub portfolio)

C'est la première page qu'un architecte cherche. Même sans projets réels, la page doit exister.

```
Breadcrumb : Accueil › Réalisations

Pre-label : "Réalisations"
H1 : "Nos projets."
Sous-titre : "Chaque projet est unique. Voici comment nous transformons les espaces de nos clients."

--- État actuel : pas encore de projets ---

Section centrée (exception au left-align — c'est un état vide) :
  Illustration ou image d'ambiance sobre
  H2 : "Nos premières réalisations arrivent bientôt."
  Texte : "Nous travaillons actuellement sur nos premiers projets clients. Cette page accueillera bientôt des études de cas détaillées : brief, solution, visuels avant/après et retour client."
  CTA primaire : "Devenir client pionnier →" vers /contact
  CTA ghost : "Voir les collections →" vers /collections

--- Section : À quoi ressemblera un projet ---

Pre-label : "Ce que vous verrez ici"
H2 : "Le format d'une étude de cas Oaksome."

FeatureRow (4 colonnes) :
  1. "Brief client" — "Le besoin, les contraintes, le budget."
  2. "Solution" — "Collection choisie, dimensions, aménagement intérieur."
  3. "Visuels" — "Photos avant/après, détails de finition."
  4. "Retour client" — "Ce qu'ils en pensent après 3 mois d'utilisation."
```

Ajouter le lien dans le footer sous "Entreprise" : "Réalisations" → /etudes-de-cas.
Mettre à jour le lien sur la homepage (section étude de cas Dubois) : pointer vers /etudes-de-cas au lieu de /etude-de-cas.

---

## PRIORITÉ 4 — Fix localisation anglais → français

Sur la homepage, sous les 4 product cards, remplacer :

```
"Discover" → "Découvrir"
"All our products →" → "Voir tous les meubles →"
```

Chercher dans TOUT le codebase les mots anglais résiduels : "Discover", "All our products", "Learn more", "Read more", "View all", "Load more", "Submit". Remplacer par les équivalents français.

---

## PRIORITÉ 5 — Fix liens cassés

### Page /collection-satori (et toutes les pages collection)
"Commander des échantillons" pointe vers `#` → remplacer par `/echantillons`

### Vérification globale
Chercher dans tout le codebase : `href="#"` ou `href=""`. Chaque occurrence est soit un lien à corriger, soit un lien à retirer temporairement. Lister toutes les occurrences et les corriger.

---

## POLISH — À faire après les 5 priorités

### A. Typo mono sur les prix et dimensions

Tous les prix et toutes les dimensions doivent être en `font-mono tabular-nums` :

```jsx
// Prix
<span className="font-mono tabular-nums">4 890 €</span>

// Dimensions  
<span className="font-mono text-sm text-gray-500 tabular-nums">L 200 × H 240 × P 60 cm</span>

// Badges numériques
<span className="font-mono text-xs">+4</span>
```

Appliquer sur : toutes les Card L (homepage, collection pages), toutes les Card M avec prix, la page /tva-6 (montants), la page /materiaux (si prix mentionnés).

Le signe × dans les dimensions doit être le vrai signe multiplication (×), pas la lettre x.

### B. Badges en texte pur, pas en pills

Vérifier que "Essentiel", "Premium", "Nouveau", "Basiques" sont bien en :
```jsx
<span className="font-mono text-xs uppercase tracking-[0.1em] text-gray-500">Essentiel</span>
```
Et PAS en pills colorées avec `bg-*`, `rounded-full`, `px-3 py-1`.

### C. Breadcrumb sur /configurer

Ajouter le breadcrumb : `Accueil › Configurateur`

### D. Page Satori : "A partir de" → "À partir de"

L'accent grave manque sur le À dans la section "8 types de meubles" : "A partir de 3 490 €" → "À partir de 3 490 €". Vérifier sur toutes les pages.

### E. Lien "Blog" → "Journal"

Le footer V4 dit déjà "Journal" — vérifier que c'est cohérent partout. Le mot "Blog" ne doit apparaître nulle part (trop générique pour un positionnement premium).

---

## Checklist finale V5

```
□ AUCUN faux témoignage ni faux chiffre sur le site ?
□ Page /configurer a du contenu (wizard + alternatives) ?
□ Page /etudes-de-cas existe (même en état vide) ?
□ AUCUN texte en anglais résiduel ?
□ AUCUN lien href="#" résiduel ?
□ Prix en font-mono tabular-nums ?
□ Badges en texte uppercase, pas en pills ?
□ "À partir de" avec accent grave partout ?
□ Breadcrumb sur /configurer ?
□ Lien échantillons fonctionnel sur les pages collection ?
```
