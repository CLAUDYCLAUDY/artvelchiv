import { useState, useMemo, useEffect } from "react";

/* ============================================================
   ARTVELCHIV — The art transaction standard.
   Every work established. Every transaction secured.
   Démonstrateur pour galeries, marchands, maisons de vente et conseillers.
   Référentiel validé à date par les équipes ARTVELCHIV.
   ============================================================ */

const DEFAULT_PIN = "ARTVELCHIV";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;600&display=swap');
@keyframes avFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.av-fade { animation: avFade .25s ease both; }
.av-press { transition: opacity .15s ease; } .av-press:active { opacity: .6; }
.av-x::-webkit-scrollbar { display: none; }
select, input { -webkit-appearance: none; }
`;
const T = { paper: "#FAF5EB", card: "#FFFFFF", ink: "#15140F", inkSoft: "#46443C", mute: "#8C8578", line: "#E6DFCE", lineDark: "#CEC6B2", gold: "#1D4633", vertDim: "#87A996", claret: "#7A1E1E", ok: "#2E6349", warn: "#9A6321", info: "#3F5F8A" };
const serifU = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 };
const serif = { ...serifU, fontStyle: "italic" };
const sans = { fontFamily: "'Jost', sans-serif" };
const mono = { fontFamily: "'IBM Plex Mono', monospace" };
const KIND = { blocked: ["Bloqué", T.claret], required: ["Requis", T.warn], pending: ["À vérifier", T.info], info: ["Information", T.mute], clear: ["Conforme", T.ok] };
const ORDER = { blocked: 0, required: 1, pending: 2, info: 3, clear: 4 };

/* ---------- Référentiels ---------- */
const CATS = [["peinture", "Peinture"], ["oeuvre_papier", "Gouache, aquarelle, dessin, estampe"], ["sculpture", "Sculpture, bronze, multiple"], ["photo", "Photographie (tirage)"], ["archeo", "Archéologie, élément de monument"], ["religieux", "Objet religieux, ethnographique"], ["manuscrit", "Manuscrit, archives, livre ancien"], ["mobilier", "Mobilier, arts décoratifs, textile"], ["bijou", "Bijou, orfèvrerie, horlogerie"], ["instrument", "Instrument de musique"], ["armes", "Armes anciennes, militaria"], ["numismatique", "Monnaies, médailles"], ["naturel", "Fossile, spécimen naturel"], ["restes", "Restes humains"]];
const UE = ["France", "Italie", "Espagne", "Allemagne", "Belgique", "Pays-Bas", "Monaco"];
const PAYS = ["France", "Italie", "Espagne", "Allemagne", "Belgique", "Pays-Bas", "Monaco", "Suisse", "Royaume-Uni", "États-Unis", "Hong Kong", "Chine / Tibet", "Inde", "Égypte", "Grèce", "Turquie", "Nigéria", "Cambodge", "Mexique", "Pérou", "Irak", "Syrie", "Russie", "Autre pays tiers"];
const ARTISTE = [["vivant", "Artiste vivant"], ["moins70", "Décédé depuis moins de 70 ans"], ["plus70", "Décédé depuis plus de 70 ans"], ["anonyme", "Anonyme, atelier, non attribué"]];
const VOCAB = [["signé", "« signé » — garantie pleine"], ["attribué", "« attribué à » — forte présomption"], ["atelier", "« atelier de »"], ["entourage", "« entourage de »"], ["école", "« école de »"], ["d'après", "« d'après »"]];
const MATERIAUX = [["toile", "Toile, panneau, papier"], ["bronze", "Bronze, métal"], ["pierre", "Pierre, marbre"], ["terre", "Terre cuite, céramique, verre"], ["bois", "Bois (dont essences protégées)"], ["ivoire", "Ivoire, os, corne, écaille, corail"], ["precieux", "Métaux ou pierres précieux"], ["textile", "Textile, tapisserie, cuir"], ["mixte", "Mixte, autre"]];
const PROVTYPE = [["collection", "Collection ancienne documentée"], ["fouilles", "Issue de fouilles ou de découverte"], ["monument", "Élément d'un monument, temple ou autel"], ["inconnue", "Inconnue ou incomplète"]];
/* Fiches de catégorie : annexe R111-1 C. patr. (décret 2020-1718) · annexe règl. 116/2009 · règl. 2019/880 */
const CATREF = {
  peinture: { fr: "3 · Tableaux et peintures de plus de 50 ans", eu: "A.3 — peintures", p880: "C", period: { contemporain: "Œuvre de moins de 50 ans : libre de certificat ; droit moral et reproduction si artiste sous droits ; TVA 5,5 %.", moderne: "Plus de 50 ans : certificat au-delà de 300 000 € (Union) ou 150 000 € (pays tiers) ; spoliations si antérieure à 1946.", ancien: "Plus de 100 ans : mêmes seuils ; attribution selon le décret de 1981, vérifier école, atelier, copie ; spoliations ; trésor national possible.", antique: "Plus de 200 ans : partie C du règlement 2019/880 à l'entrée dans l'Union au-delà de 18 000 € ; provenance longue à documenter." } },
  oeuvre_papier: { fr: "4 · Aquarelles, gouaches, pastels · 5 · Dessins · 6 · Estampes, de plus de 50 ans", eu: "A.4, A.5, A.6", p880: "C", period: { contemporain: "Libre de certificat ; estampes : mention du tirage et de la technique ; droit de suite si artiste sous droits.", moderne: "Certificat au-delà de 50 000 € (aquarelles, gouaches, pastels), 30 000 € (dessins), 20 000 € (estampes) vers l'Union ; 30 000, 15 000 et 15 000 € vers un État tiers.", ancien: "Mêmes seuils ; conservation et authenticité du support ; spoliations.", antique: "Partie C du règlement 2019/880 au-delà de 18 000 € à l'entrée dans l'Union." } },
  sculpture: { fr: "7 · Productions originales de l'art statuaire de plus de 50 ans", eu: "A.7 — sculptures", p880: "C — B si élément de monument ou de fouilles", period: { contemporain: "Libre de certificat ; multiple : douze épreuves au plus (huit numérotées et quatre d'artiste) pour l'œuvre originale fiscale, mention du tirage et du fondeur (décret 1981, art. 9).", moderne: "Plus de 50 ans : certificat au-delà de 100 000 € (Union) ou 50 000 € (pays tiers) ; fonte posthume à déclarer comme telle.", ancien: "Plus de 100 ans : mêmes seuils ; si fragment architectural, catégorie 2 (éléments de monuments), certificat à toute valeur.", antique: "Plus de 200 ans : partie C (18 000 €) ; plus de 250 ans issue de fouilles ou d'un monument : partie B, licence d'importation à toute valeur." } },
  photo: { fr: "8 · Photographies, films et négatifs de plus de 50 ans", eu: "A.8", p880: "C", period: { contemporain: "Tirage signé, numéroté, trente exemplaires au plus (art. 98 A) ; distinguer tirage d'époque et postérieur.", moderne: "Certificat au-delà de 25 000 € (Union) ou 15 000 € (pays tiers).", ancien: "Mêmes seuils ; conservation, provenance du négatif, droits.", antique: "Partie C au-delà de 18 000 €." } },
  archeo: { fr: "1 · Objets archéologiques de plus de 100 ans · 2 · Éléments de monuments démembrés", eu: "A.1, A.2", p880: "B — licence à toute valeur au-delà de 250 ans", period: { contemporain: "—", moderne: "—", ancien: "Certificat d'exportation à toute valeur ; découverte française postérieure au 8 juillet 2016 : propriété de l'État.", antique: "Licence d'importation (partie B) à l'entrée dans l'Union, à toute valeur ; preuve de sortie licite du pays de découverte ; restrictions CPIA aux États-Unis ; accords bilatéraux suisses." } },
  religieux: { fr: "7 · Statuaire · 14 · Objets d'intérêt ethnographique · 2 si élément de monument", eu: "A.7, A.14, A.2", p880: "C — B si élément de temple, d'autel ou de monument", period: { contemporain: "Libre ; vérifier le caractère non cultuel actuel.", moderne: "Certificat selon la catégorie (100 000 € statuaire, 50 000 € ethnographie).", ancien: "Objets des églises françaises antérieurs à 1905 : domaine public présumé ; ethnographie : diligence Unesco, listes rouges ICOM.", antique: "Plus de 250 ans provenant d'un temple, d'un autel ou d'un monument : partie B, licence à toute valeur ; provenance inconnue : la qualification partie B est probable et doit être établie — la licence s'impose par prudence." } },
  manuscrit: { fr: "9 · Incunables et manuscrits · 10 · Livres imprimés · 11 · Cartes · 12 · Archives", eu: "A.9, A.10, A.11, A.12", p880: "C", period: { contemporain: "Moins de 50 ans : libre ; archives publiques inaliénables quel que soit l'âge.", moderne: "Plus de 50 ans : manuscrits dès 3 000 € (Union) et à toute valeur vers un État tiers ; livres au-delà de 50 000 € ; archives dès 300 € (Union), toute valeur (tiers).", ancien: "Plus de 100 ans : mêmes seuils ; cartes imprimées au-delà de 25 000 €.", antique: "Partie C du règlement 2019/880 au-delà de 18 000 € ; incunables : provenance et intégrité des feuillets." } },
  mobilier: { fr: "16 · Autres antiquités de plus de 50 ans (mobilier, arts décoratifs, textiles)", eu: "A.15 — autres antiquités", p880: "C", period: { contemporain: "Design : libre ; droit d'auteur du créateur ; TVA au taux normal (objet, non œuvre) sauf pièce unique signée.", moderne: "Certificat au-delà de 100 000 € (Union) ou 50 000 € (pays tiers) ; essences et espèces protégées (ivoire, écaille, bois) : CITES.", ancien: "Mêmes seuils ; ivoire d'avant 1947 : certificat intra-UE ; réexportation hors Union suspendue.", antique: "Partie C au-delà de 18 000 € ; éléments de boiseries ou de décor fixe : catégorie 2, monuments." } },
  bijou: { fr: "16 · Autres antiquités · 13 · Collections (pierres)", eu: "A.15", p880: "C", period: { contemporain: "Poinçons et garantie des métaux précieux ; registre spécial ; TVA au taux normal sur la marge ; pierres : certificat de laboratoire, Kimberley pour les diamants bruts.", moderne: "Certificat au-delà de 100 000 € ; horlogerie : numéro de série, registre.", ancien: "Mêmes seuils ; provenance des bijoux de famille (successions, partages).", antique: "Partie C au-delà de 18 000 € ; bijoux archéologiques : partie B." } },
  instrument: { fr: "16 · Autres antiquités", eu: "A.15", p880: "C", period: { contemporain: "Essences protégées (palissandres) : CITES annexe II, exemptions limitées aux instruments finis.", moderne: "Ivoire, écaille : certificat intra-UE pour toute vente ; le certificat « instrument de musique » n'autorise ni vente ni cession.", ancien: "Instruments antérieurs à 1975 : réexportation hors Union possible sur certificat ; certificat d'exportation au-delà de 100 000 €.", antique: "Partie C au-delà de 18 000 €." } },
  armes: { fr: "16 · Autres antiquités · 14 · Collections historiques", eu: "A.15, A.14", p880: "C", period: { contemporain: "Régime des armes : catégories A, B, C ; autorisation, déclaration ou enregistrement.", moderne: "Postérieures à 1900 : régime des armes ; antérieures : catégorie D, vente libre aux majeurs sur pièce d'identité.", ancien: "Catégorie D ; certificat d'exportation au-delà de 100 000 € ; matériel de guerre : licence selon le modèle hors Union.", antique: "Partie C au-delà de 18 000 € ; armes archéologiques : partie B." } },
  numismatique: { fr: "1.A · Monnaies de fouilles (toute valeur) · 1.B · antérieures à 1500 (3 000 €) · 1.C · postérieures à 1500 (15 000 €) · 13.b · collections (50 000 €)", eu: "A.1, A.13", p880: "C — B si découverte archéologique", period: { contemporain: "Libre ; métaux précieux : garantie.", moderne: "Libre sous cent ans ; collections d'intérêt numismatique : certificat au-delà de 50 000 €.", ancien: "Plus de cent ans : 3 000 € avant 1500, 15 000 € après ; monnaies de découverte : régime archéologique, certificat à toute valeur, État propriétaire depuis 2016.", antique: "Monnaies antiques : partie C au-delà de 18 000 € ; trésor ou découverte : partie B, licence." } },
  naturel: { fr: "13.a · Collections de zoologie, botanique, minéralogie, anatomie · 13.b · Paléontologie", eu: "A.13", p880: "C", period: { contemporain: "CITES pour toute espèce protégée ; interdictions d'exportation des fossiles (Chine, Brésil, Mongolie, Maroc partiel) ; certificat au-delà de 50 000 € pour les collections, sans condition d'âge.", moderne: "Certificat au-delà de 50 000 € pour les collections.", ancien: "Idem ; spécimens naturalisés : CITES et antériorité.", antique: "Partie C au-delà de 18 000 €." } },
  restes: { fr: "Hors commerce", eu: "—", p880: "—", period: { contemporain: "Commercialisation prohibée.", moderne: "Commercialisation prohibée.", ancien: "Commercialisation prohibée ; restitution (loi 2023-1251).", antique: "Commercialisation prohibée ; restitution." } },
};
const periodOf = (age) => age < 50 ? "contemporain" : age < 100 ? "moderne" : age <= 200 ? "ancien" : "antique";
const PERIOD_LABEL = { contemporain: "moins de 50 ans", moderne: "50 à 100 ans", ancien: "100 à 200 ans", antique: "plus de 200 ans" };
const DOUANE = [["libre", "En libre pratique dans l'Union"], ["at", "Sous admission temporaire"], ["ata", "Sous carnet ATA"], ["entrepot", "En entrepôt douanier ou port franc"], ["tiers", "Hors Union, à importer"]];
const TECHNIQUES = { oeuvre_papier: [["gouache", "Aquarelle, gouache, pastel"], ["dessin", "Dessin"], ["estampe", "Gravure, estampe, lithographie"]], manuscrit: [["manuscrit", "Manuscrit, incunable, autographe"], ["livre", "Livre ou partition imprimée"], ["archives", "Archives"], ["carte", "Carte géographique imprimée"]] };
/* Seuils du certificat français : annexe 1 aux articles R. 111-1 C. patr. (décret n° 2020-1718, 1er janvier 2021) —
   colonne « État membre » ; vers un État tiers, l'annexe renvoie aux seuils de l'annexe du règl. (CE) 116/2009.
   Retourne [ageMin, seuilUE, seuilTiers, libellé de catégorie]. */
function seuilsPour(o) {
  const t = o.technique, m = o.materiau || "mixte", prov = o.prov || "collection";
  switch (o.cat) {
    case "peinture": return [50, 300000, 150000, "3 · Tableaux et peintures de plus de 50 ans"];
    case "oeuvre_papier": return t === "dessin" ? [50, 30000, 15000, "5 · Dessins de plus de 50 ans"] : t === "estampe" ? [50, 20000, 15000, "6 · Gravures, estampes, lithographies de plus de 50 ans"] : [50, 50000, 30000, "4 · Aquarelles, gouaches, pastels de plus de 50 ans"];
    case "sculpture": return prov === "monument" ? [100, 0, 0, "2 · Éléments de monuments démembrés de plus de 100 ans"] : [50, 100000, 50000, "7 · Productions originales de l'art statuaire de plus de 50 ans"];
    case "photo": return [50, 25000, 15000, "8 · Photographies, films et négatifs de plus de 50 ans"];
    case "archeo": return prov === "fouilles" ? [100, 0, 0, "1.A · Objets archéologiques de plus de 100 ans (fouilles, découvertes) — toute valeur"] : prov === "monument" ? [100, 0, 0, "2 · Éléments de monuments démembrés — toute valeur"] : [100, 3000, 0, "1.B · Objets archéologiques de plus de 100 ans hors fouilles — 3 000 € ; État tiers : toute valeur"];
    case "religieux": return prov === "monument" ? [100, 0, 0, "2 · Éléments de monuments religieux démembrés — toute valeur"] : ["bronze", "pierre", "bois", "terre"].includes(m) ? [50, 100000, 50000, "7 · Statuaire de plus de 50 ans"] : [50, 50000, 50000, "13.b · Collections d'intérêt ethnographique"];
    case "manuscrit": return t === "livre" ? [50, 50000, 50000, "10 · Livres et partitions imprimés de plus de 50 ans (règl. 116/2009 : plus de 100 ans)"] : t === "archives" ? [50, 300, 0, "12 · Archives de plus de 50 ans — 300 € ; État tiers : toute valeur"] : t === "carte" ? [100, 25000, 15000, "11 · Cartes géographiques imprimées de plus de 100 ans (règl. 116/2009 : plus de 200 ans)"] : [50, 3000, 0, "9 · Incunables et manuscrits de plus de 50 ans — 3 000 € ; État tiers : toute valeur"];
    case "numismatique": return prov === "fouilles" ? [100, 0, 0, "1.A · Monnaies provenant de fouilles ou de sites — toute valeur"] : o.annee < 1500 ? [100, 3000, 0, "1.B · Monnaies antérieures à 1500 hors fouilles — 3 000 €"] : [100, 15000, 15000, "1.C · Monnaies postérieures à 1500 de plus de 100 ans hors fouilles — 15 000 €"];
    case "naturel": return [0, 50000, 50000, "13.a · Collections de zoologie, botanique, minéralogie, anatomie ; 13.b · paléontologie — 50 000 €"];
    case "mobilier": case "bijou": case "instrument": case "armes": return [50, 100000, 50000, "15 · Autres objets d'antiquité de plus de 50 ans — 100 000 € ; État tiers : 50 000 €"];
    default: return [0, Infinity, Infinity, "Hors annexe"];
  }
}
/* Royaume-Uni : Open General Export Licence — seuils par catégorie (Arts Council England) */
function seuilUK(o) { return o.cat === "peinture" ? 180000 : (o.cat === "manuscrit" && o.technique !== "livre") || o.cat === "archeo" ? 0 : 65000; }
const TVA_IMPORT = { France: "5,5 %", Monaco: "5,5 %", Italie: "10 %", Espagne: "10 %", Allemagne: "7 %", Belgique: "6 %", "Pays-Bas": "9 %", Suisse: "8,1 %", "Royaume-Uni": "5 %", "États-Unis": "droits nuls", "Hong Kong": "aucune" };
const ORIGIN = { "Égypte": ["blocked", "Interdiction totale d'exportation depuis 1983 (loi n° 117/1983) : seule une sortie documentée antérieure rend l'objet commercialisable."], "Chine / Tibet": ["required", "Exportation interdite pour les reliques antérieures à 1911, restreinte avant 1949 ; établir la date de sortie ou, si antérieure au 24 avril 1972, la sortie licite du dernier pays de séjour de plus de cinq ans."], "Inde": ["blocked", "Antiquités de plus de cent ans inexportables depuis 1972 (Antiquities and Art Treasures Act)."], "Grèce": ["blocked", "Exportation des antiquités prohibée (loi 3028/2002)."], "Turquie": ["blocked", "Exportation des biens culturels interdite (loi 2863/1983)."], "Nigéria": ["blocked", "Exportation interdite depuis 1953 ; demandes officielles de restitution des bronzes du Bénin."], "Cambodge": ["blocked", "Antiquités khmères protégées (loi de 1996)."], "Mexique": ["blocked", "Biens préhispaniques inaliénables (loi de 1972)."], "Pérou": ["blocked", "Patrimoine précolombien inexportable (loi 28296)."], "Irak": ["blocked", "Embargo : importation dans l'Union interdite pour tout bien sorti après le 6 août 1990."], "Syrie": ["blocked", "Embargo : importation interdite pour tout bien sorti après le 15 mars 2011."], "Russie": ["required", "Contrôle d'exportation russe ; sanctions sur les parties et les flux."] };
const CPIA = ["Italie", "Grèce", "Égypte", "Chine / Tibet", "Cambodge", "Pérou", "Mexique", "Turquie", "Irak", "Syrie", "Nigéria"];

const STRUCT = {
  galerie: ["Galerie", [["Registre des revendeurs d'objets mobiliers", "Déclaration en préfecture avant toute revente hors premier marché.", "C. pén., art. 321-7 · R321-1"], ["Livre de police", "Chaque œuvre acquise hors artiste : description, provenance, identité du vendeur ; dix ans si électronique. Dispense pour le premier marché.", "C. pén., art. 321-7 · R321-3 à R321-8"], ["Dispositif anti-blanchiment", "Procédures, formation, vigilance dès 10 000 €, Tracfin ; règlement unique et plafond des espèces à 10 000 € au 10 juillet 2027.", "CMF, art. L561-2 (17°) · règl. (UE) 2024/1624"], ["Affichage des prix et facture réglementée", "Prix consultables ; dénomination de l'attribution sur facture.", "Circ. 19 juillet 1988 · décret n° 81-255"], ["TVA des œuvres d'art : 5,5 %", "Livraisons et importations d'œuvres originales depuis 2025.", "CGI, art. 278-0 bis"], ["Contrat de dépôt-vente avec l'artiste", "Œuvres confiées, durée, commission, assurance, restitution ; droit moral réservé.", "C. civ., art. 1915 · CPI, art. L121-1"], ["Droits de reproduction (catalogue, site)", "Artistes vivants ou décédés depuis moins de 70 ans : autorisation ou licence ADAGP pour toute reproduction.", "CPI, art. L122-4 · L122-5"], ["Vente en ligne et à distance", "Information précontractuelle, rétractation quatorze jours, médiateur, RGPD.", "C. consom., art. L221-5 · L612-1"], ["Assurance responsabilité civile professionnelle", "Dépôt, transport, attribution.", "Code de déontologie CPGA"], ["Espèces plafonnées à 1 000 €", "Résident fiscal français ; plafond européen 10 000 € en 2027.", "CMF, art. L112-6"]]],
  marchand: ["Marchand, antiquaire", [["Registre des revendeurs d'objets mobiliers", "Déclaration préalable en préfecture.", "C. pén., art. 321-7"], ["Livre de police à chaque acquisition", "Description, provenance, pièce du vendeur ; présentable sur réquisition.", "C. pén., art. 321-7 · R321-3"], ["Registre des métaux précieux", "Bijoux, orfèvrerie, horlogerie : garantie, poinçons, registre spécial.", "CGI, ann. IV, art. 56 J quaterdecies"], ["Dispositif anti-blanchiment", "Vigilance dès 10 000 €, Tracfin, AMLR 2027.", "CMF, art. L561-2 (17°)"], ["TVA : œuvres 5,5 %, objets de collection marge 20 %", "Distinguer œuvres originales et objets de collection.", "CGI, art. 278-0 bis · 297 A"], ["Diligence de provenance systématique", "Registres d'œuvres volées, listes rouges ICOM, spoliations.", "Unesco 1970 · loi n° 2023-650"], ["Armes et espèces protégées : registres dédiés", "Armes de collection (catégorie D) et objets CITES : traçabilité spécifique.", "C. sécurité intérieure, art. R311-2 · règl. (CE) 338/97"], ["Assurance responsabilité civile professionnelle", "Dépôt, transport, attribution.", "Pratique de place"]]],
  maison: ["Maison de vente", [["Déclaration au Conseil des maisons de vente", "Garantie financière, assurance, recueil des obligations déontologiques.", "C. com., art. L321-4 · recueil CMV"], ["Mandat de vente écrit (réquisition)", "Désignation, estimation, réserve, frais, avant la vente.", "C. com., art. L321-5"], ["Livre de police d'entrée", "Chaque bien à sa remise ; cohérence registre ↔ mandat ↔ PV.", "C. pén., art. 321-7"], ["Procès-verbal de vente à J + 1", "Vendeur, adjudicataire, description, prix.", "C. com., art. L321-9"], ["Droit de préemption de l'État", "Substitution possible dans les quinze jours.", "C. patr., art. L123-1"], ["Catalogue : mentions réglementées", "Attribution (décret 1981), restaurations, estimation, frais, tirages ; droits de reproduction ADAGP.", "Décret n° 81-255 · CPI, art. L122-4 · recueil CMV"], ["Information sur frais et garanties", "Frais acheteur et vendeur, garantie de prix, réserve, annoncés avant la vente.", "C. com., art. L321-11"], ["Gré à gré après enchères", "Lot non adjugé, au prix de réserve, PV distinct.", "C. com., art. L321-9, al. 3"], ["Responsabilité de l'expert", "Solidaire pour les mentions au catalogue ; assurance exigée.", "C. com., art. L321-29"], ["Dispositif anti-blanchiment", "Déposant et adjudicataire dès 10 000 €, Tracfin.", "CMF, art. L561-2 (17°)"], ["Prescription quinquennale", "Action en nullité : cinq ans de la découverte de l'erreur.", "C. civ., art. 2224"]]],
  conseiller: ["Conseiller, courtier", [["Assujettissement anti-blanchiment", "Tout intermédiaire dès 10 000 € : procédures, vigilance, Tracfin.", "Directive (UE) 2018/843 · CMF, art. L561-2"], ["Mandat écrit, commissions transparentes", "Mandat de recherche ou de vente ; pas de double commission occulte.", "C. civ., art. 1984"], ["Diligence provenance et sanctions", "Registres, listes rouges ICOM, criblage.", "Unesco 1970 · règl. (UE) 833/2014"], ["Assurance responsabilité civile professionnelle", "Conseil, expertise, transport.", "Pratique de place"]]],
};

const RECORDS = [
  { id: "26-004817", nom: "Gouache de Picasso", titre: "Pablo Picasso, Tête de femme, gouache, 1952", cat: "oeuvre_papier", technique: "gouache", materiau: "toile", prov: "collection", annee: 1952, creation: "France", lieu: "France", dest: "Monaco", valeur: 480000, artiste: "moins70", protege: false, source: "second", mode: "prive", acheteur: "particulier", douane: "libre", entree: "", hue: "#2C3E50" },
  { id: "26-004822", nom: "Bronze tibétain", titre: "Bronze doré, Vajrasattva, Tibet, XVe siècle", cat: "religieux", annee: 1450, creation: "Chine / Tibet", lieu: "Hong Kong", dest: "France", valeur: 2400000, artiste: "anonyme", protege: false, source: "second", mode: "encheres", acheteur: "particulier", douane: "tiers", entree: "", materiau: "bronze", prov: "inconnue", hue: "#3E4A3F" },
  { id: "26-004830", nom: "Sculpture contemporaine", titre: "Acier corten, pièce unique, artiste vivant, 2019", cat: "sculpture", annee: 2019, creation: "Italie", lieu: "Italie", dest: "France", valeur: 25000, artiste: "vivant", protege: false, source: "premier", mode: "distance", acheteur: "particulier", douane: "libre", entree: "", hue: "#4A3F3A" },
  { id: "26-004841", nom: "Rodin, épreuve 7/8", titre: "Auguste Rodin, Éternel Printemps, fonte Rudier 1985, 7/8 — sous admission temporaire", cat: "sculpture", annee: 1985, creation: "France", lieu: "France", dest: "États-Unis", valeur: 350000, artiste: "plus70", protege: false, source: "second", mode: "prive", acheteur: "particulier", tirage: "7/8, fonte posthume", douane: "at", entree: "2025-01-15", hue: "#3D3A35" },
  { id: "26-004855", nom: "Statuette égyptienne", titre: "Osiris en bronze, Basse Époque, vers 600 av. J.-C.", cat: "archeo", annee: -600, creation: "Égypte", lieu: "France", dest: "Suisse", valeur: 640000, artiste: "anonyme", protege: false, source: "second", mode: "prive", acheteur: "pro", douane: "libre", entree: "", materiau: "bronze", prov: "collection", hue: "#4E5A3A" },
  { id: "26-004861", nom: "Coffret d'ivoire, Dieppe", titre: "Coffret en ivoire sculpté, Dieppe, vers 1760", cat: "mobilier", annee: 1760, creation: "France", lieu: "France", dest: "Suisse", valeur: 15000, artiste: "anonyme", protege: true, materiau: "ivoire", prov: "collection", source: "second", mode: "prive", acheteur: "particulier", douane: "libre", entree: "", hue: "#C4BBA6" },
  { id: "26-004870", nom: "Tirage Cartier-Bresson", titre: "Henri Cartier-Bresson, Derrière la gare Saint-Lazare, tirage d'époque, 1950 — port franc de Genève", cat: "photo", annee: 1950, creation: "France", lieu: "Suisse", dest: "Royaume-Uni", valeur: 40000, artiste: "moins70", protege: false, source: "second", mode: "prive", acheteur: "particulier", tirage: "tirage d'époque, signé", douane: "entrepot", entree: "", hue: "#2B2B2B" },
  { id: "26-004888", nom: "Plaque du Bénin", titre: "Plaque en laiton, royaume du Bénin, XVIe-XVIIe siècle", cat: "religieux", annee: 1600, creation: "Nigéria", lieu: "Royaume-Uni", dest: "France", valeur: 1800000, materiau: "bronze", prov: "monument", artiste: "anonyme", protege: false, source: "second", mode: "prive", acheteur: "pro", douane: "tiers", entree: "", hue: "#33443A" },
  { id: "26-004892", nom: "Tableau flamand", titre: "Nature morte, école d'Anvers, vers 1640 — pour un musée de France", cat: "peinture", annee: 1640, creation: "Belgique", lieu: "Belgique", dest: "France", valeur: 220000, artiste: "anonyme", protege: false, source: "second", mode: "prive", acheteur: "public", douane: "libre", entree: "", hue: "#3B2F2F" },
  { id: "26-004901", nom: "Épée d'officier, 1780", titre: "Épée d'officier, garde en argent, France, vers 1780", cat: "armes", annee: 1780, creation: "France", lieu: "France", dest: "Belgique", valeur: 12000, artiste: "anonyme", protege: false, source: "second", mode: "encheres", acheteur: "particulier", douane: "libre", entree: "", hue: "#5A5F66" },
];
const NEW = { id: "nouveau", nom: "Nouveau dossier", titre: "", cat: "peinture", annee: 1980, creation: "France", lieu: "France", dest: "France", valeur: 20000, artiste: "plus70", protege: false, source: "second", mode: "prive", acheteur: "particulier", douane: "libre", entree: "", materiau: "toile", prov: "collection", hue: "#333" };

const SOURCES = [["Union européenne", ["Règl. (UE) 2019/880 · système ICG — eur-lex · douane.gouv.fr", "Règl. (CE) 116/2009 — licence d'exportation", "Règl. (UE) 952/2013 (CDU) — admission temporaire art. 250-253, retour art. 203, entrepôt art. 237", "Règl. (UE) 2024/1624 (AMLR) — 10 juillet 2027", "Règl. (CE) 338/97 · 865/2006 rév. 2021 · orientation ivoire 2021/C 528/03", "Sanctions : 833/2014, 1210/2003, 36/2012"]], ["France", ["C. patr., art. L111-1 et s. · décret n° 2020-1718", "Décret n° 81-255 (attribution) · loi du 9 février 1895 (fraudes artistiques)", "CPI, art. L121-1 (droit moral), L122-4 (reproduction), L122-8 (droit de suite)", "C. pén., art. 321-7 · R321-1 (livre de police)", "C. sécurité intérieure, art. R311-2 (armes de collection, catégorie D)", "CMF, art. L561-2 (17°) — Tracfin", "C. com., art. L321-1 et s. · recueil CMV", "Loi n° 2023-650 (spoliations) · loi n° 2023-1251 (restes humains)", "douane.gouv.fr — admission temporaire, carnet e-ATA, biens culturels, matériel de guerre"]], ["Europe", ["Italie : Codice, art. 65", "Espagne : Ley 16/1985", "Allemagne : KGSG 2016, § 24", "Belgique : décret flamand topstukken", "Pays-Bas : Erfgoedwet", "Suisse : LTBC (RS 444.1), OTBC ; ports francs", "Royaume-Uni : Export Control Order 2003, Waverley ; AMP HMRC"]], ["Monde", ["États-Unis : CPIA (19 U.S.C. § 2601)", "Chine : Law on Protection of Cultural Relics ; Hong Kong port franc", "Inde : Antiquities Act 1972 · Égypte : loi 117/1983 · Grèce : loi 3028/2002"]], ["Registres", ["Art Loss Register · Interpol · OCBC", "Listes rouges ICOM · Object ID", "Lost Art · ERR Project · MNR"]]];

/* ============================================================ INTELLIGENCE ARTVELCHIV — le Référentiel */
function addMonths(iso, m) { if (!iso) return null; const d = new Date(iso); d.setMonth(d.getMonth() + m); return d; }
function fmt(d) { return d ? d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—"; }
function analyse(o, structure) {
  const today = new Date("2026-09-03"), age = 2026 - o.annee, isUE = (p) => UE.includes(p);
  const rules = [], pieces = [], clauses = [], authorities = [], deadlines = [];
  const add = (domain, kind, titre, detail, base) => rules.push({ domain, kind, titre, detail, base });
  const piece = (group, titre, why) => pieces.push({ group, titre, why });
  const due = (kind, titre, date, detail) => deadlines.push({ kind, titre, date, detail });
  const tiers = !isUE(o.creation), entreeUE = !isUE(o.lieu) && isUE(o.dest), sortieUE = isUE(o.lieu) && !isUE(o.dest), frontiere = o.lieu !== o.dest;
  const [sAge, sUE, sTiers, sLib] = seuilsPour(o);
  const seuil = (tab) => { const v = tab === SEUILS_UE ? sTiers : sUE; return age > sAge && o.valeur >= v ? [sAge, v] : null; };
  const SEUILS_UE = "tiers", SEUILS_FR = "ue";
  const original = ["peinture", "oeuvre_papier", "sculpture", "photo"].includes(o.cat);
  const sousDroits = o.artiste === "vivant" || o.artiste === "moins70";
  const mat = o.materiau || "mixte", prov = o.prov || "collection", per = periodOf(age), ref = CATREF[o.cat];
  const protege = o.protege || mat === "ivoire" || o.cat === "instrument" || o.cat === "naturel";
  add("legal", "info", `Catégorie : ${sLib}`, `Œuvre de ${PERIOD_LABEL[per]}${mat !== "mixte" ? `, ${MATERIAUX.find((m) => m[0] === mat)?.[1].toLowerCase()}` : ""}. ${ref ? ref.period[per] : ""} Règlement 2019/880 : ${ref ? ref.p880 : "—"}.`, `Annexe R111-1 C. patr. · annexe règl. 116/2009 (${ref ? ref.eu : "—"}) · règl. 2019/880`);
  if (mat === "bois" && (o.cat === "mobilier" || o.cat === "instrument" || o.cat === "sculpture")) add("species", "pending", "Essences protégées : palissandres, ébènes, acajous", "Dalbergia et espèces inscrites à l'annexe II : certificat intra-UE ou permis CITES sauf exemptions limitées (instruments finis, petits objets finis) ; identifier l'essence avant la vente.", "Règl. (CE) 338/97 · CITES CoP18, annotation 15");
  if (mat === "precieux") add("legal", "required", "Métaux et pierres précieux : garantie, poinçons, traçabilité", "Titre et poinçons, registre spécial ; diamants : certificat de laboratoire, processus de Kimberley pour les bruts ; registre des métaux précieux.", "CGI, art. 521 et s. · règl. (CE) 2368/2002");
  if (mat === "pierre" && prov === "fouilles") add("cultural", "required", "Pierre archéologique : régime des fouilles", "Fragment sculpté ou architectural issu de fouilles : catégorie 1 ou 2 de l'annexe française (certificat à toute valeur), partie B du règlement 2019/880 à l'entrée dans l'Union.", "C. patr., annexe R111-1 · règl. 2019/880, partie B");
  if (mat === "bronze" && o.cat === "sculpture" && !o.tirage && age < 150) add("legal", "pending", "Bronze : tirage et fonte à documenter", "Édition, numéro, fondeur, date de fonte et caractère posthume conditionnent la dénomination, la TVA et le droit de suite.", "Décret n° 81-255, art. 9 · CGI, ann. III, art. 98 A");

  /* Statut de l'objet */
  if (o.cat === "restes") add("legal", "blocked", "Restes humains : commercialisation prohibée", "Le respect dû au corps humain ne cesse pas avec la mort ; restitution organisée par la loi de 2023.", "C. civ., art. 16-1-1 · loi n° 2023-1251");
  if (o.cat === "archeo" && o.creation === "France") add("legal", "required", "Archéologie française : origine licite", "Découvertes postérieures au 8 juillet 2016 : propriété de l'État ; détection non autorisée prohibée.", "C. patr., art. L541-1 · L542-1");
  if (o.cat === "religieux" && o.creation === "France" && o.annee < 1905) add("legal", "required", "Objet cultuel : domaine public possible", "Objets des églises antérieurs à 1905 présumés publics, inaliénables, imprescriptibles.", "Loi du 9 décembre 1905 · CG3P, art. L3111-1");
  if (o.cat === "manuscrit" && o.creation === "France") add("legal", "required", "Archives : caractère privé à établir", "Les archives publiques sont inaliénables ; revendication possible.", "C. patr., art. L212-1");
  if (o.cat === "armes") add("legal", o.annee < 1900 ? "required" : "blocked", o.annee < 1900 ? "Arme ancienne : catégorie D, vente libre aux majeurs" : "Arme postérieure à 1900 : régime des armes", o.annee < 1900 ? "Armes de collection antérieures au 1er janvier 1900 (hors exceptions listées) : acquisition et détention libres pour les majeurs ; identité de l'acquéreur vérifiée ; exportation hors Union soumise au contrôle du matériel de guerre selon le modèle." : "Armes postérieures à 1900 et reproductions à feu : classement A, B ou C ; autorisation, déclaration ou enregistrement ; licence d'exportation.", "C. sécurité intérieure, art. L311-2 · R311-2");
  if (o.cat === "numismatique") add("legal", "required", "Numismatique : origine et statut archéologique", "Monnaies de découverte archéologique : régime des objets archéologiques (État propriétaire depuis 2016 ; sortie à toute valeur) ; collections de plus de cent ans : bien culturel soumis à certificat au-delà du seuil.", "C. patr., art. L541-1 · annexe R111-1 (cat. 14)");
  if (o.annee < 1946 && o.annee > 1800 && (isUE(o.creation) || isUE(o.lieu))) { add("legal", "required", "Spoliations 1933-1945 : recherche obligatoire", "Lost Art, ERR, MNR ; restitution facilitée par la loi de 2023.", "Loi n° 2023-650"); piece("Provenance", "Recherche spoliations 1933-1945", "Lost Art, ERR, MNR"); }
  if (o.cat !== "restes") add("legal", "clear", "Titre du vendeur", "Propriétaire ou mandataire écrit ; concordance identité ↔ titres.", "C. civ., art. 1599 · 2276");
  if (o.artiste !== "anonyme") add("legal", "required", "Attribution : vocabulaire réglementé et fraude artistique", "« signé », « attribué à », « atelier de », « école de », « d'après » — repris dans la garantie. L'apposition frauduleuse d'une signature ou la vente d'une œuvre faussement attribuée est un délit.", "Décret n° 81-255 · loi du 9 février 1895");
  if (sousDroits) add("legal", "required", "Droits d'auteur : moral et reproduction", "Droit moral inaliénable (aucune restauration ou modification sans respect de l'œuvre) ; reproduction au catalogue ou en ligne soumise à autorisation (ADAGP).", "CPI, art. L121-1 · L122-4");
  if (o.cat === "sculpture" && o.tirage) add("legal", "required", "Multiple : mention du tirage", `Édition « ${o.tirage} » : numérotation, fondeur, caractère posthume ; douze épreuves au plus pour l'œuvre originale fiscale.`, "Décret n° 81-255, art. 9 · CGI, ann. III, art. 98 A");
  if (o.cat === "photo") add("legal", "required", "Photographie : tirage et originalité", "Signé, numéroté, trente exemplaires au plus ; tirage d'époque ou postérieur.", "CGI, ann. III, art. 98 A");
  if (o.cat === "bijou") add("legal", "required", "Métaux précieux : garantie et poinçons", "Titre, poinçons, registre spécial ; TVA au taux normal sur la marge.", "CGI, art. 521 et s.");

  /* Bien culturel */
  if (ORIGIN[o.creation] && age > 100) { const [k, d] = ORIGIN[o.creation]; add("cultural", k, `Origine ${o.creation}`, d, "Unesco 1970 · Unidroit 1995"); piece("Provenance", `Preuve de sortie licite de ${o.creation}`, "Licence, déclaration sous serment, publications antérieures"); }
  else if (tiers && age > 100) piece("Provenance", "Diligence Unesco 1970 : historique de sortie", "Bien culturel tiers");
  if (o.creation === "Nigéria" && age > 150) add("cultural", "blocked", "Restitution : demande officielle", "Vente déconseillée sans provenance antérieure à 1897 et consultation du pays d'origine.", "Unesco 1970");

  /* Export */
  if (frontiere && o.cat !== "restes") {
    if (o.lieu === "France") {
      const s = isUE(o.dest) ? seuil(SEUILS_FR) : seuil(SEUILS_UE);
      if (o.douane === "at" || o.douane === "ata") add("export", "clear", "Certificat non exigible : séjour temporaire", "Réexportation sous le régime ; le certificat redevient exigible après mise en libre pratique de plus de deux ans.", "C. patr., art. R111-2");
      else if (s) { add("export", "required", "Certificat d'exportation de bien culturel", `Plus de ${s[0]} ans et ≥ ${s[1].toLocaleString("fr-FR")} €${isUE(o.dest) ? " (intra-Union)" : " (pays tiers)"} : ministère de la Culture, quatre mois ; refus « trésor national » possible, trente mois d'offre d'achat.`, "C. patr., art. L111-2 · décret n° 2020-1718"); authorities.push({ titre: "Demande de certificat d'exportation", dest: "Ministère de la Culture — Service des musées de France", sections: ["Formulaire et lettre", "Notice : auteur, titre, technique, dimensions, date", "État et restaurations", "Provenance", "Bibliographie, expositions, ventes", "Photographies normalisées", "Valeur et justificatifs", "Titre du demandeur"] }); piece("Autorités", "Certificat d'exportation", "Condition suspensive"); due("required", "Décision sur le certificat d'exportation", addMonths(today.toISOString(), 4), "Quatre mois ; refus → trente mois d'offre d'achat."); }
      else add("export", "clear", "Certificat d'exportation : non requis", `${sLib} : seuil de ${(isUE(o.dest) ? sUE : sTiers).toLocaleString("fr-FR")} € ${sAge ? `au-delà de ${sAge} ans ` : ""}non atteint ; justification conservée au dossier.`, "C. patr., art. L111-2 · annexe 1 R111-1");
      if (o.cat === "armes" && !isUE(o.dest)) add("export", "required", "Matériel de guerre : licence selon le modèle", "Certaines armes de collection relèvent du contrôle des exportations de matériel de guerre ; vérifier le classement avant expédition hors Union.", "C. défense, art. L2335-2 · douane.gouv.fr");
    } else if (o.lieu === "Italie") { const simple = o.artiste === "vivant" || age < 70 || o.valeur < 13500; add("export", simple ? "clear" : "required", simple ? "Sortie d'Italie : autocertification" : "Sortie d'Italie : attestato di libera circolazione", simple ? "Artiste vivant, moins de 70 ans ou valeur < 13 500 €." : "Soprintendenza ; délai et risque de notification.", "Codice, art. 65"); if (!simple) authorities.push({ titre: "Attestato di libera circolazione", dest: "MiC — Ufficio Esportazione", sections: ["Scheda", "Fotografie", "Provenienza", "Valore"] }); }
    else if (o.lieu === "Espagne") { const r = age > 100; add("export", r ? "required" : "clear", r ? "Sortie d'Espagne : permiso et taxe" : "Sortie d'Espagne : libre", r ? "Autorisation ministérielle ; taxe progressive 5–30 % à l'exportation définitive." : "Hors inventaire.", "Ley 16/1985, art. 5, 30, 32"); }
    else if (o.lieu === "Allemagne") { const r = age > 75 && o.valeur >= 300000; add("export", r ? "required" : "clear", r ? "Sortie d'Allemagne : Genehmigung" : "Sortie d'Allemagne : sous les seuils", "75 ans et 300 000 € (peintures).", "KGSG, § 24"); }
    else if (o.lieu === "Belgique") add("export", "pending", "Sortie de Belgique : régime régional", "Listes protégées régionales ; licence UE via la Région.", "Décret flamand 2003");
    else if (o.lieu === "Royaume-Uni") { const uk = seuilUK(o), r = age > 50 && o.valeur >= uk; add("export", r ? "required" : "clear", r ? "Sortie du Royaume-Uni : export licence individuelle" : "Sortie du Royaume-Uni : Open General Export Licence", r ? `Au-delà de ${uk.toLocaleString("fr-FR")} £ (${o.cat === "peinture" ? "peintures à l'huile" : uk === 0 ? "manuscrits, archéologie : toute valeur" : "seuil général"}) : licence de l'Arts Council, examen selon les critères Waverley, report possible.` : `Objet de plus de 50 ans sous le seuil de ${uk.toLocaleString("fr-FR")} £ : licence générale ouverte.`, "Export Control Order 2003 · Arts Council England, OGEL"); if (r) authorities.push({ titre: "Export licence application", dest: "Arts Council England", sections: ["Description", "Provenance", "Valuation", "Waverley assessment"] }); }
    else if (["Suisse", "États-Unis", "Hong Kong", "Monaco", "Pays-Bas"].includes(o.lieu)) add("export", "clear", `Sortie de ${o.lieu} : pas de licence générale`, o.lieu === "Suisse" ? "Déclaration détaillée (LTBC)." : "Contrôles à l'importation.", "Droit national");
    else add("export", "blocked", `Sortie de ${o.lieu} : prohibée ou strictement contrôlée`, "Sortie sans autorisation : objet inimportable dans l'Union.", "Droit national · Unesco 1970");
    if (sortieUE && seuil(SEUILS_UE) && o.douane !== "at" && o.douane !== "ata") { add("export", "required", "Licence d'exportation de l'Union", "Sortie du territoire douanier au-delà des seuils ; valable douze mois.", "Règl. (CE) 116/2009"); authorities.push({ titre: "Licence d'exportation UE", dest: "Ministère de la Culture · DGDDI", sections: ["Formulaire", "Certificat national", "Description, photographies", "Destinataire"] }); }
  } else if (o.cat !== "restes") add("export", "clear", "Sans franchissement de frontière", "Aucune formalité.", "—");

  /* Import */
  if (frontiere && o.cat !== "restes") {
    if (entreeUE && tiers) {
      const partieB = o.cat === "archeo" || prov === "fouilles" || prov === "monument" || o.liturgique;
      const partieBprobable = !partieB && prov === "inconnue" && ["religieux", "sculpture", "numismatique", "bijou"].includes(o.cat) && age > 250;
      if ((partieB || partieBprobable) && age > 250) { add("import", "blocked", partieB ? "Licence d'importation UE (partie B) — avant toute mise en libre pratique" : "Licence d'importation UE (partie B) probable — qualification à établir", `${partieB ? "Objet archéologique ou élément de monument, de temple ou d'autel de plus de 250 ans" : "Objet de plus de 250 ans dont la provenance n'établit pas qu'il n'est pas issu d'un monument, d'un temple ou de fouilles : la partie B est probable et s'impose par prudence"} : licence délivrée en France par le ministère de la Culture (Service des musées de France, autorité compétente désignée), déposée dans le système électronique ICG, contrôlée par la douane ; instruction jusqu'à quatre-vingt-dix jours, à toute valeur. Sans licence, l'importation est interdite (régime applicable depuis le 28 juin 2025).`, "Règl. (UE) 2019/880, art. 4 et annexe partie B · règl. d'exéc. (UE) 2021/1079 · douane.gouv.fr"); authorities.push({ titre: "Demande de licence d'importation (partie B) — système ICG", dest: "Ministère de la Culture — Service des musées de France (autorité compétente) · contrôle DGDDI", sections: ["Description standardisée du bien (Object ID)", "Preuve d'exportation licite depuis le pays de création ou de découverte, ou règle des cinq ans", "Titres de propriété successifs et historique", "Photographies normalisées", "Déclaration de l'importateur sur l'honneur", "Justification du caractère non monumental si la partie C est revendiquée"] }); due("blocked", "Instruction de la licence d'importation", addMonths(today.toISOString(), 3), "Pas de libre pratique avant décision."); }
      else if (age > 200 && o.valeur >= 18000) { add("import", "required", "Déclaration de l'importateur (partie C)", "Sculpture, peinture, objet ethnologique, manuscrit ou collection de plus de 200 ans et ≥ 18 000 € : déclaration de licéité de l'exportation et document descriptif (Object ID) déposés dans l'ICG avant la mise en libre pratique ; la douane peut exiger les justificatifs.", "Règl. (UE) 2019/880, art. 5 et annexe partie C"); authorities.push({ titre: "Déclaration de l'importateur (ICG)", dest: "DGDDI", sections: ["Déclaration signée", "Object ID", "Preuve de sortie licite ou règle des cinq ans", "Photographies"] }); }
      else add("import", "clear", "Règlement 2019/880 : sous les seuils", "Interdiction générale des biens illicitement sortis maintenue.", "Règl. (UE) 2019/880, art. 3");
      if (o.creation === "Irak" || o.creation === "Syrie") add("import", "blocked", "Embargo : importation interdite", ORIGIN[o.creation][1], "Règl. 1210/2003 · 36/2012");
    } else if (entreeUE) add("import", "clear", "Bien de l'Union : pas de formalité culturelle", "", "Règl. (UE) 2019/880, art. 2");
    else if (o.dest === "Suisse") { add("import", "required", "Suisse : diligence LTBC", "Déclaration détaillée, diligence, conservation trente ans.", "LTBC, art. 15-19"); if (CPIA.includes(o.creation) || ORIGIN[o.creation]) add("import", "blocked", "Suisse : autorisation de l'État d'origine", "Accord bilatéral : importation illicite sans autorisation d'exportation d'origine.", "LTBC, art. 7"); }
    else if (o.dest === "États-Unis") { const r = CPIA.includes(o.creation) && ["archeo", "religieux", "numismatique"].includes(o.cat); add("import", r ? "blocked" : "clear", r ? "États-Unis : restrictions CPIA" : "États-Unis : pas de formalité culturelle", r ? `Matériel de ${o.creation} sous accord bilatéral : permis d'origine ou preuve antérieure.` : "Déclaration ordinaire, droits nuls, OFAC.", "19 U.S.C. § 2601"); }
    else if (o.dest === "Royaume-Uni") add("import", "clear", "Royaume-Uni : pas de licence d'importation", "TVA à l'importation 5 %.", "Droit britannique");
    else if (o.dest === "Hong Kong") add("import", "clear", "Hong Kong : port franc", "", "—");
    else add("import", "pending", `Entrée en ${o.dest} : régime à charger`, "", "—");
  }

  /* Douane */
  const tva = TVA_IMPORT[o.dest] || "à vérifier";
  if (o.douane === "at") { const fin = addMonths(o.entree, 24), reste = fin ? Math.round((fin - today) / 86400000) : null; add("customs", reste !== null && reste < 90 ? "blocked" : "required", "Admission temporaire : régulariser avant la vente", `Vingt-quatre mois au plus, adresse déclarée, garantie ; toute vente impose la mise en libre pratique (TVA ${TVA_IMPORT[o.lieu] || "locale"}) ou la réexportation.${reste !== null ? ` Échéance ${fmt(fin)} (${reste} jours).` : ""}`, "CDU, art. 250-253"); if (fin) due(reste < 90 ? "blocked" : "required", "Expiration de l'admission temporaire", fin, "Réexporter, entreposer ou mettre en libre pratique ; à défaut, dette douanière."); piece("Douane", "Décision d'admission temporaire et garantie", "Régime"); clauses.push(["Douane", "Régularisation de l'admission temporaire avant livraison ; TVA à la charge convenue"]); }
  else if (o.douane === "ata") { const fin = addMonths(o.entree, 12); add("customs", "required", "Carnet ATA : vente interdite sous le régime", `Exposition ou présentation seulement ; importation définitive (TVA ${TVA_IMPORT[o.lieu] || "locale"}) avant tout transfert. Validité douze mois${fin ? `, échéance ${fmt(fin)}` : ""}.`, "Convention d'Istanbul 1990"); if (fin) due("required", "Expiration du carnet ATA", fin, "Apurement des volets."); piece("Douane", "Carnet e-ATA et volets", "Régime"); }
  else if (o.douane === "entrepot") { add("customs", "required", "Entrepôt douanier ou port franc : vente en suspension", `Pas de limite de séjour ; la sortie vers ${o.dest} vaut importation (TVA ${tva}, 2019/880, LTBC) ; diligence renforcée en port franc.`, "CDU, art. 237-242 · directive 2018/843"); piece("Douane", "Certificat d'entreposage et inventaire", "Régime"); clauses.push(["Douane", "Vente sous entrepôt : sortie, formalités et TVA à la charge de l'acheteur"]); }
  else if (o.douane === "tiers" || (!isUE(o.lieu) && isUE(o.dest))) { add("customs", "required", `Importation définitive : TVA ${tva}`, `Mise en libre pratique dans ${o.dest} : déclaration, valeur, droits nuls (chap. 97), TVA ; ou admission temporaire si vente incertaine.`, "CDU · CGI, art. 278-0 bis"); clauses.push(["Douane", "Importation définitive : TVA et formalités à la charge convenue ; incoterm"]); }
  else if (sortieUE) { add("customs", "info", `Exportation définitive : exonération ; à l'arrivée ${tva}`, "Preuve de sortie ; retour en franchise dans les trois ans en l'état.", "CDU, art. 203 · CGI, art. 262"); due("info", "Limite du retour en franchise", addMonths(today.toISOString(), 36), "Réimportation en l'état exonérée."); }
  else if (frontiere) add("customs", "clear", "Circulation intra-Union", "TVA intracommunautaire selon les parties.", "Directive 2006/112/CE");
  else add("customs", "clear", "Aucune opération douanière", `TVA ${original ? "5,5 %" : "marge"}.`, "CGI, art. 278-0 bis · 297 A");

  /* Sanctions, espèces */
  if (o.dest === "Russie" || o.lieu === "Russie") add("sanctions", "blocked", "Sanctions de l'Union : opération interdite", "Biens de luxe dont œuvres d'art de plus de 300 €.", "Règl. (UE) 833/2014, art. 3 nonies"); else add("sanctions", "clear", "Criblage sanctions et personnes exposées", "UE, ONU, OFAC, HMT.", "Règl. (UE) 2024/1624");
  if (protege) {
    const antique = o.annee < 1947, instr75 = o.cat === "instrument" && o.annee < 1975;
    if (sortieUE && !instr75 && !(antique && o.acheteur === "public")) add("species", "blocked", "Ivoire et espèces : réexportation hors Union suspendue", "Depuis 2021, les certificats de réexportation d'ivoire travaillé ne sont délivrés que pour les instruments antérieurs à 1975 et les antiquités pré-1947 acquises par des musées.", "Orientation 2021/C 528/03 · règl. 865/2006 rév.");
    else add("species", antique || instr75 ? "required" : "blocked", antique || instr75 ? "Espèce protégée : certificat intracommunautaire" : "Espèce protégée : commerce suspendu", antique || instr75 ? "Objet travaillé antérieur à 1947 (instrument : 1975) : certificat intra-UE de traçabilité obligatoire pour toute vente ; le certificat « instrument de musique » n'autorise ni vente ni cession." : "Ivoire postérieur à 1947 : commerce suspendu ; autres espèces : permis CITES.", "Règl. (CE) 338/97 · 865/2006 · arrêté du 4 mai 2017");
    piece("Autorités", "Certificat intra-UE (CITES) ou justification d'antériorité", "Espèces protégées"); authorities.push({ titre: "Certificat intra-UE (CITES)", dest: "DREAL — i-CITES", sections: ["Espèce et spécimen", "Antériorité (1947 ou 1975)", "Photographies", "Propriété"] });
  } else add("species", "clear", "Aucun matériau protégé déclaré", "", "Règl. (CE) 338/97");

  /* Conformité, fiscalité, vente */
  if (o.valeur >= 10000) { add("aml", "required", "Vigilance anti-blanchiment", `Identification, bénéficiaires effectifs, origine des fonds, conservation cinq ans${o.dest === "Monaco" || o.lieu === "Monaco" ? " ; Monaco loi n° 1.362" : ""}.`, "CMF, art. L561-2 (17°) · règl. (UE) 2024/1624"); piece("Parties", "Identité vérifiée des parties", "Vigilance"); piece("Parties", "Bénéficiaire effectif et origine des fonds", "Vigilance"); piece("Parties", "Criblage sanctions / PPE", "Vigilance"); }
  else add("aml", "clear", "Sous le seuil de vigilance renforcée", "", "CMF, art. L561-2");
  add("tax", "info", original ? "TVA : œuvre d'art originale, 5,5 %" : "TVA : objet de collection, marge au taux normal", "", "CGI, art. 278-0 bis · 297 A");
  if (sousDroits && o.valeur >= 750 && structure !== "collectionneur") { const v = o.valeur, ds = Math.min(12500, Math.round(Math.min(v, 50000) * 0.04 + Math.max(0, Math.min(v, 200000) - 50000) * 0.03 + Math.max(0, Math.min(v, 350000) - 200000) * 0.01 + Math.max(0, Math.min(v, 500000) - 350000) * 0.005 + Math.max(0, v - 500000) * 0.0025)); add("tax", "required", `Droit de suite : ≈ ${ds.toLocaleString("fr-FR")} €`, "4 % à 0,25 %, plafond 12 500 €, à la charge du vendeur.", "CPI, art. L122-8"); piece("Parties", "Calcul du droit de suite", "Contrat"); }
  if (o.acheteur === "public") { add("consumer", "required", "Acquisition par une collection publique", "Commission scientifique des acquisitions, délibération ; inaliénabilité ; garantie d'éviction renforcée.", "C. patr., art. L451-5"); authorities.push({ titre: "Dossier d'acquisition — commission scientifique", dest: "Musée acquéreur · DRAC / SMF", sections: ["Notice scientifique", "Provenance et spoliations", "Expertise, état", "Prix", "Photographies", "Titre, éviction"] }); }
  if (o.mode === "distance" && o.acheteur === "particulier") { add("consumer", "required", "Vente à distance à un consommateur", "Rétractation quatorze jours (hors enchères), information précontractuelle, garantie de conformité.", "C. consom., art. L221-18"); due("info", "Fin du délai de rétractation", new Date(today.getTime() + 14 * 86400000), "Quatorze jours après livraison."); }
  else if (o.acheteur === "particulier") add("consumer", "info", "Acheteur consommateur", "Garantie de conformité deux ans ; médiateur.", "C. consom., art. L217-3");
  if (o.cat === "armes" && o.acheteur === "particulier") piece("Parties", "Pièce d'identité de l'acquéreur (majeur)", "Armes de catégorie D");
  if (structure === "maison") { if (o.mode === "encheres" && o.dest === "France") { add("consumer", "required", "Droit de préemption de l'État", "Quinze jours ; transfert différé.", "C. patr., art. L123-1"); due("required", "Fin du délai de préemption", new Date(today.getTime() + 15 * 86400000), "Quinze jours après l'adjudication."); } piece("Structure", "Mandat de vente signé", "Réquisition"); due("required", "Procès-verbal de vente", new Date(today.getTime() + 86400000), "Jour ouvré suivant."); }
  if (o.source === "second" && structure !== "conseiller") piece("Structure", "Inscription au livre de police", structure === "maison" ? "À l'entrée" : "Description, provenance, identité du vendeur");
  due("info", "Prescription de l'action en nullité", addMonths(today.toISOString(), 60), "Cinq ans de la découverte."); due("info", "Conservation du dossier", addMonths(today.toISOString(), 120), "Dix ans.");
  piece("Provenance", "Chaîne de propriété documentée", "Factures, catalogues, expositions"); piece("Provenance", "Registres d'œuvres volées interrogés", "ALR, Interpol, OCBC");
  if (o.artiste === "vivant") piece("Attribution", "Certificat d'authenticité de l'artiste", "Attribution"); else if (o.artiste === "anonyme") piece("Attribution", "Rapport d'expert : datation, matériaux, comparables", "Fourni par vous"); else piece("Attribution", "Certificat du comité ou des ayants droit", "Fourni par vous");
  piece("État", "Rapport d'état (macro, lumière rasante, UV)", "Jour de la vente"); piece("Parties", "Titre de propriété ou mandat", "Concordance");
  const seq = o.valeur >= 50000 || frontiere;

  const worst = (doms) => { const ks = rules.filter((r) => doms.includes(r.domain)).map((r) => r.kind); return ks.includes("blocked") ? "blocked" : ks.includes("required") ? "required" : ks.includes("pending") ? "pending" : "clear"; };
  const DOMS = { "Statut juridique": ["legal", "cultural"], "Export": ["export"], "Import": ["import"], "Douane & fiscalité": ["customs", "tax"], "Sanctions & espèces": ["sanctions", "species"], "Conformité & vente": ["aml", "consumer"] };
  const clearance = Object.entries(DOMS).map(([k, d]) => [k, worst(d), d]);
  const overall = clearance.some((c) => c[1] === "blocked") ? "blocked" : clearance.some((c) => ["required", "pending"].includes(c[1])) ? "required" : "clear";

  const C = [["Parties", "Vendeur et acheteur identifiés, bénéficiaires effectifs, qualité justifiée"], ["Désignation", `Vocabulaire réglementé (décret 1981)${o.tirage ? `, tirage « ${o.tirage} »` : ""} ; garantie d'attribution calibrée`], ["Déclarations", "Annexées, valeur d'aveu (art. 1383) ; dol (art. 1137) ; éviction (art. 1626)"]];
  if (rules.some((r) => /Certificat d'exportation|Licence d'exportation|attestato|export licence|Genehmigung|permiso|Matériel de guerre/i.test(r.titre))) C.push(["Condition suspensive", "Autorisations d'exportation ; refus → résolution sans indemnité"]);
  if (rules.some((r) => /Licence d'importation|Déclaration de l'importateur|LTBC|CPIA/.test(r.titre))) C.push(["Condition suspensive", "Recevabilité de l'importation ; à défaut, résolution"]);
  if (rules.some((r) => r.titre.startsWith("Droit de préemption"))) C.push(["Préemption", "Transfert différé de quinze jours"]);
  C.push(...clauses);
  if (o.valeur >= 10000) C.push(["Vigilance", "Coopération anti-blanchiment ; paiement par virement"]);
  if (rules.some((r) => r.titre.startsWith("Droit de suite"))) C.push(["Droit de suite", "Montant, débiteur, versement"]);
  if (sousDroits) C.push(["Droits d'auteur", "Droit moral et reproduction réservés ; aucune cession implicite"]);
  C.push(["Prix", `${o.valeur.toLocaleString("fr-FR")} € ${original ? "TVA 5,5 %" : "TVA sur la marge"} ; ${seq ? "séquestre, libération au PV de réception" : "paiement à la livraison"}`], ["Livraison", "Délai ferme, transporteur d'art, assurance clou à clou, risques à réception, pénalités"], ["Frais", "Liste exhaustive et chiffrée — aucun frais non listé n'est dû"], ["Réception", "Rapport d'état contradictoire ; réserves sous quarante-huit heures"], ["Propriété", "Réserve de propriété jusqu'à complet paiement"]);
  if (o.mode === "distance" && o.acheteur === "particulier") C.push(["Consommateur", "Rétractation, conformité, médiateur"]);
  C.push(["Litiges", "Loi, médiation préalable, juridiction ; dossier dix ans"]);
  deadlines.sort((a, b) => a.date - b.date);
  return { rules, pieces, clauses: C, authorities, deadlines, clearance, overall, age, tiers, original, seq, actions: rules.filter((r) => ["required", "pending"].includes(r.kind)).length, bloquantes: rules.filter((r) => r.kind === "blocked").length };
}

