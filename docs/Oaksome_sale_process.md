**OAKSOME**

Customer Success Management

Process & Dashboard — Spécifications fonctionnelles Odoo

Version 7.0 — Mars 2026

Owner : Dorian Dormal — Fox Ventures Holding

**Confidentiel — Usage interne uniquement**

# **Table des matières**

1. Contexte et objectifs

2. Architecture Odoo : CRM → SO1 → SO2

3. Synthèse du funnel (6 étapes)

4. Détail par étape

4.1 Intérêt — CRM Lead

4.2 Contact — CRM Opportunité

4.3 Échantillons — CRM + SO échantillons

4.4 Commande — SO1 + Signature CGV + Évaluation accès

4.5 Validation — SO2 commande définitive + Fabrication

4.6 Livraison & Pose

5. Schéma de facturation (SO1 acompte 50 % + SO2 90/10)

6. Signatures Odoo Sign (CGV + TVA 6 % au SO1)

7. Évaluation conditions de livraison

8. KPIs et alertes

9. Structure du dashboard Odoo

10. Organisation CSM

11. Intégrations techniques

12. Règles d’automatisation

13. Annexes

# **1. Contexte et objectifs**

Ce document décrit le processus complet de gestion de la relation client Oaksome, de la première interaction sur le site jusqu’à la livraison et pose du meuble. Il constitue le cahier des charges fonctionnel pour la configuration d’Odoo.

## **Objectifs**

* **Structurer** le parcours client en 6 étapes claires et mesurables.
* **Outiller** les 2 CSM avec un dashboard unique dans Odoo.
* **Automatiser** les relances et alertes.
* **Sécuriser** la trésorerie avec un acompte SO1 (50 %) non remboursable + SO2 commande définitive (90/10).
* **Mesurer** la performance du funnel avec des KPIs actionnables.

## **Principes directeurs**

Le client sait quoi, quand et à quel prix. Pas de mauvaises surprises : les conditions d’accès livraison sont évaluées en amont, le prix final est confirmé après mesures via SO2 (commande définitive), et les documents légaux sont signés aux bons moments via Odoo Sign.

# **2. Architecture Odoo : CRM → SO1 → SO2**

Le parcours traverse trois zones dans Odoo :

|  |
| --- |
| **📌 ZONE CRM — Pré-vente (Leads & Opportunités)** |

* **Étape 1 — Intérêt :** favori/panier → Lead CRM.
* **Étape 2 — Contact :** WhatsApp/chat → Opportunité CRM.
* **Étape 3 — Échantillons :** opportunité + SO échantillons (commande gratuite).

|  |
| --- |
| **📌 ZONE VENTES + FIELD SERVICE — SO1 + FS-MESURES** |

* **Étape 4 — Commande :** CRM Gagné. SO1 créé avec article acompte (50 % prix estimé, non remboursable) + 2 produits Service FS. Signatures CGV + TVA 6 % (si applicable) via Odoo Sign. Acompte facturé au bon taux. Projet FS créé automatiquement. Client réserve son créneau de mesures via Appointments.

|  |
| --- |
| **📌 ZONE VENTES — SO2 Commande définitive + Fabrication** |

* **Étape 5 — Validation :** SO2 définitif créé (meuble final − acompte + manutention). Facture SO2 pour atteindre 90 % du prix final. PO drop-ship Wood Cam. Fabrication.
* **Étape 6 — Livraison & Pose :** tâche FS-POSE activée. PO sous-traitant pose. Livraison drop-ship Wood Cam. Signature client. Facture SO2 10 % solde.

## **Principe des deux Sales Orders**

**SO1 (Acompte) :** contient un article de type Service « Acompte Oaksome » égal à 50 % du prix estimé par le configurateur. Non remboursable. La description mentionne le meuble configuré et le prix estimé total. Contient aussi les 2 produits Service FS (mesures + pose). Aucun produit stockable, aucune livraison, aucun PO déclenché. Facturé 100 % immédiatement.

**SO2 (Commande définitive) :** créé après mesures et validation du plan. Contient le produit meuble définitif (Stockable, XML imos corrigé, prix final) + ligne « Déduction acompte SO1 » (montant négatif) + supplément manutention si applicable. La confirmation déclenche le PO drop-ship vers Wood Cam. Facturé en 2 jalons : montant pour atteindre 90 % du prix final, puis 10 % après pose.

**Le net SO2 est toujours positif :** l’acompte de 50 % garantit que le solde à payer sur SO2 reste toujours supérieur à zéro. Pas de credit note dans le flux normal.

## **Schéma récapitulatif**

|  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- |
| **Étape** | **Nom** | **Objet Odoo** | **Paiement** | **Signatures** | **Field Service** |
| **1** | **Intérêt** | CRM Lead | — | — | — |
| **2** | **Contact** | CRM Opportunité | — | — | — |
| **3** | **Échantillons** | CRM + SO éch. | — | — | — |
| **4** | **Commande** | SO1 (acompte) | Acompte 50 % | CGV+TVA6% | FS-MESURES |
| **5** | **Validation** | SO2 (définitif) | SO2→90 % | — | — |
| **6** | **Livr. & Pose** | BL + Facture | SO2→10 % | — | FS-POSE |

# **3. Synthèse du funnel**

|  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- |
| **#** | **Étape** | **Déclencheur** | **Acteur** | **Paiement** | **Zone Odoo** |
| **1** | **Intérêt** | Favori / Panier | Site (auto) | Aucun | CRM Lead |
| **2** | **Contact** | WhatsApp / Chat | CSM | Aucun | CRM Opp. |
| **3** | **Échantillons** | Demande éch. | CSM | Gratuit [AC] | CRM + SO |
| **4** | **Commande** | Commande | CSM | Acompte 50% | Ventes SO1 |
| **5** | **Validation** | Plan approuvé | CSM + Tech. | SO2→90% | SO2+Fab |
| **6** | **Livr. & Pose** | Meuble posé | CSM + Install. | SO2→10 % | Inventaire |

*[AC] = À confirmer : échantillons gratuits ou frais de port facturés.*

# **4. Détail par étape**

|  |
| --- |
| **ZONE CRM** |

|  |  |
| --- | --- |
| **1** | **INTÉRÊT — Favori / Panier** |

**Description**

Le visiteur ajoute un meuble configuré dans ses favoris ou panier. Un Lead CRM est créé automatiquement (email requis pour sauvegarder).

