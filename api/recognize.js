/* ARTVELCHIV — reconnaissance d'une œuvre à partir d'une photographie.
   Fonction serveur Vercel (Node 18 ou plus, aucune dépendance).

   Entrée  : POST /api/recognize  { "image": "<base64 ou data URL>", "mime": "image/jpeg" }
             en-tête X-Artvelchiv-Key : le code d'accès de l'application.
   Sortie  : { fiche, occurrences, similaires, entites, labels, texte, avertissements }

   Variables d'environnement (Vercel → Settings → Environment Variables) :
     GOOGLE_VISION_API_KEY  clé d'API Google Cloud (API Cloud Vision activée)
     ANTHROPIC_API_KEY      clé d'API Anthropic
     ANTHROPIC_MODEL        facultatif, par défaut claude-sonnet-5-5
     APP_ACCESS_TOKEN       code d'accès exigé (par défaut arttest) ; vide pour désactiver le contrôle
     ALLOWED_ORIGINS        origines autorisées, séparées par des virgules (par défaut www.artvelchiv.com et artvelchiv.com) ; * pour tout autoriser
*/

const NATURES = ["peinture", "oeuvre_papier", "sculpture", "photo", "archeo", "religieux", "manuscrit", "mobilier", "bijou", "instrument", "armes", "numismatique", "naturel", "autre"];
const MATERIAUX = ["toile", "bronze", "pierre", "terre", "bois", "ivoire", "precieux", "textile", "mixte"];
const STATUTS = ["vivant", "moins70", "plus70", "anonyme"];
const TECHNIQUES = ["gouache", "dessin", "estampe", "manuscrit", "livre", "archives", "carte"];

const PROMPT = `Tu assistes un professionnel du marché de l'art (galerie, marchand, maison de ventes) qui prépare le dossier de vente d'une œuvre. Analyse la photographie et réponds UNIQUEMENT par un objet JSON, sans texte autour, avec exactement ces clés :
{
  "nature": une valeur parmi ${JSON.stringify(NATURES)},
  "technique": pour une œuvre sur papier, une valeur parmi ["gouache","dessin","estampe"] ; pour un manuscrit ou un livre, parmi ["manuscrit","livre","archives","carte"] ; sinon null,
  "materiau": une valeur parmi ${JSON.stringify(MATERIAUX)},
  "annee_estimee": un entier (année probable de création ; négatif pour avant J.-C.),
  "periode_texte": une courte expression en français (ex. "vers 1950", "XVe siècle", "Basse Époque"),
  "artiste": { "statut": une valeur parmi ${JSON.stringify(STATUTS)}, "nom_probable": un nom ou null, "ecole": une école, un atelier ou une aire culturelle, ou null, "confiance": un nombre entre 0 et 1 },
  "signature_visible": true ou false,
  "inscriptions": le texte lisible (signature, date, cachet, étiquette) ou null,
  "dimensions_estimees": une estimation en centimètres ou null,
  "etat_apparent": une phrase sobre sur l'état visible (usures, manques, restaurations apparentes),
  "description": deux ou trois phrases de description objective, en français, sans jugement de valeur,
  "espece_protegee_possible": true si un matériau réglementé est plausible (ivoire, écaille, corail, corne, bois précieux), sinon false,
  "points_de_vigilance": une liste de phrases courtes (provenance à documenter, fonte posthume possible, objet archéologique, etc.),
  "confiance_globale": un nombre entre 0 et 1
}
Règles : n'affirme jamais l'authenticité ni l'attribution ; si un élément est incertain, mets null et baisse la confiance ; si des indices trouvés sur internet te sont fournis, utilise-les avec prudence et signale-les dans points_de_vigilance.`;

function corsHeaders(req, res) {
  const allowed = (process.env.ALLOWED_ORIGINS || "https://www.artvelchiv.com,https://artvelchiv.com").split(",").map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.origin || "";
  if (allowed.includes("*")) res.setHeader("Access-Control-Allow-Origin", "*");
  else if (allowed.includes(origin)) { res.setHeader("Access-Control-Allow-Origin", origin); res.setHeader("Vary", "Origin"); }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Artvelchiv-Key");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 8_000_000) { reject(new Error("Corps trop volumineux")); req.destroy(); } });
    req.on("end", () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(new Error("JSON invalide")); } });
    req.on("error", reject);
  });
}

function domainOf(url) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return ""; } }

async function visionWebDetection(b64) {
  const key = process.env.GOOGLE_VISION_API_KEY;
  if (!key) return { skipped: "GOOGLE_VISION_API_KEY absente" };
  const r = await fetch("https://vision.googleapis.com/v1/images:annotate?key=" + encodeURIComponent(key), {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requests: [{ image: { content: b64 }, features: [{ type: "WEB_DETECTION", maxResults: 15 }, { type: "LABEL_DETECTION", maxResults: 10 }, { type: "TEXT_DETECTION", maxResults: 5 }] }] }),
  });
  if (!r.ok) throw new Error("Google Vision : " + r.status + " " + (await r.text()).slice(0, 200));
  const j = await r.json();
  const rep = (j.responses && j.responses[0]) || {};
  if (rep.error) throw new Error("Google Vision : " + rep.error.message);
  const web = rep.webDetection || {};
  const pages = (web.pagesWithMatchingImages || []).map((p) => ({ url: p.url, titre: (p.pageTitle || "").replace(/<[^>]+>/g, "").trim(), source: domainOf(p.url), exact: !!(p.fullMatchingImages && p.fullMatchingImages.length) }));
  return {
    occurrences: pages,
    similaires: (web.visuallySimilarImages || []).map((i) => i.url).slice(0, 8),
    imagesIdentiques: (web.fullMatchingImages || []).map((i) => i.url).slice(0, 8),
    entites: (web.webEntities || []).filter((e) => e.description).map((e) => ({ nom: e.description, score: Math.round((e.score || 0) * 100) / 100 })),
    meilleureHypothese: (web.bestGuessLabels || []).map((l) => l.label).filter(Boolean),
    labels: (rep.labelAnnotations || []).map((l) => ({ nom: l.description, score: Math.round((l.score || 0) * 100) / 100 })),
    texte: rep.textAnnotations && rep.textAnnotations[0] ? rep.textAnnotations[0].description.trim().slice(0, 500) : "",
  };
}