/* ============================================================ UI — ARTVELCHIV, interface minimale (modèle Artsy) */
const LOGO = "/assets/logo.png";
const LOGO_LIGHT = "/assets/logo-light.png";
const UI = { bg: "#FFFFFF", paper: "#FAF7F0", ink: "#15140F", soft: "#4A4841", mute: "#8E887B", line: "#EAE6DC", field: "#F3F0E8", vert: "#1D4633", vertDeep: "#123024", vertSoft: "#E6EEE8", jaune: "#F2C21B", claret: "#8A2A2A", claretSoft: "#F6E7E6", warn: "#8F5A1B", warnSoft: "#F6ECDD", info: "#3F5F8A", infoSoft: "#E7EDF5", ok: "#2E6349", okSoft: "#E4EFE7" };
const TONE = { blocked: [UI.claret, UI.claretSoft], required: [UI.warn, UI.warnSoft], pending: [UI.info, UI.infoSoft], info: [UI.mute, "#EFEBE2"], clear: [UI.ok, UI.okSoft] };
const LABEL = { blocked: "Point à résoudre", required: "À obtenir", pending: "À vérifier", info: "Information", clear: "Documenté" };
const EXTRA = `
@keyframes avOut { to { opacity: 0; visibility: hidden; } }
@keyframes avLogo { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: none; } }
@keyframes avUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
@keyframes avVeil { from { opacity: 0; } to { opacity: 1; } }
@keyframes avIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.av-splash { animation: avOut .7s ease 1.7s both; }
.av-splash .l { animation: avLogo .9s cubic-bezier(.2,.7,.2,1) both; }
.av-splash .w { animation: avIn .9s cubic-bezier(.2,.7,.2,1) .35s both; }
.av-sheet { animation: avUp .42s cubic-bezier(.2,.8,.2,1) both; }
.av-veil { animation: avVeil .25s ease both; }
.av-fade { animation: avIn .28s cubic-bezier(.2,.7,.2,1) both; }
.av-press { transition: opacity .15s ease; } .av-press:active { opacity: .6; }
.av-x { scrollbar-width: none; } .av-x::-webkit-scrollbar { display: none; }
select, input { -webkit-appearance: none; appearance: none; }
input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
`;
const TAB_H = 84, HEAD_H = 56;

