// Contenu géré depuis l'espace de gestion (Firebase).
// Tant que Firebase n'est pas configuré ou que la base est vide, le site garde
// le contenu écrit dans ses pages : ce fichier ne change alors rien.
import { firebaseConfig, firebaseActif, FIREBASE_SDK } from '../firebase-config.js';

const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const br = t => esc(t).replace(/\n/g, '<br>');
const $$ = s => [...document.querySelectorAll(s)];
const CATEGORIES = { camps: 'Camps & véhicules', civil: 'Vie civile', commemorations: 'Commémorations', hommages: 'Hommages' };
const STATUTS = { avenir: 'À venir', confirme: 'Confirmé', complet: 'Complet', reporte: 'Reporté', annule: 'Annulé' };
const ORIGINE = {
  facebook: 'https://www.facebook.com/NormandySoldiersMemory/',
  helloasso: 'https://www.helloasso.com/associations/normandy-soldiers-memory',
};

function isoJour(d = new Date()) {
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
const versDate = iso => new Date(iso + 'T12:00:00');
const lienSur = u => /^(https?:\/\/|mailto:|tel:)/i.test(u) || /^[\w./#-]+$/.test(u) ? u : '#';

// ---------------------------------------------------------------- Textes & coordonnées
function appliquerTextes(t) {
  $$('[data-cms]').forEach(el => {
    const v = t[el.dataset.cms];
    if (typeof v === 'string' && v.trim()) el.innerHTML = br(v);
  });
}

function telInternational(tel) {
  const d = String(tel).replace(/[^\d+]/g, '');
  if (d.startsWith('+')) return d;
  if (d.startsWith('0') && d.length === 10) return '+33' + d.slice(1);
  return d;
}
function appliquerCoordonnees(c) {
  $$('[data-coord="adresse"]').forEach(el => { if (c.adresse1 || c.adresse2) el.innerHTML = [c.adresse1, c.adresse2].filter(Boolean).map(esc).join('<br>'); });
  if (c.telephone) $$('a[href^="tel:"]').forEach(a => { a.href = 'tel:' + telInternational(c.telephone); if (a.dataset.coord === 'telephone') a.textContent = c.telephone; });
  $$('[data-coord-row="email"]').forEach(r => {
    r.hidden = !c.email;
    const a = r.querySelector('a');
    if (c.email && a) { a.href = 'mailto:' + c.email; a.textContent = c.email; }
  });
  ['facebook', 'helloasso'].forEach(k => {
    if (c[k] && /^https?:\/\//.test(c[k])) $$(`a[href="${ORIGINE[k]}"]`).forEach(a => { a.href = c[k]; });
  });
}

function appliquerAnnonce(a) {
  if (!a || !a.actif || !a.texte) return;
  const cle = 'nsm-annonce-fermee';
  try { if (sessionStorage.getItem(cle) === a.texte) return; } catch (e) {}
  const el = document.createElement('div');
  el.className = 'annonce';
  el.setAttribute('role', 'note');
  el.innerHTML = `<span>${esc(a.texte)}</span>${a.lien ? `<a href="${esc(lienSur(a.lien))}"${/^https?:/i.test(a.lien) ? ' target="_blank" rel="noopener"' : ''}>${esc(a.libelleLien || 'En savoir plus')} →</a>` : ''}<button type="button" aria-label="Fermer l'annonce">✕</button>`;
  document.body.prepend(el);
  const caler = () => document.body.style.setProperty('--h-annonce', el.offsetHeight + 'px');
  caler(); addEventListener('resize', caler);
  document.body.classList.add('avec-annonce');
  el.querySelector('button').onclick = () => {
    el.remove(); document.body.classList.remove('avec-annonce');
    try { sessionStorage.setItem(cle, a.texte); } catch (e) {}
  };
}

// ---------------------------------------------------------------- Agenda
function blocDate(e) {
  if (e.date) {
    const d = versDate(e.date);
    return `<b>${String(d.getDate()).padStart(2, '0')}</b><span>${esc(d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''))}</span>`;
  }
  const m = (e.libelleDate || '').match(/^(\d{1,2})\s+(.*)$/);
  return m ? `<b>${esc(m[1])}</b><span>${esc(m[2])}</span>` : `<b>—</b><span>${esc(e.libelleDate || 'À venir')}</span>`;
}
function dateTexte(e) {
  if (!e.date) return '';
  const f = iso => versDate(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const t = e.dateFin && e.dateFin !== e.date ? `Du ${f(e.date)} au ${f(e.dateFin)}` : f(e.date);
  return t.charAt(0).toUpperCase() + t.slice(1);
}
function rendreAgenda(el, evts) {
  const auj = isoJour();
  const l = evts.filter(e => !e.date || (e.dateFin || e.date) >= auj)
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || (a.ordre || 0) - (b.ordre || 0));
  el.innerHTML = l.length ? l.map(e => `
      <div class="event reveal">
        <div class="e-date">${blocDate(e)}</div>
        <div><h3>${esc(e.titre)}</h3><p>${[dateTexte(e), e.lieu].filter(Boolean).map(esc).join(' · ')}</p>${e.description ? `<p class="e-desc">${br(e.description)}</p>` : ''}</div>
        <span class="e-status ${esc(e.statut || '')}">${esc(STATUTS[e.statut] || 'À venir')}</span>
      </div>`).join('')
    : `<div class="event reveal" style="grid-template-columns:1fr"><div><h3>Aucun rendez-vous programmé pour le moment</h3><p>Les prochaines dates seront annoncées ici et sur notre page Facebook.</p></div></div>`;
}

// ---------------------------------------------------------------- Historique & FAQ
function rendreHistorique(el, etapes) {
  const fixe = el.querySelector('[data-fixe]');
  el.innerHTML = etapes.map(h => `
      <div class="t-item reveal"><div class="t-date">${esc(h.annee)}<small>${esc(h.sousTitre || '')}</small></div>
      <div class="t-content"><h3>${esc(h.titre)}</h3>${h.texte ? `<p>${br(h.texte)}</p>` : ''}${h.lieu ? `<span class="place">◆ ${esc(h.lieu)}</span>` : ''}</div></div>`).join('');
  if (fixe) el.appendChild(fixe);
}
function rendreFaq(el, questions) {
  el.innerHTML = questions.map(q => `<details><summary>${esc(q.question)}</summary><p>${br(q.reponse)}</p></details>`).join('');
}

// ---------------------------------------------------------------- Galerie
function rendreGalerie(el, photos) {
  el.innerHTML = photos.length ? photos.map(p => `
      <figure class="shot reveal" data-c="${esc(p.categorie)}"><img src="${esc(p.apercu)}" alt="${esc(p.legende || '')}" loading="lazy"${p.hd ? ` data-hd="${esc(p.id)}"` : ''}>
      <figcaption><b>${esc(p.legende || '')}</b><span>${esc(CATEGORIES[p.categorie] || '')}</span></figcaption></figure>`).join('')
    : '<p class="note" style="color:var(--muted)">Les photos arrivent bientôt.</p>';
  el.refiltrer?.();
}

// ---------------------------------------------------------------- Lancement
async function demarrer() {
  if (!firebaseActif) return;
  const [appMod, fsMod] = await Promise.all([
    import(`${FIREBASE_SDK}/firebase-app.js`),
    import(`${FIREBASE_SDK}/firebase-firestore-lite.js`),
  ]);
  const fs = fsMod.getFirestore(appMod.initializeApp(firebaseConfig));
  const { doc, getDoc, getDocs, collection, query, where } = fsMod;

  window.NSM_hd = async id => { const s = await getDoc(doc(fs, 'photos_hd', id)); return s.exists() ? s.data().data : ''; };
  const visibles = async col => (await getDocs(query(collection(fs, col), where('visible', '==', true))))
    .docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.ordre || 0) - (b.ordre || 0));

  const [textes, coord, annonce] = await Promise.all(['textes', 'coordonnees', 'annonce'].map(id => getDoc(doc(fs, 'contenu', id))));
  // Base pas encore remplie depuis l'espace de gestion : on garde le contenu des pages
  if (!textes.exists()) return;
  appliquerTextes(textes.data());
  if (coord.exists()) appliquerCoordonnees(coord.data());
  if (annonce.exists()) appliquerAnnonce(annonce.data());

  const listes = [
    ['agenda-list', 'evenements', rendreAgenda],
    ['timeline-list', 'historique', rendreHistorique],
    ['faq-list', 'faq', rendreFaq],
    ['gallery', 'photos', rendreGalerie],
  ];
  await Promise.all(listes.map(async ([idEl, col, rendre]) => {
    const el = document.getElementById(idEl);
    if (!el) return;
    try { rendre(el, await visibles(col)); } catch (e) { console.warn('Contenu « ' + col + ' » non chargé', e); }
  }));
  window.NSM?.reveal();
}

demarrer().catch(e => console.warn('Contenu géré non chargé, le contenu des pages est conservé.', e));