**Objet Odoo**

**CRM → Lead. Aucun Sales Order.**

**Actions CSM**

* **Relance auto J+1 :** email « Votre projet vous attend ».
* **Relance auto J+3 :** email « Une question ? » + invitation WhatsApp/chat.
* **Relance manuelle J+7 :** contact direct si panier > seuil.

**Données sur le Lead CRM**

* Email, produit(s) sauvegardé(s), montant estimé du panier
* UTM (source, medium, campaign)
* CSM assigné (round-robin)

**Pipeline CRM**

* Colonne : « Intérêt » — Probabilité : 10 %

**KPIs**

* Leads créés / semaine, taux Intérêt → Contact, panier moyen

|  |  |
| --- | --- |
| **2** | **CONTACT — WhatsApp / Chat** |

**Description**

Premier contact humain. Le CSM qualifie le besoin et oriente le prospect.

**Objet Odoo**

**CRM → Opportunité (Lead converti). Aucun Sales Order.**

**Actions CSM**

* **Répondre sous 2h** (SLA).
* **Qualifier :** type de projet, pièce, dimensions, budget, timing.
* **Conseiller :** collection, finition, réponses techniques.
* **Proposer :** échantillons ou commande directe.

**Données sur l’Opportunité**

* Canal de contact, type de projet, budget estimé, timing, score (Chaud/Tiède/Froid)

**Pipeline CRM**

* Colonne : « Contact » — Probabilité : 25 %

**KPIs**

* Temps de réponse (< 2h), contacts qualifiés / semaine, taux Contact → Commande

|  |
| --- |
| **ZONE DE TRANSITION — CRM + VENTES** |

|  |  |
| --- | --- |
| **3** | **ÉCHANTILLONS — Opportunité CRM + SO échantillons** |

**Description**

Le prospect demande des échantillons. L’opportunité CRM reste ouverte. Un SO spécifique est créé pour le flux logistique.

**Objets Odoo**

**CRM :** Opportunité → étape « Échantillons » (probabilité : 40 %).

**Ventes :** SO « SAMP-KIT » créé depuis l’opportunité. Prix : 0 € [AC].

**Actions CSM**

* **Créer le SO échantillons** depuis l’opportunité (bouton « Nouveau devis »).
* **Suivre l’expédition** et informer le prospect.
* **Relancer J+5** après réception.

**KPIs**

* Kits expédiés / semaine, délai expédition (< 48h), taux Échantillons → Commande

|  |
| --- |
| **ZONE VENTES + FIELD SERVICE — SO1 + FS-MESURES** |

|  |  |
| --- | --- |
| **4** | **COMMANDE — SO1 + CGV + Évaluation accès + Paiement 50 %** |

**Description**

Le client passe commande. CRM Gagné. SO1 créé avec un article « Acompte Oaksome » (50 % du prix estimé, type Service) + SRV-MESURES + SRV-POSE. La description de l’acompte mentionne le meuble configuré, le prix estimé total, et la clause de non-remboursement. Le CSM envoie CGV + attestation TVA 6 % (si applicable) via Odoo Sign. Après signatures, taux TVA configuré, SO1 confirmé. Acompte facturé au bon taux. Projet FS créé avec 2 tâches. Lien booking mesures envoyé au client.

**Objets Odoo**

**CRM :** Opportunité → « Gagné ».

**Ventes :** SO1 créé depuis l’opportunité. Statut : Devis → Confirmé (après signature CGV + paiement).

**Odoo Sign :** CGV + attestation TVA 6 % (si applicable) envoyées ensemble. Le SO1 ne peut être confirmé qu’après signature(s) reçue(s). Le taux TVA est configuré sur le SO1 avant confirmation.

**Facturation :** Facture d’acompte 50 % générée à la confirmation du SO1.

**Field Service :** projet FS dédié créé automatiquement avec 2 tâches. FS-MESURES est planifiable immédiatement. FS-POSE reste en statut « En attente » jusqu’à la fin de fabrication.

**Séquence d’actions CSM**

|  |  |  |  |
| --- | --- | --- | --- |
| **#** | **Action** | **Détail** | **Odoo** |
| **4a** | **Créer SO1** | Depuis l’opportunité CRM, produit + dimensions configurateur | Ventes |
| **4b** | **Envoyer CGV à signer** | Template Odoo Sign pré-configuré | Odoo Sign |
| **4c** | **Évaluer conditions accès** | Envoyer checklist au client (photos + questions) | Chatter SO1 |
| **4d** | **Analyser checklist** | Déterminer si supplément manutention nécessaire | Champ SO1 |
| **4e** | **Informer le client** | Si supplément : prévenir avant confirmation | Email/WhatsApp |
| **4f** | **Confirmer SO1** | Après signature CGV reçue | Ventes |
| **4g** | **Encaisser 50 %** | Vérifier paiement de l’acompte | Facturation |
| **4h** | **Invitation portail client** | Email auto avec accès portail Odoo (commandes, factures, documents) | Portail |
| **4i** | **Lien booking mesures envoyé au client** | Email auto avec lien Appointments (intégré oaksome.com) | Appointments |
| **4j** | **Client réserve son créneau** | Self-service sur oaksome.com, synchro calendrier technicien | Appointments |
| **4k** | **Technicien exécute mesures** | App mobile FS : relevé + photos + checklist accès | Field Service |
| **4l** | **CSM récupère rapport FS** | Mesures + observations + accès validés | Field Service |

**Évaluation des conditions d’accès livraison**

L’évaluation est faite par le CSM en amont (photos + questionnaire client), puis validée ou corrigée par le technicien lors de la visite de mesures via la tâche FS-MESURES (app mobile).

Si les conditions nécessitent une manutention spéciale (monte-meuble, équipe supplémentaire, accès difficile), le CSM en informe le client immédiatement. Le supplément sera chiffré et intégré dans le SO2, au même moment que le delta de dimensions. Le client est prévenu du principe dès l’étape 4.

**Checklist conditions d’accès (champs sur tâche FS-MESURES)**