/* ---------- primitives ---------- */
const Logo = ({ size = 40, light }) => <img src={light ? LOGO_LIGHT : LOGO} alt="ARTVELCHIV" style={{ width: size, height: "auto", display: "block" }} />;
const Wordmark = ({ size = 16, color = UI.vert }) => <span style={{ ...sans, fontWeight: 300, fontSize: size, letterSpacing: "0.38em", color, textTransform: "uppercase", paddingLeft: "0.1em", whiteSpace: "nowrap" }}>ARTVELCHIV</span>;
const H1 = ({ children, sub, style }) => <div style={{ padding: "18px 0 14px", ...style }}><div style={{ ...sans, fontSize: 34, fontWeight: 500, lineHeight: 1.08, letterSpacing: "-0.015em", color: UI.ink }}>{children}</div>{sub && <div style={{ ...sans, fontSize: 15, color: UI.mute, marginTop: 8, lineHeight: 1.5 }}>{sub}</div>}</div>;
const H2 = ({ children, right, style }) => <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "22px 0 10px", ...style }}><div style={{ ...sans, fontSize: 20, fontWeight: 500, color: UI.ink }}>{children}</div>{right}</div>;
const Micro = ({ children, style }) => <div style={{ ...sans, fontSize: 12, color: UI.mute, ...style }}>{children}</div>;
const Pill = ({ k, txt }) => { const [c, bg] = TONE[k]; return <span style={{ ...sans, display: "inline-flex", alignItems: "center", gap: 6, background: bg, color: c, fontSize: 12, fontWeight: 500, padding: "5px 10px", borderRadius: 999, whiteSpace: "nowrap" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />{txt || LABEL[k]}</span>; };
const Btn = ({ children, onClick, primary, dark, outline, full, small, disabled }) => <button onClick={onClick} disabled={disabled} className="av-press" style={{ ...sans, fontWeight: 500, fontSize: small ? 14 : 16, padding: small ? "10px 18px" : "16px 26px", borderRadius: 999, cursor: disabled ? "default" : "pointer", border: outline ? `1px solid ${UI.ink}` : "1px solid transparent", background: primary ? UI.vert : dark ? UI.ink : outline ? "transparent" : UI.field, color: primary || dark ? "#FFFFFF" : UI.ink, width: full ? "100%" : undefined, opacity: disabled ? 0.4 : 1 }}>{children}</button>;
const Chip = ({ children, on, onClick, icon }) => <button onClick={onClick} className="av-press" style={{ ...sans, display: "inline-flex", alignItems: "center", gap: 7, flexShrink: 0, border: "none", cursor: "pointer", padding: "10px 16px", borderRadius: 999, fontSize: 14, fontWeight: 500, background: on ? UI.vert : UI.field, color: on ? "#FFFFFF" : UI.ink }}>{icon}{children}</button>;
const Chev = ({ open, color = UI.ink }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: open ? "rotate(90deg)" : "none", transition: "transform .2s" }}><path d="M9 6l6 6-6 6" /></svg>;
const Row = ({ children, onClick, last, style }) => <div onClick={onClick} className={onClick ? "av-press" : undefined} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 0", borderBottom: last ? "none" : `1px solid ${UI.line}`, cursor: onClick ? "pointer" : "default", ...style }}>{children}</div>;
const Field = ({ label, children }) => <div style={{ marginBottom: 18 }}><div style={{ ...sans, fontSize: 13, color: UI.mute, marginBottom: 7 }}>{label}</div>{children}</div>;
const inp = { ...sans, width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${UI.ink}`, borderRadius: 0, padding: "10px 0", color: UI.ink, fontSize: 17, outline: "none", boxSizing: "border-box" };
const Sel = ({ value, onChange, options }) => <div style={{ position: "relative" }}><select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inp, paddingRight: 28, cursor: "pointer" }}>{options.map((o) => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>)}</select><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={UI.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", right: 2, top: 15, pointerEvents: "none" }}><path d="M6 9l6 6 6-6" /></svg></div>;
const Seg = ({ value, onChange, options }) => <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{options.map(([v, l]) => <Chip key={v} on={value === v} onClick={() => onChange(v)}>{l}</Chip>)}</div>;
const Tile = ({ hue, label, w = "100%", ratio = 1, radius = 0, fs = 28 }) => <div style={{ width: w, aspectRatio: String(ratio), borderRadius: radius, background: `linear-gradient(150deg, ${hue}, #14140F)`, display: "flex", alignItems: "center", justifyContent: "center", ...serifU, color: "rgba(250,245,235,0.92)", fontSize: fs, flexShrink: 0 }}>{label}</div>;
const Ring = ({ v, size = 44 }) => { const c = v >= 95 ? UI.vert : v >= 75 ? UI.ok : v >= 55 ? UI.warn : UI.claret, r = (size - 5) / 2, circ = 2 * Math.PI * r; return <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}><svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={UI.line} strokeWidth="3" /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - v / 100)} style={{ transition: "stroke-dashoffset .6s ease" }} /></svg><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", ...sans, fontSize: size * 0.28, fontWeight: 500, color: c }}>{v}</div></div>; };
const Ico = ({ name, active }) => { const c = active ? UI.ink : "#6F6A5F"; const p = { fill: "none", stroke: c, strokeWidth: active ? 2.1 : 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "accueil") return <svg width="26" height="26" viewBox="0 0 24 24"><path {...p} d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z" /></svg>;
  if (name === "recherche") return <svg width="26" height="26" viewBox="0 0 24 24"><circle {...p} cx="11" cy="11" r="7" /><path {...p} d="M20 20l-3.5-3.5" /></svg>;
  if (name === "echeances") return <svg width="26" height="26" viewBox="0 0 24 24"><rect {...p} x="4" y="5" width="16" height="15" rx="1.5" /><path {...p} d="M4 10h16M8 3v4M16 3v4" /></svg>;
  if (name === "archive") return <svg width="26" height="26" viewBox="0 0 24 24"><path {...p} d="M4 7h16v13H4zM3 4h18v3H3zM10 11h4" /></svg>;
  return <svg width="26" height="26" viewBox="0 0 24 24"><circle {...p} cx="12" cy="8" r="4" /><path {...p} d="M5 20a7 7 0 0 1 14 0" /></svg>; };
const Back = ({ onClick, label = "Retour" }) => <button onClick={onClick} className="av-press" style={{ ...sans, display: "flex", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", fontSize: 16, color: UI.ink, padding: 0 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={UI.ink} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>{label}</button>;
const Base = ({ base }) => base && base !== "—" ? <div style={{ ...mono, fontSize: 11, color: UI.vert, marginTop: 8 }}>{base}</div> : null;

/* ---------- écrans d'entrée ---------- */
function Splash() {
  return <div className="av-splash" style={{ position: "fixed", inset: 0, zIndex: 100, background: UI.vertDeep, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26, pointerEvents: "none" }}>
    <div className="l"><Logo size={128} light /></div>
    <div className="w" style={{ textAlign: "center" }}><Wordmark size={26} color="#FAF5EB" /><div style={{ ...sans, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: UI.jaune, marginTop: 14 }}>The art transaction standard</div></div>
  </div>;
}
function Gate({ onOk, code }) {
  const [pin, setPin] = useState(""), [err, setErr] = useState(false);
  const check = () => (pin.trim().toUpperCase() === String(code).toUpperCase() ? onOk() : setErr(true));
  return <div style={{ minHeight: "100vh", background: UI.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 28, ...sans }}>
    <style>{FONTS}{EXTRA}</style>
    <div className="av-fade" style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center" }}><Logo size={96} /></div>
      <div style={{ marginTop: 20 }}><Wordmark size={22} /></div>
      <div style={{ fontSize: 11, letterSpacing: "0.26em", textTransform: "uppercase", color: UI.mute, marginTop: 12 }}>Accès privé</div>
      <input type="password" value={pin} onChange={(e) => { setPin(e.target.value); setErr(false); }} onKeyDown={(e) => e.key === "Enter" && check()} placeholder="Code d'accès" style={{ ...inp, ...mono, marginTop: 34, textAlign: "center", letterSpacing: "0.2em", borderBottomColor: err ? UI.claret : UI.ink }} />
      {err && <div style={{ fontSize: 13, color: UI.claret, marginTop: 8 }}>Code incorrect.</div>}
      <div style={{ marginTop: 22 }}><Btn dark full onClick={check}>Entrer</Btn></div>
      <div style={{ fontSize: 12, color: UI.mute, marginTop: 26, lineHeight: 1.6 }}>Démonstrateur confidentiel. Données fictives ; règles validées à date par les équipes ARTVELCHIV.</div>
    </div>
  </div>;
}
function Onboarding({ onClose }) {
  const pts = [["Décrivez", "L'œuvre, sa provenance connue, l'endroit où elle se trouve, sa destination et les parties à la vente."], ["Préparez", "Les obligations identifiées, les pièces attendues et les échéances à suivre, chacune avec sa source."], ["Documentez", "Le dossier de demande, le rapport acheteur et le projet de contrat, prêts à être relus et remis."]];
  return <div className="av-veil" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(21,20,15,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
    <div className="av-sheet" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto", background: UI.bg, borderRadius: "22px 22px 0 0", padding: "12px 24px 28px", boxSizing: "border-box" }}>
      <div style={{ width: 36, height: 4, borderRadius: 2, background: UI.line, margin: "0 auto 22px" }} />
      <Wordmark size={14} />
      <div style={{ ...sans, fontSize: 28, fontWeight: 500, lineHeight: 1.12, letterSpacing: "-0.01em", margin: "14px 0 8px" }}>Préparez chaque vente d'art avec un dossier clair.</div>
      <div style={{ ...sans, fontSize: 15, color: UI.soft, lineHeight: 1.55, marginBottom: 6 }}>Identifiez les obligations liées à l'œuvre et à son parcours, réunissez les justificatifs et préparez les documents de la transaction.</div>
      {pts.map(([t, d], i) => <Row key={t} last={i === 2} style={{ alignItems: "flex-start" }}><div style={{ ...sans, fontSize: 22, fontWeight: 300, color: UI.vert, width: 30, flexShrink: 0 }}>{i + 1}</div><div><div style={{ ...sans, fontSize: 17, fontWeight: 500 }}>{t}</div><div style={{ ...sans, fontSize: 14, color: UI.soft, lineHeight: 1.5, marginTop: 3 }}>{d}</div></div></Row>)}
      <div style={{ marginTop: 16 }}><Btn dark full onClick={onClose}>Commencer</Btn></div>
    </div>
  </div>;
}

/* ---------- documents (exemples consultables) ---------- */
function DocView({ kind, o, q, structure, vocab, onBack }) {
  const date = "30 septembre 2026";
  const Sec = ({ t, children }) => <div style={{ marginTop: 22 }}><div style={{ ...sans, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: UI.mute, marginBottom: 8 }}>{t}</div>{children}</div>;
  const Line = ({ k, v }) => <div style={{ display: "grid", gridTemplateColumns: "118px 1fr", gap: 12, padding: "9px 0", borderTop: `1px solid ${UI.line}`, ...sans, fontSize: 14 }}><span style={{ color: UI.mute }}>{k}</span><span style={{ color: UI.ink, lineHeight: 1.5 }}>{v}</span></div>;
  const titles = { rapport: "Rapport acheteur", demande: "Dossier de demande", contrat: "Projet de contrat" };
  const customs = q.rules.find((r) => r.domain === "customs");
  return <div className="av-fade" style={{ minHeight: "100vh", background: UI.bg }}>
    <div style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(255,255,255,0.94)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: `1px solid ${UI.line}`, height: HEAD_H, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}><Back onClick={onBack} /><span style={{ ...sans, fontSize: 15, fontWeight: 500 }}>{titles[kind]}</span><span style={{ width: 70 }} /></div>
    <div style={{ padding: "22px 20px 120px" }}>
      <div style={{ background: UI.paper, padding: "26px 22px", border: `1px solid ${UI.line}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${UI.ink}`, paddingBottom: 12 }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Logo size={28} /><Wordmark size={12} /></div><span style={{ ...mono, fontSize: 11, color: UI.mute }}>{o.id}</span></div>
        <div style={{ ...sans, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: UI.vert, marginTop: 18 }}>{titles[kind]} · exemple</div>
        <div style={{ ...serifU, fontSize: 24, lineHeight: 1.2, marginTop: 8 }}>{o.titre || o.nom}</div>
        <Micro style={{ marginTop: 6 }}>{o.lieu} → {o.dest} · {o.valeur.toLocaleString("fr-FR")} € · {date}</Micro>

        {kind === "rapport" && <>
          <Sec t="Ce qui a été vérifié"><Line k="Vendeur" v="Identité vérifiée, qualité justifiée, criblage sanctions négatif." /><Line k="Titre" v="Titre de propriété ou mandat, concordance avec l'identité du vendeur." /><Line k="Registres" v="Art Loss Register, Interpol, OCBC interrogés ; aucune inscription connue à la date du rapport." /></Sec>
          <Sec t="Ce qui a été déclaré par le vendeur"><Line k="Attribution" v={o.artiste === "anonyme" ? "Non attribuée ; rapport d'expert joint." : `« ${vocab} » au sens du décret du 3 mars 1981.`} /><Line k="État" v="Rapport photographique annexé ; restaurations selon déclaration." /><Line k="Provenance" v={`Chaîne de propriété telle que déclarée${o.annee < 1946 && o.annee > 1800 ? " ; recherche de spoliations 1933-1945 effectuée" : ""}.`} /></Sec>
          <Sec t="Obligations identifiées et statut">{q.clearance.map(([d, s]) => <Line key={d} k={d} v={<Pill k={s} />} />)}</Sec>
          <Sec t="Douane et fiscalité"><Line k="Régime" v={customs ? customs.titre : "—"} /><Line k="TVA" v={q.original ? "Œuvre originale, 5,5 %" : "Objet de collection, marge au taux normal"} /></Sec>
          <Sec t="Ce que ce rapport ne garantit pas"><div style={{ ...sans, fontSize: 14, color: UI.soft, lineHeight: 1.55, borderTop: `1px dashed ${UI.line}`, paddingTop: 10 }}>L'authenticité de l'œuvre en tant que telle, hors expertises jointes ; l'état mécanique ; la valeur. Les décisions des autorités saisies restent les leurs.</div></Sec>
        </>}
        {kind === "demande" && <>
          {q.authorities.length ? q.authorities.map((a) => <Sec key={a.titre} t={a.titre}><Line k="Destinataire" v={a.dest} />{a.sections.map((s) => <Line key={s} k="Pièce" v={s} />)}</Sec>) : <Sec t="Autorités"><div style={{ ...sans, fontSize: 14, color: UI.soft }}>Aucune autorité à saisir pour cette vente.</div></Sec>}
          <Sec t="Extrait du registre des objets mobiliers"><Line k="Entrée" v="Numéro d'ordre, date, description et marques, identité et pièce du vendeur, prix." /></Sec>
          <Sec t="Ce que ce dossier ne fait pas"><div style={{ ...sans, fontSize: 14, color: UI.soft, lineHeight: 1.55, borderTop: `1px dashed ${UI.line}`, paddingTop: 10 }}>Il prépare la demande dans l'ordre attendu par son destinataire ; il ne constitue pas l'autorisation, qui relève de l'autorité compétente.</div></Sec>
        </>}
        {kind === "contrat" && <>
          <Sec t="Parties"><Line k="Vendeur" v={structure === "maison" ? "Le mandant, représenté par la maison de vente" : "Le vendeur, propriétaire ou mandataire"} /><Line k="Acheteur" v={o.acheteur === "public" ? "Personne publique" : o.acheteur === "particulier" ? "Consommateur" : "Professionnel"} /></Sec>
          <Sec t={`Clauses préparées à partir du dossier (${q.clauses.length})`}>{q.clauses.map(([k, v], i) => <Line key={i} k={k} v={v} />)}</Sec>
          <Sec t="Statut du document"><div style={{ ...sans, fontSize: 14, color: UI.soft, lineHeight: 1.55, borderTop: `1px dashed ${UI.line}`, paddingTop: 10 }}>Projet préparé à partir des informations du dossier, à relire par les parties et leurs conseils avant signature. Annexes : rapport acheteur, déclarations signées, rapport d'état, pièces indexées, calendrier.</div></Sec>
        </>}
        <div style={{ marginTop: 26, paddingTop: 12, borderTop: `1px solid ${UI.ink}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}><Micro>Version des règles : 3 septembre 2026</Micro><Micro>SHA-256</Micro></div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}><Btn outline full onClick={() => {}}>Partager</Btn><Btn dark full onClick={() => {}}>Exporter en PDF</Btn></div>
    </div>
  </div>;
}

/* ============================================================ application */
export default function Artvelchiv({ pin = DEFAULT_PIN, locked = true }) {
  const [splash, setSplash] = useState(true);
  useEffect(() => { const t = setTimeout(() => setSplash(false), 2500); return () => clearTimeout(t); }, []);
  const [gate, setGate] = useState(locked);
  const [intro, setIntro] = useState(() => { try { return typeof localStorage !== "undefined" && !localStorage.getItem("av_intro_v4"); } catch (e) { return true; } });
  const closeIntro = () => { try { localStorage.setItem("av_intro_v4", "1"); } catch (e) {} setIntro(false); };
  const [structure, setStructure] = useState("galerie");
  const [tab, setTab] = useState("accueil");
  const [screen, setScreen] = useState("home");      // home | record | doc
  const [docKind, setDocKind] = useState("rapport");
  const [o, setO] = useState(RECORDS[0]);
  const [step, setStep] = useState(0);
  const [joint, setJoint] = useState({});
  const [decl, setDecl] = useState({});
  const [vocab, setVocab] = useState("signé");
  const [open, setOpen] = useState(null);
  const [structDone, setStructDone] = useState({});
  const [query, setQuery] = useState("");
  const [catF, setCatF] = useState(null);
  const [archSeg, setArchSeg] = useState("cours");
  const [echSeg, setEchSeg] = useState("tous");
  const q = useMemo(() => analyse(o, structure), [o, structure]);
  const all = useMemo(() => RECORDS.map((d, i) => ({ d, i, a: analyse(d, structure) })), [structure]);
  const set = (k) => (v) => setO((x) => ({ ...x, [k]: v }));
  const DECL_Q = ["Propriétaire, ou mandataire écrit ?", "Restaurée, rentoilée ou modifiée ?", "Présentée sans succès à un comité ou à un expert ?", "Litige, revendication ou saisie ?", "Sortie d'un pays sous restriction après l'entrée en vigueur de celle-ci ?", "Matériaux d'espèces protégées ?", "Toutes les pièces de provenance connues versées ?"];
  const nJ = q.pieces.filter((p) => joint[p.titre]).length, nD = Object.keys(decl).length;
  const indice = Math.round((nJ / Math.max(1, q.pieces.length)) * 70 + (nD / DECL_Q.length) * 30);
  const STEPS = ["Décrire", "Obligations", "Douane", "Pièces", "Vérifications", "Demandes", "Rapport", "Contrat", "Clôture"];
  const go = (s) => { setScreen(s); window.scrollTo(0, 0); };
  const openRecord = (d, st = 0) => { setO(d); setJoint({}); setDecl({}); setStep(st); setOpen(null); go("record"); };
  const openDoc = (d, kind) => { setO(d); setDocKind(kind); go("doc"); };
  const [sLabel, sList] = STRUCT[structure], sd = structDone[structure] || {}, sOk = sList.filter((_, i) => sd[i] !== false).length;
  const groups = [...new Set(q.pieces.map((p) => p.group))];
  const GROUPS = [["Statut de l'objet", ["legal", "cultural"]], ["Circulation", ["export", "import"]], ["Douane et fiscalité", ["customs", "tax"]], ["Conformité et vente", ["aml", "sanctions", "species", "consumer"]]];
  const STRUCT_NAMES = { galerie: "Galerie", marchand: "Marchand, antiquaire", maison: "Maison de vente", conseiller: "Conseiller, courtier" };
  const deadlines = useMemo(() => all.flatMap(({ d, a }) => a.deadlines.map((x) => ({ ...x, rec: d }))).sort((a, b) => a.date - b.date), [all]);

  if (gate) return <>{splash && <Splash />}<Gate code={pin} onOk={() => setGate(false)} /></>;

  /* --- sous-composants dépendant de l'état --- */
  const RecordRow = ({ d, i, a, last }) => <Row onClick={() => openRecord(d)} last={last}><Tile hue={d.hue} label={String(i + 1)} w={56} fs={20} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ ...sans, fontSize: 16, fontWeight: 500, lineHeight: 1.25 }}>{d.nom}</div><Micro style={{ marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.lieu} → {d.dest} · {d.valeur.toLocaleString("fr-FR")} €</Micro></div><Pill k={a.overall} /></Row>;
  const RecordCard = ({ d, i, a }) => <div onClick={() => openRecord(d)} className="av-press" style={{ cursor: "pointer" }}><Tile hue={d.hue} label={String(i + 1)} ratio={0.82} fs={34} /><div style={{ ...sans, fontSize: 15, fontWeight: 500, marginTop: 10, lineHeight: 1.25 }}>{d.nom}</div><Micro style={{ marginTop: 3 }}>{d.lieu} → {d.dest}</Micro><Micro style={{ marginTop: 2, color: UI.ink }}>{d.valeur.toLocaleString("fr-FR")} €</Micro><div style={{ marginTop: 8 }}><Pill k={a.overall} /></div></div>;
  const RuleRow = ({ r, last }) => { const isOpen = open === r.titre; return <div style={{ borderBottom: last ? "none" : `1px solid ${UI.line}` }}><Row onClick={() => setOpen(isOpen ? null : r.titre)} last><span style={{ ...sans, flex: 1, fontSize: 16, lineHeight: 1.35 }}>{r.titre}</span><Pill k={r.kind} /><Chev open={isOpen} color={UI.mute} /></Row>{isOpen && r.detail && <div className="av-fade" style={{ padding: "0 0 16px" }}><div style={{ ...sans, fontSize: 14.5, color: UI.soft, lineHeight: 1.6 }}>{r.detail}</div><Base base={r.base} /></div>}</div>; };
  const DocCard = ({ kind, t, d, rec }) => <div onClick={() => openDoc(rec, kind)} className="av-press" style={{ cursor: "pointer", background: UI.paper, border: `1px solid ${UI.line}`, padding: "18px 16px", flex: "0 0 240px" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><Logo size={22} /><Micro style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>Exemple</Micro></div><div style={{ ...sans, fontSize: 17, fontWeight: 500, marginTop: 16 }}>{t}</div><Micro style={{ marginTop: 4, lineHeight: 1.45 }}>{d}</Micro><Micro style={{ marginTop: 12, color: UI.vert }}>{rec.nom} →</Micro></div>;
  const Search = ({ auto }) => <div style={{ display: "flex", alignItems: "center", gap: 10, background: UI.field, borderRadius: 999, padding: "13px 18px" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={UI.mute} strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg><input autoFocus={auto} value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setTab("recherche")} placeholder="Rechercher un dossier, une œuvre, un pays" style={{ ...sans, flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 16, color: UI.ink }} /></div>;

  const results = all.filter(({ d }) => (!catF || d.cat === catF) && (!query || [d.nom, d.titre, d.lieu, d.dest, d.creation].join(" ").toLowerCase().includes(query.toLowerCase())));
  const todo = all.filter((x) => x.a.overall !== "clear").sort((x, y) => ORDER[x.a.overall] - ORDER[y.a.overall]);

  return <div style={{ minHeight: "100vh", background: "#EFEBE2", ...sans, color: UI.ink }}>
    <style>{FONTS}{EXTRA}</style>
    {splash && <Splash />}
    {intro && screen === "home" && <Onboarding onClose={closeIntro} />}
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: UI.bg, position: "relative" }}>

      {/* ================= DOCUMENT ================= */}
      {screen === "doc" && <DocView kind={docKind} o={o} q={q} structure={structure} vocab={vocab} onBack={() => go("home")} />}

      {/* ================= ACCUEIL ================= */}
      {screen === "home" && <main style={{ padding: `0 20px ${TAB_H + 24}px` }}>

        {tab === "accueil" && <div className="av-fade">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: HEAD_H + 8 }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Logo size={30} /><Wordmark size={13} /></div><button onClick={() => setIntro(true)} className="av-press" aria-label="Aide" style={{ ...sans, width: 34, height: 34, borderRadius: "50%", border: `1px solid ${UI.line}`, background: "none", color: UI.ink, fontSize: 15, cursor: "pointer" }}>?</button></div>
          <Search />
          <div className="av-x" style={{ display: "flex", gap: 8, overflowX: "auto", margin: "14px -20px 0", padding: "0 20px 4px" }}>
            <Chip onClick={() => openRecord({ ...NEW })} icon={<span style={{ fontSize: 18, lineHeight: 1 }}>+</span>}>Nouveau dossier</Chip>
            <Chip onClick={() => setTab("echeances")}>Échéances</Chip>
            <Chip onClick={() => setTab("archive")}>Archive</Chip>
            <Chip onClick={() => { setArchSeg("modeles"); setTab("archive"); }}>Exemples de documents</Chip>
          </div>
          <H2 right={<button onClick={() => setTab("archive")} className="av-press" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Chev color={UI.ink} /></button>}>À traiter</H2>
          <div style={{ borderTop: `1px solid ${UI.line}` }}>{todo.slice(0, 4).map((x, k) => <RecordRow key={x.d.id} {...x} last={k === Math.min(4, todo.length) - 1} />)}</div>
          <H2 right={<button onClick={() => setTab("archive")} className="av-press" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Chev color={UI.ink} /></button>}>Dossiers récents</H2>
          <div className="av-x" style={{ display: "flex", gap: 14, overflowX: "auto", margin: "0 -20px", padding: "0 20px 6px" }}>{all.slice(0, 6).map((x) => <div key={x.d.id} style={{ flex: "0 0 168px" }}><RecordCard {...x} /></div>)}</div>
          <H2>Exemples de documents</H2>
          <Micro style={{ marginBottom: 12, lineHeight: 1.5 }}>Ce que vous remettez à l'acheteur, aux autorités et aux parties, tel que le dossier le prépare.</Micro>
          <div className="av-x" style={{ display: "flex", gap: 12, overflowX: "auto", margin: "0 -20px", padding: "0 20px 6px" }}>
            <DocCard kind="rapport" t="Rapport acheteur" d="Le vérifié, le déclaré, et ce qui n'est pas établi." rec={RECORDS[3]} />
            <DocCard kind="demande" t="Dossier de demande" d="Les pièces dans l'ordre attendu par l'autorité." rec={RECORDS[1]} />
            <DocCard kind="contrat" t="Projet de contrat" d="Les clauses préparées à partir du dossier." rec={RECORDS[3]} />
          </div>
          <H2>Prochaines échéances</H2>
          <div style={{ borderTop: `1px solid ${UI.line}` }}>{deadlines.slice(0, 3).map((x, k) => <Row key={x.rec.id + x.titre} onClick={() => openRecord(x.rec, 2)} last={k === 2}><div style={{ width: 52, flexShrink: 0 }}><div style={{ ...sans, fontSize: 22, fontWeight: 300, lineHeight: 1 }}>{x.date.getDate()}</div><Micro style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>{x.date.toLocaleDateString("fr-FR", { month: "short" })}</Micro></div><div style={{ flex: 1, minWidth: 0 }}><div style={{ ...sans, fontSize: 15, fontWeight: 500, lineHeight: 1.3 }}>{x.titre}</div><Micro style={{ marginTop: 2 }}>{x.rec.nom}</Micro></div><Pill k={x.kind} /></Row>)}</div>
          <Micro style={{ marginTop: 26, textAlign: "center", lineHeight: 1.55 }}>Démonstrateur, données fictives. Règles vérifiées à la source le 3 septembre 2026.</Micro>
        </div>}

        {tab === "recherche" && <div className="av-fade">
          <div style={{ height: 14 }} /><Search auto />
          {query || catF ? <>
            <H2 right={<button onClick={() => { setQuery(""); setCatF(null); }} className="av-press" style={{ ...sans, background: "none", border: "none", cursor: "pointer", fontSize: 14, color: UI.mute }}>Effacer</button>}>{results.length} dossier{results.length > 1 ? "s" : ""}</H2>
            <div style={{ borderTop: `1px solid ${UI.line}` }}>{results.map((x, k) => <RecordRow key={x.d.id} {...x} last={k === results.length - 1} />)}</div>
          </> : <>
            <H2>Parcourir par nature d'œuvre</H2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{CATS.filter(([k]) => all.some((x) => x.d.cat === k)).map(([k, l]) => { const n = all.filter((x) => x.d.cat === k).length, h = all.find((x) => x.d.cat === k).d.hue; return <div key={k} onClick={() => setCatF(k)} className="av-press" style={{ cursor: "pointer", background: UI.paper, border: `1px solid ${UI.line}`, padding: 16, minHeight: 96, display: "flex", flexDirection: "column", justifyContent: "space-between" }}><Micro>{n} dossier{n > 1 ? "s" : ""}</Micro><div style={{ ...sans, fontSize: 16, fontWeight: 500, lineHeight: 1.25 }}>{l}</div></div>; })}</div>
            <H2>Par destination</H2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{[...new Set(RECORDS.map((d) => d.dest))].map((p) => <Chip key={p} onClick={() => setQuery(p)}>{p}</Chip>)}</div>
            <H2>Par statut</H2>
            <div style={{ borderTop: `1px solid ${UI.line}` }}>{["blocked", "required", "clear"].map((k, i) => { const n = all.filter((x) => x.a.overall === k).length; return <Row key={k} last={i === 2} onClick={() => { setArchSeg(k); setTab("archive"); }}><Pill k={k} /><span style={{ flex: 1, ...sans, fontSize: 15 }}>{n} dossier{n > 1 ? "s" : ""}</span><Chev color={UI.mute} /></Row>; })}</div>
          </>}
        </div>}

        {tab === "echeances" && <div className="av-fade">
          <H1 sub="Tous les délais à tenir, calculés à partir des dates de vos dossiers.">Échéances</H1>
          <div className="av-x" style={{ display: "flex", gap: 8, overflowX: "auto", margin: "0 -20px 6px", padding: "0 20px" }}>{[["tous", "Toutes"], ["blocked", "Critiques"], ["required", "À tenir"], ["info", "Pour information"]].map(([k, l]) => <Chip key={k} on={echSeg === k} onClick={() => setEchSeg(k)}>{l}</Chip>)}</div>
          <div style={{ borderTop: `1px solid ${UI.line}`, marginTop: 12 }}>{deadlines.filter((x) => echSeg === "tous" || x.kind === echSeg).map((x, k, arr) => <Row key={x.rec.id + x.titre + k} onClick={() => openRecord(x.rec, 2)} last={k === arr.length - 1} style={{ alignItems: "flex-start" }}><div style={{ width: 58, flexShrink: 0 }}><div style={{ ...sans, fontSize: 24, fontWeight: 300, lineHeight: 1 }}>{x.date.getDate()}</div><Micro style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>{x.date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })}</Micro></div><div style={{ flex: 1, minWidth: 0 }}><div style={{ ...sans, fontSize: 15.5, fontWeight: 500, lineHeight: 1.3 }}>{x.titre}</div><Micro style={{ marginTop: 3 }}>{x.rec.nom}</Micro><Micro style={{ marginTop: 3, color: UI.soft, lineHeight: 1.45 }}>{x.detail}</Micro></div><Pill k={x.kind} /></Row>)}</div>
        </div>}

        {tab === "archive" && <div className="av-fade">
          <H1 sub="Vos dossiers en cours, clôturés, et les modèles de documents.">Votre archive</H1>
          <div className="av-x" style={{ display: "flex", gap: 8, overflowX: "auto", margin: "0 -20px 6px", padding: "0 20px" }}>{[["cours", "En cours"], ["blocked", "Points à résoudre"], ["required", "À obtenir"], ["clear", "Documentés"], ["modeles", "Modèles"]].map(([k, l]) => <Chip key={k} on={archSeg === k} onClick={() => setArchSeg(k)}>{l}</Chip>)}</div>
          {archSeg === "modeles" ? <div style={{ marginTop: 18 }}>
            <Micro style={{ marginBottom: 14, lineHeight: 1.5 }}>Trois documents, préparés à partir d'un dossier exemple, pour voir ce que vous remettrez.</Micro>
            {[["rapport", "Rapport acheteur", "Ce qui a été vérifié, ce qui a été déclaré, ce qui n'est pas établi, et les obligations avec leur statut.", RECORDS[3]], ["demande", "Dossier de demande", "Les pièces dans l'ordre attendu par l'autorité qui instruit : certificat, licence, déclaration.", RECORDS[1]], ["contrat", "Projet de contrat", "Conditions suspensives, douane, droit de suite, frais, réception, préparés depuis le dossier.", RECORDS[3]]].map(([k, t, d, rec], i) => <Row key={k} onClick={() => openDoc(rec, k)} last={i === 2} style={{ alignItems: "flex-start" }}><div style={{ width: 56, height: 72, background: UI.paper, border: `1px solid ${UI.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Logo size={22} /></div><div style={{ flex: 1 }}><div style={{ ...sans, fontSize: 16, fontWeight: 500 }}>{t}</div><Micro style={{ marginTop: 3, lineHeight: 1.45 }}>{d}</Micro><Micro style={{ marginTop: 4, color: UI.vert }}>Exemple : {rec.nom}</Micro></div><Chev color={UI.mute} /></Row>)}
          </div> : <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0 14px" }}><button onClick={() => openRecord({ ...NEW })} className="av-press" style={{ ...sans, display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", fontSize: 16, color: UI.ink, padding: 0 }}><span style={{ fontSize: 22, lineHeight: 1, fontWeight: 300 }}>+</span>Nouveau dossier</button><Micro>{(archSeg === "cours" ? all : all.filter((x) => x.a.overall === archSeg)).length} dossiers</Micro></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 16px" }}>{(archSeg === "cours" ? all : all.filter((x) => x.a.overall === archSeg)).map((x) => <RecordCard key={x.d.id} {...x} />)}</div>
          </>}
        </div>}

        {tab === "profil" && <div className="av-fade">
          <div style={{ border: `1px solid ${UI.line}`, borderRadius: 18, padding: "28px 22px 22px", marginTop: 20, textAlign: "center" }}>
            <div style={{ width: 84, height: 84, borderRadius: "50%", background: UI.paper, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}><Logo size={46} /></div>
            <div style={{ ...sans, fontSize: 26, fontWeight: 500, marginTop: 16 }}>{STRUCT_NAMES[structure]}</div>
            <Micro style={{ marginTop: 4 }}>Démonstrateur · France</Micro>
            <div style={{ background: UI.paper, borderRadius: 14, padding: "16px 16px", marginTop: 20, display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}><Ring v={Math.round((sOk / sList.length) * 100)} size={48} /><div style={{ flex: 1 }}><div style={{ ...sans, fontSize: 15, fontWeight: 500 }}>Obligations permanentes</div><Micro style={{ marginTop: 2, lineHeight: 1.45 }}>{sOk} en place sur {sList.length}. Ce qui s'impose à votre structure, indépendamment de chaque œuvre.</Micro></div></div>
          </div>
          <H2>Structure</H2>
          <Seg value={structure} onChange={setStructure} options={[["galerie", "Galerie"], ["marchand", "Marchand"], ["maison", "Maison de vente"], ["conseiller", "Conseiller"]]} />
          <H2>Obligations permanentes</H2>
          <div style={{ borderTop: `1px solid ${UI.line}` }}>{sList.map(([t, d, base], i) => { const done = sd[i] !== false, isOpen = open === `s${i}`; return <div key={t} style={{ borderBottom: i === sList.length - 1 ? "none" : `1px solid ${UI.line}` }}><Row onClick={() => setOpen(isOpen ? null : `s${i}`)} last><span style={{ width: 8, height: 8, borderRadius: "50%", background: done ? UI.ok : UI.warn, flexShrink: 0 }} /><span style={{ flex: 1, ...sans, fontSize: 15.5, lineHeight: 1.35 }}>{t}</span><Chev open={isOpen} color={UI.mute} /></Row>{isOpen && <div className="av-fade" style={{ padding: "0 0 16px 22px" }}><div style={{ ...sans, fontSize: 14.5, color: UI.soft, lineHeight: 1.6 }}>{d}</div><Base base={base} /><div style={{ marginTop: 12 }}><Btn small outline onClick={(e) => { e.stopPropagation(); setStructDone((x) => ({ ...x, [structure]: { ...(x[structure] || {}), [i]: !done } })); }}>{done ? "Marquer à revoir" : "Marquer en place"}</Btn></div></div>}</div>; })}</div>
          <H2>Référentiel</H2>
          <Micro style={{ marginBottom: 6, lineHeight: 1.5 }}>Chaque règle renvoie à un texte. Vérifié à la source le 3 septembre 2026.</Micro>
          <div style={{ borderTop: `1px solid ${UI.line}` }}>{SOURCES.map(([j, items], gi) => { const isOpen = open === `src${gi}`; return <div key={j} style={{ borderBottom: gi === SOURCES.length - 1 ? "none" : `1px solid ${UI.line}` }}><Row onClick={() => setOpen(isOpen ? null : `src${gi}`)} last><span style={{ flex: 1, ...sans, fontSize: 15.5 }}>{j}</span><Micro>{items.length}</Micro><Chev open={isOpen} color={UI.mute} /></Row>{isOpen && <div className="av-fade" style={{ padding: "0 0 12px" }}>{items.map((t) => <div key={t} style={{ ...sans, fontSize: 14, color: UI.soft, padding: "6px 0", lineHeight: 1.5 }}>{t}</div>)}</div>}</div>; })}</div>
          <H2>Aide</H2>
          <div style={{ borderTop: `1px solid ${UI.line}` }}><Row onClick={() => setIntro(true)}><span style={{ flex: 1, ...sans, fontSize: 15.5 }}>Comment fonctionne un dossier</span><Chev color={UI.mute} /></Row><Row onClick={() => { setArchSeg("modeles"); setTab("archive"); }}><span style={{ flex: 1, ...sans, fontSize: 15.5 }}>Exemples de documents</span><Chev color={UI.mute} /></Row><Row last><span style={{ flex: 1, ...sans, fontSize: 15.5 }}>À propos</span><Micro>Démonstrateur · v4</Micro></Row></div>
          <Micro style={{ marginTop: 26, textAlign: "center", lineHeight: 1.55 }}>ARTVELCHIV, Monaco. Données fictives ; règles validées à date par les équipes ARTVELCHIV.</Micro>
        </div>}
      </main>}

      {/* ================= DOSSIER ================= */}
      {screen === "record" && <>
        <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(255,255,255,0.94)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: `1px solid ${UI.line}` }}>
          <div style={{ padding: "0 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: HEAD_H }}><Back onClick={() => go("home")} label="Archive" /><span style={{ ...mono, fontSize: 12, color: UI.mute }}>{o.id}</span><Pill k={q.overall} /></div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 12 }}><Tile hue={o.hue} label={(o.nom || "N")[0]} w={44} fs={18} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ ...sans, fontSize: 16, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.nom}</div><Micro>{q.actions} à obtenir{q.bloquantes ? ` · ${q.bloquantes} point${q.bloquantes > 1 ? "s" : ""} à résoudre` : ""} · {q.deadlines.length} échéances</Micro></div><Ring v={indice} size={40} /></div>
            <div className="av-x" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }}>{STEPS.map((s, i) => <button key={s} onClick={() => { setOpen(null); setStep(i); window.scrollTo(0, 0); }} className="av-press" style={{ ...sans, flexShrink: 0, border: `1px solid ${i === step ? UI.ink : UI.line}`, cursor: "pointer", padding: "8px 14px", borderRadius: 999, fontSize: 13.5, fontWeight: 500, background: i === step ? UI.ink : "#FFFFFF", color: i === step ? "#FFFFFF" : i < step ? UI.ink : UI.mute }}>{i < step ? "✓ " : `${i + 1}. `}{s}</button>)}</div>
          </div>
        </header>

        <main style={{ padding: "6px 20px 140px" }}>
          {step === 0 && <div className="av-fade" key="s0">
            <H1 sub="Décrivez-la ; le droit applicable se déduit à chaque champ.">L'œuvre</H1>
            <Field label="Désignation"><input value={o.titre} onChange={(e) => set("titre")(e.target.value)} placeholder="Artiste, titre, technique, date" style={inp} /></Field>
            <Field label="Nature"><Sel value={o.cat} onChange={set("cat")} options={CATS} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}><Field label="Année (négatif : av. J.-C.)"><input type="number" inputMode="numeric" value={o.annee} onChange={(e) => set("annee")(+e.target.value)} style={{ ...inp, ...mono }} /></Field><Field label="Prix ou estimation (€)"><input type="number" inputMode="numeric" value={o.valeur} onChange={(e) => set("valeur")(+e.target.value)} style={{ ...inp, ...mono }} /></Field></div>
            <Field label="Artiste"><Sel value={o.artiste} onChange={set("artiste")} options={ARTISTE} /></Field>
            {TECHNIQUES[o.cat] && <Field label="Technique"><Sel value={o.technique || TECHNIQUES[o.cat][0][0]} onChange={set("technique")} options={TECHNIQUES[o.cat]} /></Field>}
            {o.cat === "sculpture" && <Field label="Tirage (vide pour une pièce unique)"><input value={o.tirage || ""} onChange={(e) => set("tirage")(e.target.value)} placeholder="ex. 7/8, fonte posthume" style={inp} /></Field>}
            <H2>Trajet et douane</H2>
            <Field label="Pays de création ou de découverte"><Sel value={o.creation} onChange={set("creation")} options={PAYS} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}><Field label="Lieu actuel"><Sel value={o.lieu} onChange={set("lieu")} options={PAYS} /></Field><Field label="Destination"><Sel value={o.dest} onChange={set("dest")} options={PAYS} /></Field></div>
            <Field label="Statut douanier"><Sel value={o.douane} onChange={set("douane")} options={DOUANE} /></Field>
            {(o.douane === "at" || o.douane === "ata") && <Field label={o.douane === "at" ? "Date de placement sous admission temporaire" : "Date d'émission du carnet ATA"}><input type="date" value={o.entree} onChange={(e) => set("entree")(e.target.value)} style={{ ...inp, ...mono }} /></Field>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}><Field label="Matériau principal"><Sel value={o.materiau || "mixte"} onChange={set("materiau")} options={MATERIAUX} /></Field><Field label="Type de provenance"><Sel value={o.prov || "collection"} onChange={set("prov")} options={PROVTYPE} /></Field></div>
            <H2>Vente</H2>
            <Field label="Origine"><Seg value={o.source} onChange={set("source")} options={[["premier", "De l'artiste"], ["second", "Second marché"]]} /></Field>
            <Field label="Mode de vente"><Seg value={o.mode} onChange={set("mode")} options={[["prive", "Gré à gré"], ["encheres", "Enchères"], ["distance", "À distance"]]} /></Field>
            <Field label="Acheteur"><Seg value={o.acheteur} onChange={set("acheteur")} options={[["particulier", "Particulier"], ["pro", "Professionnel"], ["public", "Musée"]]} /></Field>
            <Field label="Espèces protégées (ivoire, écaille, bois précieux, corail)"><Seg value={o.protege ? "oui" : "non"} onChange={(v) => set("protege")(v === "oui")} options={[["non", "Non"], ["oui", "Oui"]]} /></Field>
            {o.cat === "religieux" && <Field label="Objet liturgique ou issu d'un monument ?"><Seg value={o.liturgique ? "oui" : "non"} onChange={(v) => set("liturgique")(v === "oui")} options={[["non", "Non"], ["oui", "Oui"]]} /></Field>}
          </div>}

          {step === 1 && <div className="av-fade" key="s1">
            <H1 sub={`${q.age > 0 ? `${q.age} ans` : "Antiquité"} · ${q.tiers ? "bien culturel tiers" : "bien de l'Union"} · ${o.lieu === o.dest ? "sans frontière" : `${o.lieu} → ${o.dest}`}.`}>{q.bloquantes ? `${q.bloquantes} point${q.bloquantes > 1 ? "s" : ""} à résoudre, ${q.actions} à obtenir` : q.actions ? `${q.actions} obligation${q.actions > 1 ? "s" : ""} à obtenir` : "Aucune démarche particulière"}</H1>
            {GROUPS.map(([g, doms]) => { const rs = q.rules.filter((r) => doms.includes(r.domain)).sort((a, b) => ORDER[a.kind] - ORDER[b.kind]); if (!rs.length) return null; return <div key={g}><H2>{g}</H2><div style={{ borderTop: `1px solid ${UI.line}` }}>{rs.map((r, i) => <RuleRow key={r.titre} r={r} last={i === rs.length - 1} />)}</div></div>; })}
          </div>}

          {step === 2 && <div className="av-fade" key="s2">
            <H1 sub={q.deadlines.some((d) => d.kind === "blocked") ? "Une échéance douanière est critique : elle commande le calendrier de la vente." : "Régime, TVA à l'arrivée, et chaque délai à tenir."}>Douane et échéances</H1>
            <div style={{ borderTop: `1px solid ${UI.line}` }}>{q.rules.filter((r) => r.domain === "customs").map((r, i, arr) => <div key={r.titre} style={{ padding: "16px 0", borderBottom: i === arr.length - 1 ? "none" : `1px solid ${UI.line}` }}><div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}><div style={{ flex: 1, ...sans, fontSize: 17, fontWeight: 500, lineHeight: 1.3 }}>{r.titre}</div><Pill k={r.kind} /></div><div style={{ ...sans, fontSize: 14.5, color: UI.soft, lineHeight: 1.6, marginTop: 8 }}>{r.detail}</div><Base base={r.base} /></div>)}</div>
            <H2>Calendrier</H2>
            <div style={{ borderTop: `1px solid ${UI.line}` }}>{q.deadlines.map((d, i) => <Row key={d.titre} last={i === q.deadlines.length - 1} style={{ alignItems: "flex-start" }}><div style={{ width: 58, flexShrink: 0 }}><div style={{ ...sans, fontSize: 24, fontWeight: 300, lineHeight: 1 }}>{d.date.getDate()}</div><Micro style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>{d.date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })}</Micro></div><div style={{ flex: 1 }}><div style={{ ...sans, fontSize: 15.5, fontWeight: 500, lineHeight: 1.3 }}>{d.titre}</div><Micro style={{ marginTop: 3, color: UI.soft, lineHeight: 1.45 }}>{d.detail}</Micro></div><Pill k={d.kind} /></Row>)}</div>
            <Micro style={{ marginTop: 18, lineHeight: 1.55 }}>Points d'attention : adresse déclarée sous admission temporaire, apurement des volets ATA, valeur déclarée cohérente avec le prix, incoterm et risques, assurance clou à clou, retour en franchise trois ans.</Micro>
          </div>}

          {step === 3 && <div className="av-fade" key="s3">
            <H1 sub="Seules les pièces exigées par ce régime ; vous les joignez, le dossier les indexe et les horodate.">Pièces et déclarations</H1>
            {groups.map((g) => <div key={g}><H2>{g}</H2><div style={{ borderTop: `1px solid ${UI.line}` }}>{q.pieces.filter((p) => p.group === g).map((p, i, arr) => { const d = !!joint[p.titre]; return <Row key={p.titre} last={i === arr.length - 1}><div style={{ flex: 1 }}><div style={{ ...sans, fontSize: 15.5, lineHeight: 1.3 }}>{p.titre}</div><Micro style={{ marginTop: 2, color: d ? UI.ok : UI.mute }}>{d ? "Jointe · horodatée" : p.why}</Micro></div><Btn small outline={!d} dark={false} onClick={() => setJoint((j) => ({ ...j, [p.titre]: !j[p.titre] }))}>{d ? "✓ Jointe" : "Joindre"}</Btn></Row>; })}</div></div>)}
            <H2>Le vendeur déclare</H2>
            {o.artiste !== "anonyme" && <Field label="Dénomination de l'attribution (décret du 3 mars 1981)"><Sel value={vocab} onChange={setVocab} options={VOCAB} /></Field>}
            <div style={{ borderTop: `1px solid ${UI.line}` }}>{DECL_Q.map((qn, i) => <div key={qn} style={{ padding: "14px 0", borderBottom: i === DECL_Q.length - 1 ? "none" : `1px solid ${UI.line}` }}><div style={{ ...sans, fontSize: 15, marginBottom: 10, lineHeight: 1.45 }}>{qn}</div><Seg value={decl[i] || ""} onChange={(v) => setDecl((d) => ({ ...d, [i]: v }))} options={[["Oui", "Oui"], ["Non", "Non"], ["NSP", "Ne sais pas"]]} /></div>)}</div>
            <Micro style={{ marginTop: 16, lineHeight: 1.55, fontStyle: "italic" }}>« Je certifie la sincérité de mes déclarations et l'exhaustivité des pièces versées. » Signature sous identité vérifiée ; empreinte SHA-256.</Micro>
          </div>}

          {step === 4 && <div className="av-fade" key="s4">
            <H1 sub="Six domaines, chacun avec un statut limité à son objet.">{q.overall === "blocked" ? "Un point reste à résoudre avant la vente" : q.overall === "required" ? "La vente peut se préparer, sous conditions" : "Aucun obstacle identifié"}</H1>
            <div style={{ background: TONE[q.overall][1], borderRadius: 16, padding: 18, display: "flex", alignItems: "center", gap: 16 }}><Ring v={indice} size={56} /><div style={{ flex: 1 }}><Micro>Complétude du dossier</Micro><div style={{ ...sans, fontSize: 22, fontWeight: 500, color: TONE[q.overall][0], marginTop: 2 }}>{LABEL[q.overall]}</div><Micro style={{ marginTop: 3 }}>{q.authorities.length} demande{q.authorities.length > 1 ? "s" : ""} à préparer · {nJ}/{q.pieces.length} pièces · {nD}/{DECL_Q.length} déclarations</Micro></div></div>
            <H2>Par domaine</H2>
            <div style={{ borderTop: `1px solid ${UI.line}` }}>{q.clearance.map(([dom, s, doms], i) => { const first = q.rules.filter((r) => doms.includes(r.domain)).sort((a, b) => ORDER[a.kind] - ORDER[b.kind])[0]; return <Row key={dom} last={i === q.clearance.length - 1}><div style={{ flex: 1 }}><div style={{ ...sans, fontSize: 15.5, fontWeight: 500 }}>{dom}</div><Micro style={{ marginTop: 2 }}>{first ? first.titre : "—"}</Micro></div><Pill k={s} /></Row>; })}</div>
          </div>}

          {step === 5 && <div className="av-fade" key="s5">
            <H1 sub={q.authorities.length ? `${q.authorities.length} demande${q.authorities.length > 1 ? "s" : ""} préparée${q.authorities.length > 1 ? "s" : ""} depuis le dossier. Le dépôt et la décision restent ceux de l'autorité.` : "Aucune autorité à saisir pour cette vente."}>Demandes aux autorités</H1>
            <div style={{ borderTop: `1px solid ${UI.line}` }}>{q.authorities.map((a, i) => <div key={a.titre} style={{ padding: "16px 0", borderBottom: `1px solid ${UI.line}` }}><div style={{ ...sans, fontSize: 17, fontWeight: 500, lineHeight: 1.3 }}>{a.titre}</div><Micro style={{ marginTop: 3 }}>Destinataire : {a.dest}</Micro><div style={{ marginTop: 10 }}>{a.sections.map((s) => <div key={s} style={{ ...sans, fontSize: 14.5, color: UI.soft, padding: "4px 0", display: "flex", gap: 10 }}><span style={{ color: UI.vert }}>·</span>{s}</div>)}</div></div>)}<div style={{ padding: "16px 0" }}><div style={{ ...sans, fontSize: 17, fontWeight: 500 }}>Extrait du registre des objets mobiliers</div><Micro style={{ marginTop: 3 }}>Présentable sur réquisition</Micro></div></div>
            <div style={{ marginTop: 18 }}><Btn outline full onClick={() => openDoc(o, "demande")}>Voir le dossier de demande</Btn></div>
          </div>}

          {step === 6 && <div className="av-fade" key="s6">
            <H1 sub="Le vérifié, le déclaré, et ce qui n'est pas établi.">Rapport acheteur</H1>
            <div style={{ borderTop: `1px solid ${UI.line}` }}>{[["Vendeur", "Identité vérifiée, qualité justifiée, criblage négatif"], ["Attribution", o.artiste === "anonyme" ? "Non attribuée ; rapport d'expert joint" : `« ${vocab} » au sens du décret de 1981, garantie contractuelle du vendeur`], ["Provenance", `Chaîne documentée ; registres interrogés${o.annee < 1946 && o.annee > 1800 ? " ; spoliations recherchées" : ""}`], ["État", "Rapport photographique annexé ; restaurations selon déclaration"], ["Obligations", q.clearance.map(([d, s]) => `${d} : ${LABEL[s].toLowerCase()}`).join(" · ")], ["Douane et fiscalité", `${q.rules.find((r) => r.domain === "customs")?.titre || ""} ; ${q.original ? "TVA 5,5 %" : "TVA sur la marge"}`], ["Ce que ce rapport ne garantit pas", "L'authenticité en tant que telle, l'état mécanique, la valeur, hors garantie contractuelle et expertises jointes"]].map(([k, v], i, arr) => <div key={k} style={{ padding: "14px 0", borderBottom: i === arr.length - 1 ? "none" : `1px solid ${UI.line}` }}><Micro style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>{k}</Micro><div style={{ ...sans, fontSize: 15, color: UI.ink, lineHeight: 1.5, marginTop: 4 }}>{v}</div></div>)}</div>
            <div style={{ marginTop: 18 }}><Btn outline full onClick={() => openDoc(o, "rapport")}>Voir le rapport mis en forme</Btn></div>
          </div>}

          {step === 7 && <div className="av-fade" key="s7">
            <H1 sub={`${q.clauses.length} clauses préparées à partir du dossier, à relire par les parties avant signature.`}>Projet de contrat</H1>
            <div style={{ borderTop: `1px solid ${UI.line}` }}>{q.clauses.map(([k, v], i) => <Row key={i} last={i === q.clauses.length - 1} style={{ alignItems: "flex-start" }}><span style={{ ...sans, fontSize: 13, color: UI.mute, width: 24, flexShrink: 0, paddingTop: 3 }}>{String(i + 1).padStart(2, "0")}</span><div><div style={{ ...sans, fontSize: 15.5, fontWeight: 500 }}>{k}</div><div style={{ ...sans, fontSize: 14, color: UI.soft, lineHeight: 1.5, marginTop: 2 }}>{v}</div></div></Row>)}</div>
            <div style={{ marginTop: 18 }}><Btn outline full onClick={() => openDoc(o, "contrat")}>Voir le projet mis en forme</Btn></div>
          </div>}

          {step === 8 && <div className="av-fade" key="s8">
            <H1 sub={q.overall === "blocked" ? "Pas de clôture : le dossier reste archivé, daté, comme preuve des diligences accomplies." : "Pas à pas, jusqu'à l'archivage daté et versionné."}>Clôture</H1>
            <div style={{ borderTop: `1px solid ${UI.line}` }}>{[["Signatures", "Contrat et déclarations sous identité vérifiée"], ...(q.seq ? [["Séquestre", "Prix consigné"]] : []), ...(q.authorities.length ? [["Autorisations", `${q.authorities.length} décision${q.authorities.length > 1 ? "s" : ""} attendue${q.authorities.length > 1 ? "s" : ""}`]] : []), ...(q.rules.some((r) => r.domain === "customs" && r.kind !== "clear") ? [["Douane", "Régime régularisé, déclaration déposée, TVA acquittée"]] : []), ["Livraison", "Transporteur agréé, assurance clou à clou"], ["Réception", "Rapport contradictoire, réserves sous 48 h"], ...(q.seq ? [["Libération", "Fonds libérés au PV"]] : []), ...(structure === "maison" ? [["Procès-verbal", "À J + 1"]] : []), ...(o.source === "second" ? [["Registre", "Sortie inscrite"]] : []), ...(q.rules.some((r) => r.titre.startsWith("Droit de suite")) ? [["Droit de suite", "Versé"]] : []), ["Archivage", "Dossier daté et versionné, conservé dix ans"]].map(([k, v], i, arr) => <Row key={k} last={i === arr.length - 1}><span style={{ ...sans, fontSize: 13, color: UI.mute, width: 24, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span><div style={{ flex: 1 }}><div style={{ ...sans, fontSize: 15.5, fontWeight: 500 }}>{k}</div><Micro style={{ marginTop: 1 }}>{v}</Micro></div></Row>)}</div>
            {q.overall !== "blocked" && <div style={{ background: UI.vertDeep, color: "#FAF5EB", borderRadius: 18, padding: "30px 22px", marginTop: 22, textAlign: "center" }}><div style={{ display: "flex", justifyContent: "center" }}><Logo size={60} light /></div><div style={{ marginTop: 14 }}><Wordmark size={16} color="#FAF5EB" /></div><div style={{ ...sans, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: UI.jaune, marginTop: 12 }}>Established</div><div style={{ ...sans, fontSize: 14, color: "#C9D3CB", marginTop: 12, lineHeight: 1.5 }}>Dossier clôturé le 30 septembre 2026, version des règles du 3 septembre 2026, pièces horodatées.</div><div style={{ ...mono, fontSize: 11, color: "#8FA898", marginTop: 12 }}>{o.id} · SHA-256</div></div>}
          </div>}
        </main>

        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, boxSizing: "border-box", background: "rgba(255,255,255,0.94)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderTop: `1px solid ${UI.line}`, padding: "12px 20px calc(14px + env(safe-area-inset-bottom))", display: "flex", gap: 10, zIndex: 30 }}>
          <Btn outline onClick={() => { setOpen(null); step === 0 ? go("home") : setStep(step - 1); window.scrollTo(0, 0); }}>Retour</Btn>
          <div style={{ flex: 1 }}>{step < 8 ? <Btn dark full onClick={() => { setOpen(null); setStep(step + 1); window.scrollTo(0, 0); }}>{["Voir les obligations", "Douane et échéances", "Joindre les pièces", "Vérifier", "Préparer les demandes", "Rapport acheteur", "Projet de contrat", "Clôturer"][step]}</Btn> : <Btn dark full onClick={() => openDoc(o, "rapport")}>Exporter le dossier</Btn>}</div>
        </div>
      </>}

      {/* ================= BARRE D'ONGLETS (fixe) ================= */}
      {screen === "home" && <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, boxSizing: "border-box", background: "rgba(255,255,255,0.96)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderTop: `1px solid ${UI.line}`, padding: "10px 6px calc(12px + env(safe-area-inset-bottom))", display: "flex", zIndex: 30 }}>
        {[["accueil", "Accueil"], ["recherche", "Rechercher"], ["echeances", "Échéances"], ["archive", "Archive"], ["profil", "Profil"]].map(([k, l]) => <button key={k} onClick={() => { setTab(k); setOpen(null); window.scrollTo(0, 0); }} className="av-press" style={{ ...sans, flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "4px 0", fontSize: 11, fontWeight: tab === k ? 500 : 400, color: tab === k ? UI.ink : "#6F6A5F" }}><Ico name={k} active={tab === k} />{l}</button>)}
      </nav>}
    </div>
  </div>;
}
