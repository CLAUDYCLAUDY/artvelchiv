import { useState, useMemo } from "react";

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

/* ============================================================ UI — ARTVELCHIV, interface aérée (esprit iOS) */
const LOGO = "/assets/logo.png";
const UI = {
  bg: "#F4EFE5", card: "#FFFFFF", ink: "#15140F", inkSoft: "#4A4841", mute: "#8E887B", line: "#EAE4D7", field: "#F4EFE5",
  vert: "#1D4633", vertSoft: "#E4EDE6", claret: "#8A2A2A", claretSoft: "#F6E7E6", warn: "#9A6321", warnSoft: "#F6ECDD", info: "#3F5F8A", infoSoft: "#E7EDF5", ok: "#2E6349", okSoft: "#E4EFE7", jaune: "#F2C21B",
};
const TONE = { blocked: [UI.claret, UI.claretSoft], required: [UI.warn, UI.warnSoft], pending: [UI.info, UI.infoSoft], info: [UI.mute, "#EFEBE2"], clear: [UI.ok, UI.okSoft] };
const EXTRA = `
@keyframes avUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
@keyframes avVeil { from { opacity: 0; } to { opacity: 1; } }
@keyframes avIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.av-sheet { animation: avUp .42s cubic-bezier(.2,.8,.2,1) both; }
.av-veil { animation: avVeil .25s ease both; }
.av-fade { animation: avIn .3s cubic-bezier(.2,.7,.2,1) both; }
.av-press { transition: transform .15s ease, opacity .15s ease; } .av-press:active { transform: scale(.985); opacity: .85; }
.av-x { scrollbar-width: none; } .av-x::-webkit-scrollbar { display: none; }
select, input { -webkit-appearance: none; appearance: none; }
input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
`;
const shadow = "0 2px 14px rgba(21,20,15,0.06), 0 1px 2px rgba(21,20,15,0.04)";

/* ---------- primitives ---------- */
const Logo = ({ size = 40 }) => <img src={LOGO} alt="ARTVELCHIV" style={{ width: size, height: "auto", display: "block" }} />;
const Wordmark = ({ size = 18, color = UI.ink }) => <span style={{ ...serifU, fontSize: size, letterSpacing: "0.28em", color, paddingLeft: "0.1em" }}>ARTVELCHIV</span>;
const Card = ({ children, style, pad = 18, onClick }) => <div onClick={onClick} className={onClick ? "av-press" : undefined} style={{ background: UI.card, borderRadius: 20, padding: pad, boxShadow: shadow, cursor: onClick ? "pointer" : "default", ...style }}>{children}</div>;
const Title = ({ children, sub }) => <div style={{ margin: "6px 0 18px" }}><div style={{ ...serifU, fontSize: 32, lineHeight: 1.1, color: UI.ink, letterSpacing: "-0.01em" }}>{children}</div>{sub && <div style={{ ...sans, fontSize: 14, color: UI.mute, marginTop: 8, lineHeight: 1.55 }}>{sub}</div>}</div>;
const Label = ({ children, style }) => <div style={{ ...sans, fontSize: 11.5, letterSpacing: "0.08em", textTransform: "uppercase", color: UI.mute, fontWeight: 600, ...style }}>{children}</div>;
const Pill = ({ k, big }) => { const [c, bg] = TONE[k]; return <span style={{ ...sans, display: "inline-flex", alignItems: "center", gap: 6, background: bg, color: c, fontSize: big ? 12 : 11, fontWeight: 600, padding: big ? "6px 11px" : "4px 9px", borderRadius: 999, whiteSpace: "nowrap" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />{KIND[k][0]}</span>; };
const Btn = ({ children, onClick, primary, ghost, full, disabled, small }) => <button onClick={onClick} disabled={disabled} className="av-press" style={{ ...sans, fontWeight: 600, fontSize: small ? 13 : 15, padding: small ? "9px 14px" : "16px 20px", borderRadius: small ? 999 : 16, cursor: disabled ? "default" : "pointer", border: ghost ? `1px solid ${UI.line}` : "none", background: primary ? UI.vert : ghost ? UI.card : UI.field, color: primary ? "#FFFFFF" : UI.ink, width: full ? "100%" : undefined, opacity: disabled ? 0.4 : 1, boxShadow: primary ? "0 6px 18px rgba(29,70,51,0.22)" : "none" }}>{children}</button>;
const Chevron = ({ open }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={UI.mute} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: open ? "rotate(90deg)" : "none", transition: "transform .2s" }}><path d="M9 6l6 6-6 6" /></svg>;
const Row = ({ children, onClick, last, style }) => <div onClick={onClick} className={onClick ? "av-press" : undefined} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: last ? "none" : `1px solid ${UI.line}`, cursor: onClick ? "pointer" : "default", ...style }}>{children}</div>;
const Field = ({ label, children }) => <div style={{ marginBottom: 14 }}><Label style={{ marginBottom: 7, paddingLeft: 4 }}>{label}</Label>{children}</div>;
const inp = { ...sans, width: "100%", background: UI.field, border: "none", borderRadius: 14, padding: "14px 15px", color: UI.ink, fontSize: 16, outline: "none", boxSizing: "border-box" };
const Sel = ({ value, onChange, options }) => <div style={{ position: "relative" }}><select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inp, paddingRight: 40, cursor: "pointer" }}>{options.map((o) => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>)}</select><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={UI.mute} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", right: 15, top: 18, pointerEvents: "none" }}><path d="M6 9l6 6 6-6" /></svg></div>;
const Seg = ({ value, onChange, options }) => <div style={{ display: "flex", background: "#EAE3D4", borderRadius: 12, padding: 3 }}>{options.map(([v, l]) => <button key={v} onClick={() => onChange(v)} style={{ ...sans, flex: 1, padding: "9px 6px", fontSize: 12.5, fontWeight: value === v ? 600 : 500, cursor: "pointer", background: value === v ? UI.card : "transparent", color: value === v ? UI.ink : UI.inkSoft, border: "none", borderRadius: 10, boxShadow: value === v ? "0 1px 4px rgba(21,20,15,0.12)" : "none", transition: "all .18s" }}>{l}</button>)}</div>;
const Frame = ({ hue, label, size = 56, radius = 14 }) => <div style={{ width: size, height: size, borderRadius: radius, background: `linear-gradient(145deg, ${hue}, #14140F)`, display: "flex", alignItems: "center", justifyContent: "center", ...serifU, color: "rgba(250,245,235,0.92)", fontSize: size * 0.4, flexShrink: 0 }}>{label}</div>;
const Ring = ({ v, size = 44 }) => { const c = v >= 95 ? UI.vert : v >= 75 ? UI.ok : v >= 55 ? UI.warn : UI.claret, r = (size - 5) / 2, circ = 2 * Math.PI * r; return <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}><svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={UI.line} strokeWidth="4" /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - v / 100)} style={{ transition: "stroke-dashoffset .6s ease" }} /></svg><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", ...sans, fontSize: size * 0.28, fontWeight: 600, color: c }}>{v}</div></div>; };
const Doc = ({ titre, sub, sections }) => <Card style={{ marginBottom: 12 }}><div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}><Logo size={22} /><div style={{ flex: 1 }}><div style={{ ...sans, fontSize: 15.5, fontWeight: 600, lineHeight: 1.3 }}>{titre}</div>{sub && <div style={{ ...sans, fontSize: 12.5, color: UI.mute, marginTop: 3 }}>{sub}</div>}</div></div><div style={{ marginTop: 12, borderTop: `1px solid ${UI.line}`, paddingTop: 6 }}>{sections.map((s) => <div key={s} style={{ display: "flex", gap: 10, ...sans, fontSize: 13.5, color: UI.inkSoft, padding: "6px 0", lineHeight: 1.45 }}><span style={{ color: UI.ok, fontWeight: 600 }}>✓</span><span>{s}</span></div>)}</div></Card>;
const Ico = ({ name, active }) => { const c = active ? UI.vert : UI.mute; const p = { fill: "none", stroke: c, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "dossiers") return <svg width="24" height="24" viewBox="0 0 24 24"><path {...p} d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z" /></svg>;
  if (name === "structure") return <svg width="24" height="24" viewBox="0 0 24 24"><path {...p} d="M4 20V9l8-5 8 5v11" /><path {...p} d="M9 20v-6h6v6" /></svg>;
  return <svg width="24" height="24" viewBox="0 0 24 24"><path {...p} d="M5 4h9l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" /><path {...p} d="M14 4v5h5M8 13h8M8 17h5" /></svg>; };