|  |  |  |
| --- | --- | --- |
| **Critère** | **Type de champ** | **Valeurs / Détail** |
| **Étage** | **Integer** | 0 = RDC, 1, 2, 3... |
| **Ascenseur disponible** | **Booléen** | Oui / Non |
| **Dimensions ascenseur (L×P×H)** | **Char** | En cm, si applicable |
| **Largeur passage le plus étroit** | **Integer** | En cm (porte, couloir, escalier) |
| **Escalier à emprunter** | **Sélection** | Aucun / Droit / Courbe / Colimaçon |
| **Parking livraison** | **Sélection** | Devant porte / < 50m / > 50m / Difficile |
| **Photos accès** | **Pièces jointes** | Entrée, couloir, escalier, porte pièce |
| **Supplément manutention prévu** | **Booléen** | Oui / Non |
| **Commentaire accès** | **Texte** | Notes CSM |

**KPIs**

* Commandes / semaine, montant moyen SO1, délai commande → mesures (< 7j)
* Taux d’encaissement 50 % dans les 48h
* % de commandes avec supplément manutention

|  |
| --- |
| **ZONE VENTES — SO2 COMMANDE DÉFINITIVE + FABRICATION** |

|  |  |
| --- | --- |
| **5** | **VALIDATION — SO2 commande définitive + Fabrication** |

**Description**

Après les mesures (rapport FS-MESURES), le bureau technique prépare le plan final avec les dimensions corrigées et le XML imos définitif. Le client valide. Le CSM crée SO2 (commande définitive) sous le même projet FS : produit meuble stockable (prix final) + ligne déduction acompte SO1 + supplément manutention si applicable. La confirmation du SO2 déclenche le PO inter-company drop-ship vers Wood Cam. Facture SO2 émise pour le montant permettant d’atteindre 90 % du prix final.

**Objets Odoo**

**Ventes :** SO2 créé sous le même projet FS que SO1. Lignes : produit meuble définitif (Stockable, XML imos) + déduction acompte + manutention.

**Achats :** PO drop-ship vers Wood Cam, déclenché automatiquement à la confirmation SO2 via route drop-ship.

**Facturation :** Facture SO2 #1 (montant = 90 % prix final − acompte SO1).

**Fonctionnement du SO2**

* **Ligne 1 :** Produit meuble définitif (Stockable, XML imos corrigé, prix final complet).
* **Ligne 2 :** « Déduction acompte SO1 » (montant négatif = −acompte payé).
* **Ligne 3 :** Supplément manutention (si applicable).
* **Net SO2 =** prix final − acompte + manutention. Toujours positif.
* **PO Wood Cam :** déclenché automatiquement à la confirmation SO2 via route drop-ship. Wood Cam livre directement au client final.

**Séquence d’actions CSM**

|  |  |  |  |
| --- | --- | --- | --- |
| **#** | **Action** | **Détail** | **Module** |
| **5a** | **Envoyer plan final au client** | Email avec PDF ou lien 3D | Chatter SO1 |
| **5b** | **Gérer les ajustements** | Max. 2 itérations ; au-delà, signaler délai | Chatter SO1 |
| **5c** | **Obtenir validation écrite** | Email ou signature digitale | Chatter SO1 |
| **5d** | **Créer SO2 (commande définitive)** | Meuble final + déduction acompte + manutention | Ventes |
| **5e** | **Confirmer SO2** | Déclenche PO drop-ship Wood Cam | Ventes + Achats |
| **5f** | **Émettre facture SO2 #1** | Montant = 90 % prix final − acompte SO1 | Facturation |
| **5g** | **Communiquer planning livraison** | Date prévisionnelle au client | Email |

**KPIs**

* Délai mesures → validation plan (< 10 jours)
* Nb itérations moyennes par projet
* % de projets avec SO2, montant moyen du delta
* Taux d’encaissement dans les 5 jours
* OTD (respect délai fabrication)

|  |
| --- |
| **ZONE FIELD SERVICE — LIVRAISON & POSE** |

|  |  |
| --- | --- |
| **6** | **LIVRAISON & POSE — FS-POSE + Paiement SO2 10 %** |

**Description**

Le meuble est fabriqué. Le CSM active la tâche FS-POSE, envoie le lien de réservation pose au client (Odoo Appointments intégré à oaksome.com) (passage de « En attente » à « À planifier ») et crée un PO (bon de commande fournisseur) vers le sous-traitant installateur. Le sous-traitant livre, pose, remplit le rapport d’intervention via l’app mobile, fait signer le client sur tablette, et note la snag list. La signature client déclenche la facture SO2 10 % solde. Les conditions d’accès ont été validées en amont (étape 4 + FS-MESURES).

**Sous-étapes**

|  |  |  |  |
| --- | --- | --- | --- |
| **#** | **Sous-étape** | **Action CSM** | **Odoo** |
| **6a** | **Activer FS-POSE** | Passer de En attente à À planifier | Field Service |
| **6b** | **Lien booking pose envoyé** | Client choisit son créneau sur oaksome.com | Appointments |
| **6c** | **Créer PO sous-traitant pose** | PO vers installateur, lié au projet FS | Achats |
| **6d** | **Confirmer planning** | CSM confirme date + assigne sous-traitant | FS + Planning |
| **6e** | **Expédition (drop-ship Wood Cam)** | Transfert direct Wood Cam → client | Inventaire |
| **6f** | **Livraison + Pose** | Sous-traitant sur site, app mobile FS | Field Service |
| **6g** | **Rapport + photos** | Sous-traitant remplit rapport intervention | Field Service |
| **6h** | **Snag list** | Points à corriger notés dans FS-POSE | Field Service |
| **6i** | **Signature client** | Client signe sur tablette (preuve légale) | Field Service |
| **6j** | **Facture solde SO2 #2 (10 %)** | 10 % du prix final, déclenchée par signature | Facturation |
| **6k** | **Valider PO sous-traitant** | Confirmer réception prestation | Achats |

**Suivi post-pose**

