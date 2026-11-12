# Normandy Soldiers Memory — site web

Site vitrine de l'association **Normandy Soldiers Memory** (Ifs, Calvados) : reconstitution historique civile et militaire de la Seconde Guerre mondiale, devoir de mémoire, transmission et préservation du patrimoine.

Site statique : HTML et CSS, sans framework ni étape de compilation.

## Pages

| Fichier | Page |
|---|---|
| `index.html` | Accueil |
| `association.html` | L'association |
| `activites.html` | Activités |
| `historique.html` | Historique |
| `archives.html` | Archives du Front (galerie photo avec filtres et visionneuse) |
| `agenda.html` | Agenda |
| `rejoindre.html` | Nous rejoindre |
| `contact.html` | Contact |

## Structure

- `style.css` : feuille de style commune
- `photos/` : photos de la galerie et des pages (en remplaçant un fichier par une version en meilleure qualité, il faut garder le même nom)
- `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `icons/`, `site.webmanifest` : logo de l'onglet et icônes

## Mise en ligne avec GitHub Pages

1. Aller dans **Settings → Pages**.
2. Dans *Source*, choisir **Deploy from a branch**, puis la branche `main` et le dossier `/ (root)`.
3. Le site sera publié à l'adresse `https://kmauger18.github.io/normandy-soldiers-memory/`.

## À compléter

- Mettre les vraies dates dans `agenda.html`.
- Faire valider par l'association la citation sous le bleuet (`index.html`) et la FAQ (`rejoindre.html`).