/* ---------- écrans ---------- */
function Gate({ onOk, code }) {
  const [pin, setPin] = useState(""), [err, setErr] = useState(false);
  const check = () => (pin.trim().toUpperCase() === String(code).toUpperCase() ? onOk() : setErr(true));
  return (
    <div style={{ minHeight: "100vh", background: UI.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, ...sans }}>
      <style>{FONTS}{EXTRA}</style>
      <div className="av-fade" style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center" }}><Logo size={112} /></div>
        <div style={{ marginTop: 18 }}><Wordmark size={24} /></div>
        <div style={{ fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", color: UI.vert, fontWeight: 600, marginTop: 10 }}>The art transaction standard</div>
        <Card style={{ marginTop: 30, textAlign: "left" }}>
          <Label style={{ marginBottom: 8, paddingLeft: 4 }}>Accès privé</Label>
          <input type="password" value={pin} onChange={(e) => { setPin(e.target.value); setErr(false); }} onKeyDown={(e) => e.key === "Enter" && check()} placeholder="Code d'accès" style={{ ...inp, ...mono, letterSpacing: "0.18em", textAlign: "center", border: err ? `1px solid ${UI.claret}` : "1px solid transparent" }} />
          {err && <div style={{ fontSize: 12.5, color: UI.claret, marginTop: 8, paddingLeft: 4 }}>Code incorrect.</div>}
          <div style={{ marginTop: 12 }}><Btn primary full onClick={check}>Entrer</Btn></div>
        </Card>
        <div style={{ fontSize: 12, color: UI.mute, marginTop: 22, lineHeight: 1.6 }}>Démonstrateur confidentiel. Données fictives ; règles validées à date par les équipes ARTVELCHIV.</div>
      </div>
    </div>
  );
}

function Onboarding({ onClose }) {
  const pts = [
    ["Le Protocole", "Vous décrivez l'œuvre dans une fiche unique : nature, date, valeur, provenance, trajet et mode de vente."],
    ["L'Intelligence", "Le droit applicable, les formalités de douane et les délais se déduisent automatiquement, puis se rassemblent en un dossier complet, jusqu'au contrat de vente."],
    ["Le Référentiel", "Chaque règle renvoie au texte officiel qui la fonde, vérifié à date par les équipes ARTVELCHIV. Rien n'est affirmé sans source."],
  ];
  return (
    <div className="av-veil" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(21,20,15,0.42)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div className="av-sheet" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", background: UI.bg, borderRadius: "26px 26px 0 0", padding: "12px 22px 26px", boxSizing: "border-box" }}>
        <div style={{ width: 38, height: 5, borderRadius: 3, background: "#D8D1C2", margin: "0 auto 18px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}><Logo size={54} /><div><Wordmark size={17} /><div style={{ ...sans, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: UI.vert, fontWeight: 600, marginTop: 4 }}>The art transaction standard</div></div></div>
        <div style={{ ...serifU, fontSize: 26, lineHeight: 1.15, color: UI.ink, margin: "20px 0 8px" }}>Établir l'œuvre.<br />Sécuriser la transaction.</div>
        <div style={{ ...sans, fontSize: 14, color: UI.inkSoft, lineHeight: 1.6, marginBottom: 16 }}>ARTVELCHIV conduit chaque vente d'œuvre d'art, de la description au contrat, en trois temps.</div>
        {pts.map(([t, d], i) => (
          <Card key={t} pad={16} style={{ marginBottom: 10, display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ width: 34, height: 34, borderRadius: 11, background: UI.vertSoft, color: UI.vert, display: "flex", alignItems: "center", justifyContent: "center", ...sans, fontSize: 14, fontWeight: 600, flexShrink: 0 }}>{i + 1}</div>
            <div><div style={{ ...sans, fontSize: 15.5, fontWeight: 600, color: UI.ink }}>{t}</div><div style={{ ...sans, fontSize: 13.5, color: UI.inkSoft, lineHeight: 1.55, marginTop: 3 }}>{d}</div></div>
          </Card>
        ))}
        <div style={{ marginTop: 16 }}><Btn primary full onClick={onClose}>Commencer</Btn></div>
        <div style={{ ...sans, fontSize: 11.5, color: UI.mute, textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>Démonstrateur — données fictives ; règles validées à date par les équipes ARTVELCHIV.</div>
      </div>
    </div>
  );
}

export default function Artvelchiv({ pin = DEFAULT_PIN, locked = true }) {
  const [gate, setGate] = useState(locked);
  const [intro, setIntro] = useState(() => { try { return typeof localStorage !== "undefined" && !localStorage.getItem("av_intro_v3"); } catch (e) { return true; } });
  const closeIntro = () => { try { localStorage.setItem("av_intro_v3", "1"); } catch (e) {} setIntro(false); };
  const [structure, setStructure] = useState("galerie");
  const [tab, setTab] = useState("dossiers");
  const [screen, setScreen] = useState("home");
  const [o, setO] = useState(RECORDS[0]);
  const [step, setStep] = useState(0);
  const [joint, setJoint] = useState({});
  const [decl, setDecl] = useState({});
  const [vocab, setVocab] = useState("signé");
  const [open, setOpen] = useState(null);
  const [structDone, setStructDone] = useState({});
  const q = useMemo(() => analyse(o, structure), [o, structure]);
  const set = (k) => (v) => setO((x) => ({ ...x, [k]: v }));
  const DECL_Q = ["Propriétaire, ou mandataire écrit ?", "Restaurée, rentoilée ou modifiée ?", "Présentée sans succès à un comité ou à un expert ?", "Litige, revendication ou saisie ?", "Sortie d'un pays sous restriction après l'entrée en vigueur de celle-ci ?", "Matériaux d'espèces protégées ?", "Toutes les pièces de provenance connues versées ?"];
  const nJ = q.pieces.filter((p) => joint[p.titre]).length, nD = Object.keys(decl).length;
  const indice = Math.round((nJ / Math.max(1, q.pieces.length)) * 70 + (nD / DECL_Q.length) * 30);
  const STEPS = ["Décrire", "Règles", "Douane", "Preuves", "Clearance", "Autorités", "Acheteur", "Contrat", "Clôture"];
  const openRecord = (d) => { setO(d); setJoint({}); setDecl({}); setStep(0); setOpen(null); setScreen("record"); window.scrollTo(0, 0); };
  const [sLabel, sList] = STRUCT[structure], sd = structDone[structure] || {}, sOk = sList.filter((_, i) => sd[i] !== false).length;
  const groups = [...new Set(q.pieces.map((p) => p.group))];
  const GROUPS = [["Statut de l'objet", ["legal", "cultural"]], ["Circulation", ["export", "import"]], ["Douane et fiscalité", ["customs", "tax"]], ["Conformité et vente", ["aml", "sanctions", "species", "consumer"]]];
  if (gate) return <Gate code={pin} onOk={() => setGate(false)} />;

  const Section = ({ title, children, style }) => <div style={{ marginTop: 22, ...style }}>{title && <Label style={{ marginBottom: 8, paddingLeft: 4 }}>{title}</Label>}{children}</div>;
  const RuleRow = ({ r, last }) => { const isOpen = open === r.titre; return <div style={{ borderBottom: last ? "none" : `1px solid ${UI.line}` }}><Row onClick={() => setOpen(isOpen ? null : r.titre)} last><span style={{ ...sans, flex: 1, fontSize: 14.5, fontWeight: 500, lineHeight: 1.35 }}>{r.titre}</span><Pill k={r.kind} /><Chevron open={isOpen} /></Row>{isOpen && r.detail && <div className="av-fade" style={{ padding: "0 0 14px" }}><div style={{ ...sans, fontSize: 13.5, color: UI.inkSoft, lineHeight: 1.6 }}>{r.detail}</div><div style={{ ...mono, fontSize: 10.5, color: UI.vert, marginTop: 8, background: UI.vertSoft, display: "inline-block", padding: "4px 9px", borderRadius: 8 }}>{r.base}</div></div>}</div>; };

  return (
    <div style={{ minHeight: "100vh", background: "#E6DFCF", ...sans, color: UI.ink }}>
      <style>{FONTS}{EXTRA}</style>
      {intro && screen === "home" && <Onboarding onClose={closeIntro} />}
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: UI.bg, display: "flex", flexDirection: "column", position: "relative" }}>

        {/* ===== ACCUEIL ===== */}
        {screen === "home" && (
          <main style={{ flex: 1, padding: "18px 20px 110px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Logo size={34} /><Wordmark size={15} /></div>
              <button onClick={() => setIntro(true)} className="av-press" aria-label="Aide" style={{ ...sans, width: 32, height: 32, borderRadius: "50%", border: "none", background: UI.card, color: UI.inkSoft, fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: shadow }}>?</button>
            </div>

            {tab === "dossiers" && (
              <div className="av-fade">
                <Title sub="Vous décrivez l'œuvre ; ARTVELCHIV déduit le droit applicable, calcule les formalités de douane et réunit le dossier complet, jusqu'au contrat de vente.">Dossiers</Title>
                <Card onClick={() => openRecord({ ...NEW })} style={{ background: UI.vert, color: "#FFFFFF", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 10px 26px rgba(29,70,51,0.28)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 300, lineHeight: 1 }}>+</div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 600 }}>Ouvrir un nouveau dossier</div><div style={{ fontSize: 12.5, opacity: 0.8, marginTop: 2 }}>Deux minutes pour décrire l'œuvre</div></div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}><path d="M9 6l6 6-6 6" /></svg>
                </Card>
                <Section title="Dossiers en cours">
                  <Card pad={0} style={{ padding: "2px 16px" }}>
                    {RECORDS.map((d, i) => { const a = analyse(d, structure); return (
                      <Row key={d.id} onClick={() => openRecord(d)} last={i === RECORDS.length - 1}>
                        <Frame hue={d.hue} label={String(i + 1)} size={48} radius={13} />
                        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.25 }}>{d.nom}</div><div style={{ fontSize: 12.5, color: UI.mute, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.lieu} → {d.dest} · {d.valeur.toLocaleString("fr-FR")} €</div></div>
                        <Pill k={a.overall} />
                        <Chevron />
                      </Row>); })}
                  </Card>
                </Section>
                <div style={{ fontSize: 11.5, color: UI.mute, lineHeight: 1.55, marginTop: 18, textAlign: "center" }}>Démonstrateur — données fictives ; le Référentiel ARTVELCHIV (règles, seuils, délais) est validé à date par les équipes ARTVELCHIV.</div>
              </div>
            )}

            {tab === "structure" && (
              <div className="av-fade">
                <Title sub="Ce qui s'impose en permanence à votre structure, indépendamment de chaque œuvre.">Votre structure</Title>
                <Seg value={structure} onChange={setStructure} options={[["galerie", "Galerie"], ["marchand", "Marchand"], ["maison", "Maison"], ["conseiller", "Conseil"]]} />
                <Card style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 14 }}>
                  <Ring v={Math.round((sOk / sList.length) * 100)} size={52} />
                  <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 600 }}>{sLabel}</div><div style={{ fontSize: 13, color: UI.mute, marginTop: 2 }}>{sOk} obligation{sOk > 1 ? "s" : ""} en place sur {sList.length}</div></div>
                </Card>
                <Section title="Obligations permanentes">
                  <Card pad={0} style={{ padding: "2px 16px" }}>
                    {sList.map(([t, d, base], i) => { const done = sd[i] !== false, isOpen = open === `s${i}`; return <div key={t} style={{ borderBottom: i === sList.length - 1 ? "none" : `1px solid ${UI.line}` }}><Row onClick={() => setOpen(isOpen ? null : `s${i}`)} last><span style={{ width: 22, height: 22, borderRadius: "50%", background: done ? UI.okSoft : UI.warnSoft, color: done ? UI.ok : UI.warn, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{done ? "✓" : "!"}</span><span style={{ flex: 1, fontSize: 14.5, fontWeight: 500, lineHeight: 1.35 }}>{t}</span><Chevron open={isOpen} /></Row>{isOpen && <div className="av-fade" style={{ padding: "0 0 14px 34px" }}><div style={{ fontSize: 13.5, color: UI.inkSoft, lineHeight: 1.6 }}>{d}</div><div style={{ ...mono, fontSize: 10.5, color: UI.vert, margin: "8px 0 10px", background: UI.vertSoft, display: "inline-block", padding: "4px 9px", borderRadius: 8 }}>{base}</div><div><Btn small ghost onClick={(e) => { e.stopPropagation(); setStructDone((x) => ({ ...x, [structure]: { ...(x[structure] || {}), [i]: !done } })); }}>{done ? "Marquer à revoir" : "Marquer en place"}</Btn></div></div>}</div>; })}
                  </Card>
                </Section>
              </div>
            )}

            {tab === "sources" && (
              <div className="av-fade">
                <Title sub="Chaque règle renvoie à un texte. Vérifié à la source le 3 septembre 2026 ; 241 920 combinaisons testées sans erreur.">Référentiel</Title>
                {SOURCES.map(([j, items]) => <Section key={j} title={j} style={{ marginTop: 16 }}><Card pad={0} style={{ padding: "2px 16px" }}>{items.map((t, i) => <Row key={t} last={i === items.length - 1}><span style={{ fontSize: 13.5, color: UI.inkSoft, lineHeight: 1.5 }}>{t}</span></Row>)}</Card></Section>)}
              </div>
            )}
          </main>
        )}

        {/* ===== DOSSIER ===== */}
        {screen === "record" && (
          <>
            <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(244,239,229,0.92)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderBottom: `1px solid ${UI.line}` }}>
              <div style={{ padding: "12px 20px 0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <button onClick={() => setScreen("home")} className="av-press" style={{ ...sans, display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 15, color: UI.vert, fontWeight: 500, padding: 0 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={UI.vert} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>Dossiers</button>
                  <span style={{ ...mono, fontSize: 11.5, color: UI.mute }}>{o.id}</span>
                  <Pill k={q.overall} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}><Frame hue={o.hue} label={(o.nom || "N")[0]} size={42} radius={12} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 16, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.nom}</div><div style={{ fontSize: 12, color: UI.mute, marginTop: 1 }}>{q.actions} obligations{q.bloquantes ? ` · ${q.bloquantes} bloquante${q.bloquantes > 1 ? "s" : ""}` : ""} · {q.deadlines.length} échéances</div></div><Ring v={indice} size={40} /></div>
                <div className="av-x" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "12px 0 12px" }}>{STEPS.map((s, i) => <button key={s} onClick={() => { setOpen(null); setStep(i); }} className="av-press" style={{ ...sans, flexShrink: 0, border: "none", cursor: "pointer", padding: "8px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: i === step ? UI.vert : i < step ? UI.vertSoft : UI.card, color: i === step ? "#FFFFFF" : i < step ? UI.vert : UI.mute, boxShadow: i === step ? "0 4px 12px rgba(29,70,51,0.25)" : "none" }}>{i < step ? "✓ " : ""}{s}</button>)}</div>
              </div>
            </header>

            <main style={{ flex: 1, padding: "18px 20px 120px" }}>
              {step === 0 && (
                <div className="av-fade" key="s0">
                  <Title sub="Décrivez-la ; l'Intelligence ARTVELCHIV déduit le droit à chaque champ.">L'œuvre</Title>
                  <Card><Field label="Désignation"><input value={o.titre} onChange={(e) => set("titre")(e.target.value)} placeholder="Artiste, titre, technique, date" style={inp} /></Field>
                    <Field label="Nature"><Sel value={o.cat} onChange={set("cat")} options={CATS} /></Field>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><Field label="Année (négatif : av. J.-C.)"><input type="number" inputMode="numeric" value={o.annee} onChange={(e) => set("annee")(+e.target.value)} style={{ ...inp, ...mono }} /></Field><Field label="Prix ou estimation (€)"><input type="number" inputMode="numeric" value={o.valeur} onChange={(e) => set("valeur")(+e.target.value)} style={{ ...inp, ...mono }} /></Field></div>
                    <Field label="Artiste"><Sel value={o.artiste} onChange={set("artiste")} options={ARTISTE} /></Field>
                    {TECHNIQUES[o.cat] && <Field label="Technique"><Sel value={o.technique || TECHNIQUES[o.cat][0][0]} onChange={set("technique")} options={TECHNIQUES[o.cat]} /></Field>}
                    {o.cat === "sculpture" && <Field label="Tirage (vide pour une pièce unique)"><input value={o.tirage || ""} onChange={(e) => set("tirage")(e.target.value)} placeholder="ex. 7/8, fonte posthume" style={inp} /></Field>}
                  </Card>
                  <Section title="Trajet et douane"><Card>
                    <Field label="Pays de création ou de découverte"><Sel value={o.creation} onChange={set("creation")} options={PAYS} /></Field>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><Field label="Lieu actuel"><Sel value={o.lieu} onChange={set("lieu")} options={PAYS} /></Field><Field label="Destination"><Sel value={o.dest} onChange={set("dest")} options={PAYS} /></Field></div>
                    <Field label="Statut douanier"><Sel value={o.douane} onChange={set("douane")} options={DOUANE} /></Field>
                    {(o.douane === "at" || o.douane === "ata") && <Field label={o.douane === "at" ? "Date de placement sous admission temporaire" : "Date d'émission du carnet ATA"}><input type="date" value={o.entree} onChange={(e) => set("entree")(e.target.value)} style={{ ...inp, ...mono }} /></Field>}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><Field label="Matériau principal"><Sel value={o.materiau || "mixte"} onChange={set("materiau")} options={MATERIAUX} /></Field><Field label="Type de provenance"><Sel value={o.prov || "collection"} onChange={set("prov")} options={PROVTYPE} /></Field></div>
                  </Card></Section>
                  <Section title="Vente"><Card>
                    <Field label="Origine"><Seg value={o.source} onChange={set("source")} options={[["premier", "De l'artiste"], ["second", "Second marché"]]} /></Field>
                    <Field label="Mode de vente"><Seg value={o.mode} onChange={set("mode")} options={[["prive", "Gré à gré"], ["encheres", "Enchères"], ["distance", "À distance"]]} /></Field>
                    <Field label="Acheteur"><Seg value={o.acheteur} onChange={set("acheteur")} options={[["particulier", "Particulier"], ["pro", "Professionnel"], ["public", "Musée"]]} /></Field>
                    <Field label="Espèces protégées (ivoire, écaille, bois précieux, corail)"><Seg value={o.protege ? "oui" : "non"} onChange={(v) => set("protege")(v === "oui")} options={[["non", "Non"], ["oui", "Oui"]]} /></Field>
                    {o.cat === "religieux" && <Field label="Objet liturgique ou issu d'un monument ?"><Seg value={o.liturgique ? "oui" : "non"} onChange={(v) => set("liturgique")(v === "oui")} options={[["non", "Non"], ["oui", "Oui"]]} /></Field>}
                  </Card></Section>
                </div>
              )}

              {step === 1 && (
                <div className="av-fade" key="s1">
                  <Title sub={`${q.age > 0 ? `${q.age} ans` : "Antiquité"} · ${q.tiers ? "bien culturel tiers" : "bien de l'Union"} · ${o.lieu === o.dest ? "sans frontière" : `${o.lieu} → ${o.dest}`}. Ce que la loi impose, et ce qu'elle interdit.`}>{q.bloquantes ? `${q.bloquantes} obstacle${q.bloquantes > 1 ? "s" : ""}, ${q.actions} obligation${q.actions > 1 ? "s" : ""}` : q.actions ? `${q.actions} obligation${q.actions > 1 ? "s" : ""}` : "Aucune démarche particulière"}</Title>
                  {GROUPS.map(([g, doms]) => { const rs = q.rules.filter((r) => doms.includes(r.domain)).sort((a, b) => ORDER[a.kind] - ORDER[b.kind]); if (!rs.length) return null; return <Section key={g} title={g}><Card pad={0} style={{ padding: "2px 16px" }}>{rs.map((r, i) => <RuleRow key={r.titre} r={r} last={i === rs.length - 1} />)}</Card></Section>; })}
                </div>
              )}

              {step === 2 && (
                <div className="av-fade" key="s2">
                  <Title sub={q.deadlines.some((d) => d.kind === "blocked") ? "Une échéance douanière est critique : elle commande le calendrier de la vente." : "Régime, TVA à l'arrivée, et chaque délai à tenir."}>Douane et échéances</Title>
                  {q.rules.filter((r) => r.domain === "customs").map((r) => <Card key={r.titre} style={{ marginBottom: 12 }}><div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}><div style={{ flex: 1, fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{r.titre}</div><Pill k={r.kind} /></div><div style={{ fontSize: 13.5, color: UI.inkSoft, lineHeight: 1.6, marginTop: 8 }}>{r.detail}</div><div style={{ ...mono, fontSize: 10.5, color: UI.vert, marginTop: 10, background: UI.vertSoft, display: "inline-block", padding: "4px 9px", borderRadius: 8 }}>{r.base}</div></Card>)}
                  <Section title="Calendrier"><Card pad={0} style={{ padding: "2px 16px" }}>{q.deadlines.map((d, i) => <Row key={d.titre} last={i === q.deadlines.length - 1} style={{ alignItems: "flex-start" }}><div style={{ width: 40, height: 40, borderRadius: 12, background: TONE[d.kind][1], color: TONE[d.kind][0], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></div><div style={{ flex: 1 }}><div style={{ fontSize: 14.5, fontWeight: 600 }}>{d.titre}</div><div style={{ ...mono, fontSize: 11.5, color: TONE[d.kind][0], marginTop: 3, fontWeight: 600 }}>{fmt(d.date)}</div><div style={{ fontSize: 12.5, color: UI.inkSoft, lineHeight: 1.5, marginTop: 3 }}>{d.detail}</div></div></Row>)}</Card></Section>
                  <div style={{ fontSize: 12, color: UI.mute, lineHeight: 1.55, marginTop: 14, padding: "0 4px" }}>Points d'attention : adresse déclarée sous admission temporaire, apurement des volets ATA, valeur déclarée cohérente avec le prix, incoterm et risques, assurance clou à clou, retour en franchise trois ans.</div>
                </div>
              )}

              {step === 3 && (
                <div className="av-fade" key="s3">
                  <Title sub="Seules les pièces exigées par ce régime ; vous les joignez, ARTVELCHIV les indexe et les scelle.">Preuves et déclarations</Title>
                  {groups.map((g) => <Section key={g} title={g}><Card pad={0} style={{ padding: "2px 16px" }}>{q.pieces.filter((p) => p.group === g).map((p, i, arr) => { const d = !!joint[p.titre]; return <Row key={p.titre} last={i === arr.length - 1}><div style={{ flex: 1 }}><div style={{ fontSize: 14.5, fontWeight: 500 }}>{p.titre}</div><div style={{ fontSize: 12, color: d ? UI.ok : UI.mute, marginTop: 2 }}>{d ? "Jointe · horodatée · scellée" : p.why}</div></div><button onClick={() => setJoint((j) => ({ ...j, [p.titre]: !j[p.titre] }))} className="av-press" style={{ ...sans, border: "none", cursor: "pointer", borderRadius: 999, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, background: d ? UI.okSoft : UI.vert, color: d ? UI.ok : "#FFFFFF" }}>{d ? "✓ Jointe" : "Joindre"}</button></Row>; })}</Card></Section>)}
                  <Section title="Le vendeur déclare"><Card>
                    {o.artiste !== "anonyme" && <Field label="Dénomination de l'attribution (décret du 3 mars 1981)"><Sel value={vocab} onChange={setVocab} options={VOCAB} /></Field>}
                    {DECL_Q.map((qn, i) => <div key={qn} style={{ padding: "12px 0", borderTop: `1px solid ${UI.line}` }}><div style={{ fontSize: 14, marginBottom: 10, lineHeight: 1.45 }}>{qn}</div><Seg value={decl[i] || ""} onChange={(v) => setDecl((d) => ({ ...d, [i]: v }))} options={[["Oui", "Oui"], ["Non", "Non"], ["NSP", "Ne sais pas"]]} /></div>)}
                    <div style={{ borderTop: `1px solid ${UI.line}`, paddingTop: 12, fontSize: 12.5, color: UI.inkSoft, lineHeight: 1.55, fontStyle: "italic" }}>« Je certifie la sincérité de mes déclarations et l'exhaustivité des pièces versées. » — signature sous identité vérifiée, scellé SHA-256.</div>
                  </Card></Section>
                </div>
              )}

              {step === 4 && (
                <div className="av-fade" key="s4">
                  <Title sub="Six domaines, un verdict.">{q.overall === "blocked" ? "Ne peut pas se conclure en l'état" : q.overall === "required" ? "Peut se conclure, sous conditions" : "Aucun obstacle"}</Title>
                  <Card style={{ display: "flex", alignItems: "center", gap: 16, background: TONE[q.overall][1] }}><Ring v={indice} size={60} /><div style={{ flex: 1 }}><Label>Statut global</Label><div style={{ ...serifU, fontSize: 28, color: TONE[q.overall][0], lineHeight: 1.1, marginTop: 4 }}>{KIND[q.overall][0]}</div><div style={{ fontSize: 12.5, color: UI.inkSoft, marginTop: 4 }}>{q.authorities.length} dossier{q.authorities.length > 1 ? "s" : ""} d'autorité · {nJ}/{q.pieces.length} pièces · {nD}/{DECL_Q.length} déclarations</div></div></Card>
                  <Section title="Par domaine"><Card pad={0} style={{ padding: "2px 16px" }}>{q.clearance.map(([dom, s, doms], i) => { const first = q.rules.filter((r) => doms.includes(r.domain)).sort((a, b) => ORDER[a.kind] - ORDER[b.kind])[0]; return <Row key={dom} last={i === q.clearance.length - 1}><div style={{ flex: 1 }}><div style={{ fontSize: 14.5, fontWeight: 600 }}>{dom}</div><div style={{ fontSize: 12.5, color: UI.mute, marginTop: 2 }}>{first ? first.titre : "—"}</div></div><Pill k={s} /></Row>; })}</Card></Section>
                </div>
              )}

              {step === 5 && <div className="av-fade" key="s5"><Title sub={q.authorities.length ? `${q.authorities.length} dossier${q.authorities.length > 1 ? "s" : ""} à déposer, générés depuis le dossier. Rien n'est ressaisi.` : "Aucune autorité à saisir pour cette vente."}>Autorités</Title>{q.authorities.map((a) => <Doc key={a.titre} titre={a.titre} sub={`Destinataire : ${a.dest}`} sections={a.sections} />)}<Doc titre="Extrait du livre de police" sub="Présentable sur réquisition" sections={["Numéro d'ordre, date d'entrée", "Description et marques", "Identité et pièce du vendeur", "Prix d'acquisition", "Sortie : date, acheteur, prix"]} />{structure === "maison" && o.mode === "encheres" && <Doc titre="Notification — droit de préemption" sub="Ministère de la Culture, après adjudication" sections={["Procès-verbal", "Lot", "Prix", "Délai de quinze jours"]} />}</div>}

              {step === 6 && (
                <div className="av-fade" key="s6">
                  <Title sub="Le vérifié, le déclaré, et ce qui reste à sa charge.">Rapport acheteur</Title>
                  <Card><div style={{ display: "flex", gap: 12, alignItems: "center" }}><Logo size={30} /><div><Label>Buyer report · {o.id}</Label><div style={{ ...mono, fontSize: 11.5, color: UI.mute, marginTop: 3 }}>{o.valeur.toLocaleString("fr-FR")} € · {o.lieu} → {o.dest} · 3 septembre 2026</div></div></div><div style={{ ...serifU, fontSize: 20, marginTop: 14, lineHeight: 1.25 }}>{o.titre || "Œuvre sans désignation"}</div></Card>
                  <Section title="Contenu"><Card pad={0} style={{ padding: "2px 16px" }}>{[["Vendeur", "Identité vérifiée, qualité justifiée, criblage négatif"], ["Attribution", o.artiste === "anonyme" ? "Non attribuée ; rapport d'expert joint" : `« ${vocab} » au sens du décret de 1981, garantie contractuelle du vendeur`], ["Provenance", `Chaîne documentée ; registres interrogés${o.annee < 1946 && o.annee > 1800 ? " ; spoliations recherchées" : ""}`], ["État", "Rapport photographique annexé ; restaurations selon déclaration"], ["Statut réglementaire", q.clearance.map(([d, s]) => `${d} : ${KIND[s][0].toLowerCase()}`).join(" · ")], ["Douane et fiscalité", `${q.rules.find((r) => r.domain === "customs")?.titre || ""} ; ${q.original ? "TVA 5,5 %" : "TVA sur la marge"}`], ["Ce que ce rapport ne garantit pas", "L'authenticité en tant que telle, l'état mécanique, la valeur, hors garantie contractuelle et expertises jointes"], ["Vos protections", `Déclarations à valeur d'aveu ; ${q.seq ? "prix consigné jusqu'à réception conforme ; " : ""}rapport contradictoire ; dossier conservé dix ans`]].map(([k, v], i, arr) => <Row key={k} last={i === arr.length - 1} style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}><Label>{k}</Label><div style={{ fontSize: 13.5, color: UI.inkSoft, lineHeight: 1.5 }}>{v}</div></Row>)}</Card></Section>
                </div>
              )}

              {step === 7 && <div className="av-fade" key="s7"><Title sub={`Bâti sur le dossier, pas sur un modèle : ${q.clauses.length} clauses, chacune justifiée par le régime.`}>Contrat de vente</Title><Card style={{ marginBottom: 12 }}><div style={{ ...serifU, fontSize: 20 }}>{o.nom}</div><div style={{ fontSize: 12.5, color: UI.mute, marginTop: 4 }}>Entre {structure === "maison" ? "le mandant représenté par la maison de vente" : "le vendeur"} et l'acheteur {o.acheteur === "public" ? "personne publique" : o.acheteur === "particulier" ? "consommateur" : "professionnel"}</div></Card><Card pad={0} style={{ padding: "2px 16px" }}>{q.clauses.map(([k, v], i) => <Row key={i} last={i === q.clauses.length - 1} style={{ alignItems: "flex-start" }}><span style={{ ...mono, color: UI.vert, fontSize: 11, width: 24, flexShrink: 0, paddingTop: 3, fontWeight: 600 }}>{String(i + 1).padStart(2, "0")}</span><div><div style={{ fontSize: 14, fontWeight: 600 }}>{k}</div><div style={{ fontSize: 13, color: UI.inkSoft, lineHeight: 1.5, marginTop: 2 }}>{v}</div></div></Row>)}</Card><div style={{ fontSize: 12, color: UI.mute, marginTop: 14, padding: "0 4px", lineHeight: 1.5 }}>Annexes : rapport, déclarations signées, rapport d'état, pièces indexées, dossiers d'autorités, calendrier douanier.</div></div>}

              {step === 8 && <div className="av-fade" key="s8"><Title sub={q.overall === "blocked" ? "Pas de clôture : le dossier reste archivé comme preuve de diligence." : "Pas à pas, jusqu'au sceau."}>Clôture</Title><Card pad={0} style={{ padding: "2px 16px" }}>{[["Signatures", "Contrat et déclarations sous identité vérifiée"], ...(q.seq ? [["Séquestre", "Prix consigné"]] : []), ...(q.authorities.length ? [["Autorisations", `${q.authorities.length} décision${q.authorities.length > 1 ? "s" : ""} obtenue${q.authorities.length > 1 ? "s" : ""}`]] : []), ...(q.rules.some((r) => r.domain === "customs" && r.kind !== "clear") ? [["Douane", "Régime régularisé, déclaration déposée, TVA acquittée"]] : []), ["Livraison", "Transporteur agréé, assurance clou à clou"], ["Réception", "Rapport contradictoire, réserves sous 48 h"], ...(q.seq ? [["Libération", "Fonds libérés au PV"]] : []), ...(structure === "maison" ? [["Procès-verbal", "À J + 1"]] : []), ...(o.source === "second" ? [["Livre de police", "Sortie inscrite"]] : []), ...(q.rules.some((r) => r.titre.startsWith("Droit de suite")) ? [["Droit de suite", "Versé"]] : []), ["Archivage", "Dossier scellé, dix ans"]].map(([k, v], i, arr) => <Row key={k} last={i === arr.length - 1}><span style={{ width: 28, height: 28, borderRadius: "50%", background: UI.vertSoft, color: UI.vert, display: "flex", alignItems: "center", justifyContent: "center", ...sans, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span><div style={{ flex: 1 }}><div style={{ fontSize: 14.5, fontWeight: 600 }}>{k}</div><div style={{ fontSize: 12.5, color: UI.mute, marginTop: 1 }}>{v}</div></div></Row>)}</Card>{q.overall !== "blocked" && <div style={{ background: UI.ink, color: "#FAF5EB", borderRadius: 22, padding: "30px 22px", marginTop: 18, textAlign: "center" }}><div style={{ display: "flex", justifyContent: "center" }}><Logo size={58} /></div><div style={{ marginTop: 14 }}><Wordmark size={19} color="#FAF5EB" /></div><div style={{ fontSize: 10.5, letterSpacing: "0.3em", textTransform: "uppercase", color: UI.jaune, marginTop: 10, fontWeight: 600 }}>Established</div><div style={{ ...serif, fontSize: 16, color: "#C9C5BB", marginTop: 12, lineHeight: 1.45 }}>This work and this transaction have been established and secured through ARTVELCHIV.</div><div style={{ ...mono, fontSize: 10.5, color: "#8B8880", marginTop: 12 }}>{o.id} · SHA-256 · 03/09/2026</div></div>}</div>}
            </main>
          </>
        )}

        {/* ===== barre du bas ===== */}
        {screen === "home" && (
          <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, boxSizing: "border-box", background: "rgba(255,255,255,0.86)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderTop: `1px solid ${UI.line}`, padding: "8px 10px calc(10px + env(safe-area-inset-bottom))", display: "flex", zIndex: 30 }}>
            {[["dossiers", "Dossiers"], ["structure", "Structure"], ["sources", "Référentiel"]].map(([k, l]) => <button key={k} onClick={() => { setTab(k); setOpen(null); }} className="av-press" style={{ ...sans, flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 0", fontSize: 10.5, fontWeight: 600, color: tab === k ? UI.vert : UI.mute }}><Ico name={k} active={tab === k} />{l}</button>)}
          </div>
        )}
        {screen === "record" && (
          <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, boxSizing: "border-box", background: "rgba(244,239,229,0.9)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderTop: `1px solid ${UI.line}`, padding: "12px 20px calc(14px + env(safe-area-inset-bottom))", display: "flex", gap: 10, zIndex: 30 }}>
            <Btn ghost onClick={() => { setOpen(null); step === 0 ? setScreen("home") : setStep(step - 1); window.scrollTo(0, 0); }}>Retour</Btn>
            <div style={{ flex: 1 }}>{step < 8 ? <Btn primary full onClick={() => { setOpen(null); setStep(step + 1); window.scrollTo(0, 0); }}>{["Voir les règles", "Douane et échéances", "Joindre les preuves", "Lancer la clearance", "Dossiers d'autorités", "Rapport acheteur", "Générer le contrat", "Clôturer"][step]}</Btn> : <Btn primary full>Exporter le dossier (PDF)</Btn>}</div>
          </div>
        )}
      </div>
    </div>
  );
}