* **J+7 :** email satisfaction + demande photo UGC.
* **J+30 :** email parrainage + demande avis Google.
* **Snag list :** documentée dans la tâche FS-POSE. Le 10 % solde (facture SO2 #2) n’est émis qu’après résolution. La tâche FS-POSE reste ouverte jusqu’à clôture.

**KPIs**

* OTD, snag lists / projets, délai résolution, NPS, délai encaissement 10 %

# **5. Schéma de facturation**

## **SO1 — Acompte (50 % du prix estimé)**

|  |  |  |  |
| --- | --- | --- | --- |
| **Jalon** | **Montant** | **Déclencheur** | **Détail** |
| **Facture unique** | **50 % du prix estimé** | Confirmation SO1 (après signatures CGV + TVA 6 %) | Acompte non remboursable. Article type Service. |

## **SO2 — Commande définitive (prix final − acompte)**

|  |  |  |  |
| --- | --- | --- | --- |
| **Jalon** | **Montant** | **Déclencheur** | **Détail** |
| **Facture SO2 #1** | **90 % prix final − acompte SO1** | Confirmation SO2 (plan validé) | Déclenche PO drop-ship Wood Cam |
| **Facture SO2 #2** | **10 % du prix final** | Signature client après pose (FS-POSE) | Solde final, clôture projet |

## **Exemple chiffré**

Prix estimé configurateur : 5 000 €. Acompte SO1 : 2 500 € (50 %). Prix final après mesures : 5 500 € + 200 € manutention = 5 700 €. SO2 ligne 1 : meuble 5 700 €. SO2 ligne 2 : déduction acompte −2 500 €. Net SO2 : 3 200 €. Facture SO2 #1 : 90 % × 5 700 − 2 500 = 2 630 €. Facture SO2 #2 (après pose) : 10 % × 5 700 = 570 €. Total payé : 2 500 + 2 630 + 570 = 5 700 €.

## **Résumé trésorerie**

Avant livraison : acompte SO1 (50 % estimé) + facture SO2 #1 = 90 % du prix final encaissé. Les 10 % restants sont le levier qualité du client après pose.

**Configuration Odoo**

* SO1 : pas de condition de paiement spécifique (facture unique 100 % de l’acompte).
* SO2 : le CSM calcule le montant de la facture #1 (90 % prix final − acompte) et crée la facture manuellement. La facture #2 (10 %) est créée après pose.
* Facture acompte SO1 : générée automatiquement à la confirmation SO1.

**Point juridique**

Biens fabriqués sur mesure exemptés du droit de rétractation de 14 jours (art. VI.53, 3° Code de droit économique belge). À mentionner dans les CGV signées via Odoo Sign.

# **6. Signatures Odoo Sign**

Deux documents nécessitent une signature électronique du client via Odoo Sign :

## **6.1 Conditions Générales de Vente (CGV)**

* **Quand :** avant la confirmation du SO1 (étape 4).
* **Condition bloquante :** oui. Le SO1 ne peut pas être confirmé tant que la signature n’est pas reçue.
* **Template Odoo Sign :** document pré-configuré avec champs dynamiques (nom client, référence SO, date).
* **Contenu clé des CGV :** exemption du droit de rétractation (sur mesure), acompte 50 % non remboursable + solde via SO2, délais indicatifs, conditions de livraison et pose, garantie, traitement des données.
* **Stockage :** le document signé est automatiquement attaché au SO1 dans le chatter.

## **6.2 Attestation TVA 6 % (conditionnelle)**

* **Quand :** en même temps que les CGV, avant confirmation du SO1 (étape 4). Bloquant si applicable.
* **Condition :** logement > 10 ans, usage privé (particulier).
* **Pourquoi au SO1 :** l’attestation doit être signée AVANT la première facture, sinon la facture acompte sort à 21 % et il faut une credit note. En signant au SO1, le taux est correct dès le départ.
* **Template Odoo Sign :** formulaire SPF Finances pré-rempli (nom, adresse chantier, année de construction).
* **Effet dans Odoo :** après réception, le CSM configure la position fiscale « TVA 6 % rénovation » sur le SO1 avant confirmation. Le SO2 hérite du même taux via le client.
* **Stockage :** le document signé est automatiquement attaché au SO1 dans le chatter.

# **7. Réservation en ligne (Odoo Appointments)**

Le module Odoo Appointments permet aux clients de réserver eux-mêmes leurs créneaux de mesures et de pose, directement depuis le site oaksome.com. Cela élimine les allers-retours de planification entre le CSM et le client.

## **7.1 Principe**

Deux types de rendez-vous sont configurés dans Odoo Appointments, chacun avec ses propres disponibilités, durées et questions :

|  |  |  |  |
| --- | --- | --- | --- |
| **Type de RDV** | **Déclencheur** | **Durée** | **Ressource** |
| **Prise de mesures** | **Confirmation SO1 + paiement 50 %** | 1h30 | Technicien mesureur |
| **Livraison & Pose** | **Fabrication terminée + FS-POSE activée** | 3h (ajustable) | Installateur / sous-traitant |

## **7.2 Intégration oaksome.com**

Le booking est intégré dans le site oaksome.com (portail client ou page dédiée). Le client ne quitte pas l’univers Oaksome pour réserver. L’intégration se fait via iframe ou API Odoo Appointments.

|  |  |  |
| --- | --- | --- |
| **Élément** | **Détail** | **Technique** |
| **Page de booking** | **Embedée dans oaksome.com (iframe ou composant)** | API Odoo / iframe |
| **Disponibilités** | **Calculées depuis le calendrier des techniciens/installateurs** | Odoo Appointments natif |
| **Rappels auto** | **Email + WhatsApp J-2 et J-1 avant le RDV** | Odoo Appointments natif |
| **Annulation / report** | **Le client peut modifier selon les conditions définies** | Configurable par type |
| **Synchro calendrier** | **Le RDV apparaît dans le calendrier du technicien + Outlook/Google** | Odoo Calendrier |

## **7.3 Parcours client**

**Mesures**

* SO1 confirmé → email automatique avec bouton « Choisir votre créneau de mesures ».
* Le client clique → page de booking sur oaksome.com → voit les créneaux disponibles → réserve.
* Le technicien voit le RDV dans son calendrier. La tâche FS-MESURES est mise à jour.
* Rappels automatiques J-2 et J-1.

**Pose**

* Fabrication terminée → CSM active FS-POSE → email automatique avec bouton « Choisir votre créneau de livraison ».
* Même parcours : le client réserve sur oaksome.com.
* Le CSM crée le PO sous-traitant avec la date choisie par le client.

## **7.4 Configuration Odoo Appointments**

* Créer 2 types de rendez-vous : « Oaksome — Prise de mesures » et « Oaksome — Livraison & Pose ».
* Configurer les disponibilités par employé/ressource (techniciens, installateurs).
* Ajouter des questions au formulaire de booking : adresse de livraison, étage, accès, photos (pour les mesures).
* Définir la durée, le padding entre RDV, et le délai minimum de réservation.
* Activer les rappels email/WhatsApp.
* Configurer les conditions d’annulation (ex: pas d’annulation < 48h).

## **7.5 Avantage pour le CSM**

Le CSM n’a plus à appeler le client pour trouver une date. Il envoie le lien et le client réserve en self-service. Le CSM voit les réservations dans son dashboard et se concentre sur la coordination technique et la qualité du service.

# **8. Field Service : tâches terrain**

Le module Odoo Field Service structure les deux interventions physiques : prise de mesures et livraison/pose.

## **8.1 Avantages vs. Calendrier + Chatter**

|  |  |  |
| --- | --- | --- |
| **Fonctionnalité** | **Sans Field Service** | **Avec Field Service** |
| **Planning techniciens** | **Calendrier générique** | Vue dédiée par technicien |
| **Rapport intervention** | **Notes dans chatter SO** | Formulaire structuré + photos mobile |
| **Checklist accès** | **Champs custom SO1** | Intégrée dans tâche FS |
| **Snag list** | **Champ texte SO1** | Structurée dans FS-POSE |
| **Signature client** | **Email confirmation** | Signature tablette (preuve légale) |
| **Temps passé** | **Non tracké** | Automatique (app mobile) |
| **App mobile terrain** | **Non** | Oui (natif Odoo) |

## **8.2 Configuration**

**Types de tâches**

* SRV-MESURES : produit Service, prix 0 €, Create on Order → Project & Task, template FS Oaksome. Durée par défaut : 1h30.
* SRV-POSE : produit Service, prix 0 €, Create on Order → Project & Task, même template. Durée par défaut : 3h (ajustable).

**Création automatique**

* **Les 2 tâches :** créées nativement à la confirmation du SO1 par les produits Service. Un projet FS dédié au client est créé automatiquement.
* **FS-POSE :** créée en statut « En attente ». Le CSM l’active manuellement quand la fabrication est terminée.

**Workflow**

* Créée (auto) → Planifiée (CSM) → En cours (technicien) → Terminée (rapport rempli).
* FS-POSE : En attente → À planifier (CSM active après fab.) → Planifiée → En cours → Terminée. Signature client obligatoire.

**Lien SO → Field Service**

Le projet FS est créé depuis le SO1 (smart button « Tasks »). Le SO2 est rattaché au même projet via le champ « Projet » ou « Compte analytique ». Le PO sous-traitant pose et le PO Wood Cam sont liés au même compte analytique. Cela permet de consolider tous les revenus et coûts du client dans un seul projet.

**App mobile**

Techniciens et installateurs utilisent l’app mobile Odoo FS sur tablette : tâches, rapports, photos, signature client.

**Sous-traitance pose (PO)**

La pose est principalement sous-traitée. Le CSM crée un Purchase Order (PO) vers le sous-traitant installateur quand la fabrication est terminée. Le PO est lié au projet FS du client.

|  |  |  |
| --- | --- | --- |
| **Élément** | **Module Odoo** | **Détail** |
| **Fournisseur installateur** | **Contacts + Achats** | Fiche fournisseur avec tarifs négociés |
| **Produit sous-traitance** | **Achats** | SRV-POSE-ST : prestation pose, unité = forfait ou heure |
| **PO créé par le CSM** | **Achats** | Lié au projet FS du client, référence SO1 |
| **Réception prestation** | **Achats** | Validée après pose + signature client |
| **Facture fournisseur** | **Facturation** | Rapprochée avec le PO |

Si ponctuellement la pose est réalisée en interne, le poseur logue ses heures en timesheet sur la tâche FS-POSE (pas de PO dans ce cas).

# **9. Évaluation conditions de livraison**

## **Principe**

L’évaluation des conditions d’accès est réalisée par le CSM à l’étape 4, avant la confirmation du SO1. Elle est basée sur des photos et un questionnaire envoyés au client. Elle ne dépend pas de la visite de mesures (qui intervient après).

## **Objectif**

Zéro surprise à la livraison. Si les conditions nécessitent une manutention spéciale, le client est informé dès l’étape 4. Le supplément est chiffré et intégré dans le SO2.

## **Checklist standardisée**

Les champs suivants sont intégrés dans la tâche FS-MESURES. Le CSM les pré-remplit (photos/réponses client), le technicien les valide ou corrige sur site via l’app mobile :

|  |  |  |
| --- | --- | --- |
| **Critère** | **Type** | **Valeurs** |
| **Étage de livraison** | **Integer** | 0 = RDC, 1, 2, 3... |
| **Ascenseur** | **Booléen** | Oui / Non |
| **Dimensions ascenseur (L×P×H cm)** | **Char** | Libre, si ascenseur = Oui |
| **Largeur passage min. (cm)** | **Integer** | Porte, couloir ou escalier le plus étroit |
| **Type d’escalier** | **Sélection** | Aucun / Droit / Courbe / Colimaçon |
| **Parking livraison** | **Sélection** | Devant porte / < 50m / > 50m / Difficile |
| **Photos accès** | **Pièces jointes** | Entrée, couloir, escalier, porte pièce |
| **Supplément manutention prévu** | **Booléen** | Oui / Non (déterminé par le CSM) |
| **Montant supplément estimé** | **Monétaire** | € (si applicable, reporté dans SO2) |
| **Commentaire accès** | **Texte** | Notes CSM libres |

## **Règles de déclenchement du supplément**

Le CSM détermine le supplément sur base de la checklist. Règles indicatives :

* Étage > 2 sans ascenseur → supplément probable.
* Passage < 70 cm → évaluation au cas par cas (le meuble peut-il passer ?).
* Escalier colimaçon + étage > 1 → supplément quasi certain (monte-meuble).
* Parking > 50m ou difficile → supplément possible.

Les montants de supplément doivent être définis dans une grille tarifaire interne [A CONFIGURER].

# **10. Portail client**

Le portail client Odoo est l’interface par laquelle le client suit son projet Oaksome de bout en bout. Il renforce la promesse « peace of mind » en offrant une visibilité complète sur l’avancement, les documents et les paiements.

## **10.1 Éléments visibles par le client**

|  |  |  |
| --- | --- | --- |
| **Élément** | **Ce que le client voit** | **Module Odoo** |
| **Sales Orders** | **SO1 (acompte) + SO2 (commande définitive) avec statut, lignes, montants** | Ventes (portail natif) |
| **Factures** | **Toutes les factures (acompte SO1, SO2 #1, SO2 #2) avec statut et bouton payer en ligne** | Facturation (portail natif) |
| **Tâches Field Service** | **FS-MESURES + FS-POSE : date planifiée, statut, rapport d’intervention (post-clôture)** | Field Service (portail) |
| **Documents signés** | **CGV + attestation TVA 6 % signées, téléchargeables** | Odoo Sign (portail natif) |
| **Rendez-vous** | **Créneaux réservés (mesures + pose), possibilité de modifier/annuler** | Appointments (portail) |

## **10.2 Éléments NON visibles par le client**

* Opportunités CRM (objet interne, pré-vente)
* PO vers Wood Cam et sous-traitant pose (coûts internes)
* Marges, notes internes, score de qualification
* Projet FS en tant que tel (le client voit les tâches, pas le projet)

## **10.3 Tracker d’avancement projet**

Un tracker visuel est intégré au portail client pour montrer où en est le projet. Il matérialise les étapes clés et leur statut en temps réel. Cohérent avec la promesse Oaksome : « le client sait quoi, quand et à quel prix ».

> **Note :** Le champ `oaksome_status` sur `sale.order` a 9 états internes (voir [data-model](data-model.md)). Les 7 étapes ci-dessous sont une vue simplifiée pour le client, mappée depuis ces 9 états.

**Étapes affichées dans le tracker**

|  |  |  |  |
| --- | --- | --- | --- |
| **#** | **Étape client** | **Statut** | **Source Odoo** |
| **1** | **Commande confirmée** | ✅ / ⏳ | SO1 confirmé |
| **2** | **Acompte payé** | ✅ / ⏳ | Facture SO1 payée |
| **3** | **Prise de mesures** | ✅ / 📅 [date] / ⏳ | FS-MESURES statut |
| **4** | **Plan validé** | ✅ / ⏳ | SO2 créé |
| **5** | **En fabrication** | ✅ / ⏳ | PO Wood Cam confirmé |
| **6** | **Livraison et pose** | ✅ / 📅 [date] / ⏳ | FS-POSE statut |
| **7** | **Projet terminé** | ✅ / ⏳ | FS-POSE terminée + facture solde payée |

**Implémentation technique**

* Le tracker est un widget personnalisé dans le portail Odoo, affiché en haut de la page projet du client.
* Il agrège les statuts des différents objets Odoo (SO1, SO2, factures, tâches FS, PO) en une vue linéaire simplifiée.
* Chaque étape affiche un statut (terminé, en cours avec date, ou en attente) et une couleur (vert, bleu, gris).
* Développement custom requis : module Odoo personnalisé « Oaksome Portal Tracker » qui expose un endpoint calculé depuis les statuts des objets liés au projet FS du client.
* Alternative MVP : page statique dans le portail mise à jour manuellement par le CSM (champ sélection « Étape projet » sur le contact client, visible dans le portail). Moins élégant mais fonctionnel au lancement.

## **10.4 Paiement en ligne**

Le portail Odoo supporte nativement le paiement en ligne des factures via les fournisseurs de paiement configurés (Stripe, Mollie, etc.). Le client clique sur « Payer maintenant » depuis sa facture dans le portail et règle par carte ou virement.

* Activer le paiement en ligne dans Facturation → Configuration → Fournisseurs de paiement.
* Configurer au minimum un fournisseur (Stripe recommandé pour la Belgique).
* Le paiement est automatiquement rapproché avec la facture dans Odoo.
* Les 3 factures (acompte SO1, SO2 #1, SO2 #2) sont toutes payables en ligne via le portail.

## **10.5 Accès au portail**

* Le client reçoit une invitation portail automatique à la confirmation du SO1 (email avec lien de création de compte).
* Le portail est accessible depuis oaksome.com via un bouton « Mon espace » ou « Suivi de commande ».
* Le portail Odoo peut être personnalisé visuellement (logo, couleurs) pour rester cohérent avec la charte Oaksome.
* L’URL du portail peut être configurée en sous-domaine (ex: mon.oaksome.com) pour une expérience intégrée.

## **10.6 Notifications portail**

Le client reçoit des notifications par email à chaque changement de statut significatif :

* SO1 confirmé → « Votre commande est confirmée » + lien portail
* Facture émise → « Nouvelle facture disponible » + bouton payer
* FS-MESURES planifiée → « Votre rendez-vous de mesures est confirmé »
* Plan final disponible → « Votre plan est prêt à valider » + lien
* Fabrication lancée → « Votre meuble est en fabrication »
* FS-POSE planifiée → « Votre livraison est planifiée »
* Projet terminé → « Votre projet est terminé — merci ! » + demande avis

# **11. KPIs et alertes**

## **KPIs globaux**

|  |  |  |  |
| --- | --- | --- | --- |
| **KPI** | **Objectif** | **Fréquence** | **Source** |
| **Leads générés** | **> 50 / semaine** | Hebdo | CRM |
| **Taux Intérêt → Contact** | **> 20 %** | Hebdo | CRM |
| **Taux Contact → Commande** | **> 15 %** | Mensuel | CRM → Ventes |
| **Montant moyen SO1** | **[A CONFIRMER]** | Mensuel | Ventes |
| **% projets avec SO2** | **[A SUIVRE]** | Mensuel | Ventes |
| **Delta moyen SO2** | **[A SUIVRE]** | Mensuel | Ventes |
| **Délai commande → livraison** | **< 6 semaines** | Mensuel | Ventes + Fab. |
| **OTD** | **> 90 %** | Mensuel | Fabrication |
| **NPS** | **> 8/10** | Mensuel | Enquête |
| **CA mensuel (SO1 + SO2)** | **[A CONFIRMER]** | Mensuel | Facturation |
| **Temps moyen FS-MESURES** | **[A SUIVRE]** | Mensuel | Field Service |
| **Temps moyen FS-POSE** | **[A SUIVRE]** | Mensuel | Field Service |
| **% projets avec snag list** | **< 15 %** | Mensuel | Field Service |
| **Coût moyen sous-traitance pose** | **[A SUIVRE]** | Mensuel | Achats |
| **Marge projet (CA - coûts)** | **[A SUIVRE]** | Mensuel | Analytique |
| **Délai moyen encaissement** | **< 5 jours** | Mensuel | Facturation |

## **Alertes automatisées**

|  |  |  |  |
| --- | --- | --- | --- |
| **Condition** | **Délai** | **Action** | **Priorité** |
| **Lead sans contact** | **> 3 jours** | Notif CSM | ⚠️ Moyenne |
| **Opportunité sans suite** | **> 7 jours** | Notif CSM | ⚠️ Moyenne |
| **Échantillons envoyés sans retour** | **> 10 jours** | Relance auto | ⚠️ Moyenne |
| **CGV non signées** | **> 3 jours** | Notif CSM | 🚨 Haute |
| **SO1 confirmé sans mesures planifiées** | **> 5 jours** | Notif CSM | 🚨 Haute |
| **Plan envoyé sans validation** | **> 7 jours** | Notif CSM | 🚨 Haute |
| **Acompte non reçu** | **> 5 jours** | Alerte finance + CSM | 🚨 Haute |
| **Attestation TVA 6 % non signée** | **> 5 jours** | Notif CSM | 🚨 Haute |
| **Fabrication en retard** | **> 2 jours** | Notif CSM | 🚨 Haute |
| **Livraison sans facture solde 10 %** | **> 3 jours** | Notif CSM | ⚠️ Moyenne |
| **FS-MESURES non planifiée** | **> 5j après SO1** | Notif CSM | 🚨 Haute |
| **FS-POSE sans signature client** | **> 3j après pose** | Notif CSM | 🚨 Haute |
| **Snag list non résolue** | **> 14 jours** | Escalade Dorian | 🔴 Critique |

# **12. Structure du dashboard Odoo**

## **Vue 1 : Pipeline CRM (Kanban)**

4 colonnes : Intérêt → Contact → Échantillons → Gagné. Cartes : nom client, type projet, montant, jours dans l’étape. Badges rouges sur cartes en alerte. Filtre par CSM.

## **Vue 2 : Commandes en cours (Liste Ventes)**

Tous les SO1 non clôturés. Colonnes : Client, Type, Statut (À signer CGV / À mesurer / En validation / En fabrication / À livrer / Livré), Montant SO1, SO2 associé (oui/non), Acomptes reçus, Prochaine action.

## **Vue 3 : Encaissements (Tableau croisé)**

Par projet : acompte SO1 (statut), SO2 facture 1 / 90 % (statut), SO2 facture 2 / 10 % (statut). Code couleur vert = payé, orange = en attente, rouge = en retard.

## **Vue 4 : Planning (Calendrier)**

Mesures, livraisons, installations. Événements liés aux SO.

## **Vue 5 : Conversion CRM (Reporting)**

Taux de conversion par étape, opportunités gagnées/perdues, ROI par canal UTM.

## **Vue 6 : Planning terrain (Field Service)**

Vue planning native FS : tâches FS-MESURES et FS-POSE par technicien/installateur. Charge et optimisation tournées.

## **Vue 7 : Tâches terrain (Liste FS)**

Toutes les tâches FS filtrées par statut : À planifier / Planifié / En cours / Terminé. Type (Mesures/Pose) et CSM.

## **Vue 8 : Signatures en attente**

Liste des documents Odoo Sign en attente de signature : CGV et attestations TVA 6 %. Filtre par CSM. Alerte si > 3 jours sans signature.

# **13. Organisation CSM (équipe de 2)**

## **Modèle : portefeuille bout en bout**

Chaque CSM gère ses clients du Lead CRM à la livraison. Responsabilité claire, relation continue (Customer Intimacy).

**Assignation**

* Round-robin automatique sur les nouveaux leads.
* Le CSM assigné reste propriétaire de SO1 et SO2.

**Capacité**

* Lancement (mois 1-6) : 15-25 dossiers actifs par CSM.
* Croissance (mois 7-12) : 30-40. Au-delà de 40, prévoir un 3e CSM.

**Rituels**

* Daily standup (15 min), weekly review (30 min), monthly review (1h).

# **14. Intégrations techniques**

|  |  |  |  |
| --- | --- | --- | --- |
| **Source** | **Destination** | **Données** | **Méthode** |
| **Site web (panier)** | **Odoo CRM** | Email, produits, montant | API REST |
| **Site web (chat)** | **Odoo Live Chat** | Messages, contact | Natif |
| **WhatsApp Business** | **Odoo CRM** | Messages, contact | Connecteur |
| **Odoo CRM** | **Odoo Ventes (SO)** | Client, produits | Bouton natif |
| **Odoo Ventes** | **Odoo Sign** | Demande signature CGV/TVA | Module natif |
| **Odoo Ventes** | **Odoo Facturation** | Factures | Workflow natif |
| **Odoo Ventes (SO2)** | **Odoo Achats** | PO drop-ship Wood Cam (auto à confirmation SO2) | Route drop-ship |
| **Odoo Achats (PO WC)** | **Wood Cam** | Commande fabrication + livraison client | Inter-company |
| **Odoo Fabrication** | **Odoo Inventaire** | Bon de livraison | Workflow natif |
| **Odoo CRM/Ventes** | **Odoo Calendrier** | RDV mesures/pose | Natif |

**Intégration critique : Site → Odoo CRM**

L’ajout au panier/favoris crée un Lead CRM via l’API Odoo. Données minimales : email, références produit, montant estimé, UTM.

**Traçabilité CRM → SO1 → SO2**

SO1 est créé depuis l’opportunité (champ Source Document). SO2 référence SO1 dans son champ Source. Cela permet de relier chaque euro de CA à son canal d’acquisition.

# **15. Règles d’automatisation**

|  |  |  |  |
| --- | --- | --- | --- |
| **Déclencheur** | **Condition** | **Action** | **Module** |
| **Lead créé** | **J+1 sans contact** | Email relance 1 | CRM |
| **Lead créé** | **J+3 sans contact** | Email relance 2 | CRM |
| **Lead créé** | **J+7 sans contact** | Notif CSM | CRM |
| **Opp. « Contact »** | **J+7 sans suite** | Notif CSM | CRM |
| **SO échantillons expédié** | **J+5 sans retour** | Email relance | Ventes |
| **SO1 créé (devis)** | **Immédiat** | Envoyer CGV Odoo Sign | Sign |
| **CGV signées** | **Immédiat** | Notif CSM : confirmer SO1 | Sign |
| **SO1 confirmé** | **Immédiat** | Facture acompte 50 % + projet FS + 2 tâches | Fact. + FS |
| **SO1 confirmé** | **Immédiat** | Email récapitulatif client | Ventes |
| **SO1 créé + TVA 6 % appl.** | **Immédiat** | Envoyer attestation Odoo Sign (en même temps que CGV, cf. §6.2) | Sign |
| **Attestation TVA signée** | **Immédiat** | Notif CSM : ajuster taux TVA | Sign |
| **Fabrication terminée** | **Immédiat** | Notif CSM : planifier livraison | Fab. |
| **Pose effectuée** | **J+7** | Email satisfaction + UGC | Email Mkt |
| **Pose effectuée** | **J+30** | Email parrainage + avis | Email Mkt |

# **16. Annexes**

## **Annexe A : Modules Odoo requis**

|  |  |
| --- | --- |
| **Module** | **Usage** |
| **CRM** | **Pipeline 4 étapes (Intérêt, Contact, Échantillons, Gagné)** |
| **Ventes** | **SO échantillons + SO1 + SO2** |
| **Facturation** | **Facture acompte SO1 (50 %) + factures SO2 (90/10)** |
| **Inventaire** | **Stock échantillons, bons de livraison** |
| **Fabrication** | **Ordres de fabrication** |
| **Field Service** | **Projet FS par client, tâches FS-MESURES + FS-POSE, app mobile, signature, rapports** |
| **Achats** | **PO sous-traitant pose, factures fournisseurs** |
| **Planning** | **Vue planning techniciens et installateurs** |
| **Appointments** | **Booking self-service mesures + pose, intégré oaksome.com** |
| **Portail client** | **Accès client : SO, factures, tâches FS, documents signés, paiement en ligne** |
| **Fournisseur de paiement (Stripe)** | **Paiement en ligne des factures via le portail** |
| **Calendrier** | **Mesures, livraisons, poses** |
| **Odoo Sign** | **CGV + Attestation TVA 6 %** |
| **Live Chat** | **Chat intégré au site** |
| **Automatisation** | **Règles de relance et alertes** |
| **Email Marketing** | **Templates automatisés** |
| **WhatsApp (connecteur)** | **Intégration WhatsApp Business** |

## **Annexe B : Champs personnalisés**

|  |  |  |  |
| --- | --- | --- | --- |
| **Champ** | **Type** | **Module** | **Valeurs** |
| **Type de projet** | **Sélection** | CRM | Placard, Dressing, Bibliothèque, Bureau, Sous-escalier, Autre |
| **Score qualification** | **Sélection** | CRM | Chaud / Tiède / Froid |
| **Canal de contact** | **Sélection** | CRM | WhatsApp / Chat / Tél. / Email / Site |
| **Collection** | **Sélection** | CRM + Ventes | Collection 1, 2, 3, 4 |
| **Date mesures** | **Date** | SO1 | Date effective |
| **Technicien mesures** | **Many2one** | SO1 | Lien employé |
| **Date validation plan** | **Date** | SO1 | Date validation client |
| **Nb itérations plan** | **Integer** | SO1 | Compteur modifications |
| **Étage livraison** | **Integer** | FS-MESURES | Onglet Accès livraison |
| **Ascenseur** | **Booléen** | FS-MESURES | Onglet Accès livraison |
| **Dimensions ascenseur** | **Char** | FS-MESURES | L×P×H cm |
| **Largeur passage min.** | **Integer** | FS-MESURES | En cm |
| **Type escalier** | **Sélection** | FS-MESURES | Aucun / Droit / Courbe / Colimaçon |
| **Parking livraison** | **Sélection** | FS-MESURES | Devant / < 50m / > 50m / Difficile |
| **Suppl. manutention** | **Booléen** | FS-MESURES | Oui / Non |
| **Montant suppl. estimé** | **Monétaire** | SO1 | € |
| **Score satisfaction** | **Integer** | SO1 | Note /10 post-pose |
| **Snag list** | **Texte** | SO1 | Points à corriger |
| **SO1 lié** | **Many2one** | SO2 | Référence vers SO1 parent |
| **PO sous-traitant lié** | **Many2one** | FS-POSE | Référence PO installateur |
| **UTM Source/Medium/Campaign** | **Char** | CRM | Analytics acquisition |

## **Annexe C : Templates Odoo Sign**

|  |  |  |
| --- | --- | --- |
| **Template** | **Déclencheur** | **Champs dynamiques** |
| **CGV Oaksome** | **Création SO1 (auto)** | Nom client, réf. SO, date, montant, exclusion rétractation |
| **Attestation TVA 6 %** | **Validation plan (manuel)** | Nom client, adresse chantier, année construction, réf. SO |

## **Annexe D : Pipeline CRM**

|  |  |  |  |
| --- | --- | --- | --- |
| **Étape CRM** | **Probabilité** | **Activité auto** | **Passage suivant** |
| **Intérêt** | **10 %** | Relance J+1, J+3, notif J+7 | Prospect répond |
| **Contact** | **25 %** | Relance J+7 | Demande éch. ou commande |
| **Échantillons** | **40 %** | Relance J+5 post-expédition | Client prêt |
| **Gagné** | **100 %** | — | SO1 créé |

*Statut « Perdu » avec motif obligatoire : Prix, Délai, Concurrent, Projet annulé, Autre.*

## **Annexe E : Templates email**

|  |  |  |
| --- | --- | --- |
| **Template** | **Déclencheur** | **Contenu clé** |
| **Relance panier J+1** | **Auto (CRM)** | Lien projet sauvegardé |
| **Relance panier J+3** | **Auto (CRM)** | Invitation WhatsApp/chat |
| **Checklist accès livraison** | **Manuel (étape 4)** | Questionnaire + demande photos |
| **Confirmation commande** | **Auto (SO1)** | Détail, montants, contact CSM + lien booking mesures |
| **Invitation booking pose** | **Auto (FS-POSE activée)** | Lien booking pose sur oaksome.com |
| **Relance échantillons** | **Auto J+5** | Retour échantillons, aide choix |
| **Plan final à valider** | **Manuel** | PDF plan + instructions validation |
| **Confirmation fabrication** | **Auto** | Date prévisionnelle livraison |
| **Confirmation livraison J-2** | **Auto** | Date, créneau, instructions accès |
| **Satisfaction J+7** | **Auto** | Feedback + photo UGC |
| **Parrainage J+30** | **Auto** | Offre parrainage + avis Google |

*Fin du document — Version 7.0 — Mars 2026*