async function claudeFiche(b64, mime, indices) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { skipped: "ANTHROPIC_API_KEY absente" };
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
  let texte = PROMPT;
  if (indices && (indices.entites || indices.texte || indices.meilleureHypothese)) {
    texte += "\n\nIndices trouvés sur internet à partir de la même image (à vérifier, jamais à tenir pour acquis) :\n" +
      (indices.meilleureHypothese && indices.meilleureHypothese.length ? "- Hypothèse générale : " + indices.meilleureHypothese.join(", ") + "\n" : "") +
      (indices.entites && indices.entites.length ? "- Entités associées : " + indices.entites.slice(0, 8).map((e) => e.nom).join(", ") + "\n" : "") +
      (indices.texte ? "- Texte lisible sur l'image : " + indices.texte.slice(0, 200) + "\n" : "") +
      (indices.occurrences && indices.occurrences.length ? "- Pages où l'image apparaît : " + indices.occurrences.slice(0, 5).map((p) => p.titre || p.source).join(" ; ") + "\n" : "");
  }
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: 900, temperature: 0, messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mime, data: b64 } }, { type: "text", text: texte }] }] }),
  });
  if (!r.ok) throw new Error("Anthropic : " + r.status + " " + (await r.text()).slice(0, 200));
  const j = await r.json();
  const raw = (j.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
  const a = raw.indexOf("{"), b = raw.lastIndexOf("}");
  if (a < 0 || b < 0) throw new Error("Réponse d'analyse illisible");
  const f = JSON.parse(raw.slice(a, b + 1));
  /* normalisation vers les valeurs connues de l'application */
  f.nature = NATURES.includes(f.nature) ? f.nature : "autre";
  f.technique = TECHNIQUES.includes(f.technique) ? f.technique : null;
  f.materiau = MATERIAUX.includes(f.materiau) ? f.materiau : "mixte";
  f.annee_estimee = Number.isFinite(+f.annee_estimee) ? Math.round(+f.annee_estimee) : null;
  f.artiste = f.artiste && typeof f.artiste === "object" ? f.artiste : {};
  f.artiste.statut = STATUTS.includes(f.artiste.statut) ? f.artiste.statut : "anonyme";
  f.artiste.confiance = Math.max(0, Math.min(1, +f.artiste.confiance || 0));
  f.points_de_vigilance = Array.isArray(f.points_de_vigilance) ? f.points_de_vigilance.map(String).slice(0, 8) : [];
  f.confiance_globale = Math.max(0, Math.min(1, +f.confiance_globale || 0));
  f.modele = model;
  return f;
}

export default async function handler(req, res) {
  corsHeaders(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
  const token = process.env.APP_ACCESS_TOKEN === undefined ? "arttest" : process.env.APP_ACCESS_TOKEN;
  if (token && String(req.headers["x-artvelchiv-key"] || "").trim().toLowerCase() !== token.toLowerCase()) return res.status(401).json({ error: "Code d'accès invalide" });
  let body;
  try { body = await readBody(req); } catch (e) { return res.status(400).json({ error: e.message }); }
  const image = typeof body.image === "string" ? body.image : "";
  const mime = ["image/jpeg", "image/png", "image/webp"].includes(body.mime) ? body.mime : "image/jpeg";
  const b64 = image.replace(/^data:[^;]+;base64,/, "").replace(/\s+/g, "");
  if (!b64) return res.status(400).json({ error: "Image manquante" });
  if (b64.length > 5_500_000) return res.status(413).json({ error: "Image trop lourde : réduisez-la à 1 600 pixels de côté" });

  const avertissements = [];
  let vision = null, fiche = null;
  try { vision = await visionWebDetection(b64); if (vision.skipped) { avertissements.push("Recherche d'occurrences en ligne non activée (" + vision.skipped + ")."); vision = null; } }
  catch (e) { avertissements.push("Recherche d'occurrences en ligne indisponible : " + e.message); vision = null; }
  try { fiche = await claudeFiche(b64, mime, vision); if (fiche.skipped) { avertissements.push("Analyse de la photographie non activée (" + fiche.skipped + ")."); fiche = null; } }
  catch (e) { avertissements.push("Analyse de la photographie indisponible : " + e.message); fiche = null; }
  if (!vision && !fiche) return res.status(503).json({ error: "Service de reconnaissance non configuré", avertissements });

  return res.status(200).json({
    fiche,
    occurrences: vision ? vision.occurrences : [],
    similaires: vision ? vision.similaires : [],
    imagesIdentiques: vision ? vision.imagesIdentiques : [],
    entites: vision ? vision.entites : [],
    meilleureHypothese: vision ? vision.meilleureHypothese : [],
    labels: vision ? vision.labels : [],
    texte: vision ? vision.texte : "",
    avertissements,
    horodatage: new Date().toISOString(),
    mention: "Assistance à la description. Aucune affirmation d'authenticité ni d'attribution : chaque élément doit être vérifié par le professionnel.",
  });
};
