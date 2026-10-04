/* ARTVELCHIV — analyse d'un dossier par Claude.
   Entrée (POST JSON) : { dossier, regles, pieces, structure }
     dossier  : la fiche de l'œuvre et l'opération (titre, artiste, type, année, lieu, destination, prix, acheteur, mode, opération…)
     regles   : les règles identifiées par le moteur ARTVELCHIV (titre, détail, texte de référence, nature)
     pieces   : les pièces attendues (titre, groupe, présente)
   Sortie : un plan en langage courant, structuré en trois blocs : l'œuvre, les démarches (par destinataire), les documents.
   Variables : ANTHROPIC_API_KEY (obligatoire), ANTHROPIC_MODEL_ANALYSE (facultatif, par défaut claude-opus-5-5), APP_ACCESS_TOKEN, ALLOWED_ORIGINS. */

const PROMPT = `Tu es ARTVELCHIV, l'assistant de conformité des galeries, marchands et maisons de ventes. Un professionnel vient de décrire une œuvre et l'opération qu'il prépare. Le moteur de règles ARTVELCHIV t'indique les formalités identifiées et leurs textes : tu ne les contredis pas, tu les expliques et tu les complètes par ce que tu sais de cette œuvre, de cet artiste et de ce marché. Tu réponds en français, dans un langage simple et direct, sans jargon dans les titres (le terme juridique peut figurer dans l'explication). Chaque élément incertain est signalé « à vérifier ». Tu n'affirmes jamais l'authenticité ni l'attribution.

Réponds uniquement par un objet JSON de cette forme :
{
  "oeuvre": {
    "resume": "deux phrases sur l'œuvre telle que décrite (type, artiste, date, technique, ce qui la caractérise)",
    "ce_qui_compte": ["3 à 6 points propres à cette œuvre ou à cet artiste qui pèsent sur l'opération : comité ou fondation d'authentification, fontes posthumes, droit de suite, ancienneté, matériaux réglementés, notoriété des faux, etc."],
    "provenance": ["les éléments de provenance à documenter en priorité pour cette œuvre, en phrases courtes"],
    "description_dossier": "une description objective de 60 à 100 mots, utilisable telle quelle dans le dossier d'archive"
  },
  "demarches": [
    { "titre": "action en langage courant (verbe à l'infinitif)", "pour": "autorité | acheteur | vendeur | vous", "quand": "avant la vente | avant la sortie | avant la remise | après la vente | dès maintenant", "pourquoi": "une à deux phrases", "pieces": ["pièces nécessaires"], "base": "texte de référence, s'il y en a un", "a_verifier": false }
  ],
  "documents": {
    "archive": ["ce que l'archive de cette œuvre doit contenir, en 4 à 6 lignes"],
    "autorite": ["ce que le dossier pour l'administration doit contenir, ou [] si aucune démarche administrative"],
    "acheteur": ["ce que l'acheteur doit recevoir, en 4 à 6 lignes"],
    "contrat": ["les clauses à prévoir dans le contrat, en 4 à 6 lignes, ou [] si pas de vente"]
  },
  "en_une_phrase": "ce que le professionnel doit retenir, en une phrase"
}
Règles : 8 démarches au plus, classées par ordre d'exécution ; reprends chaque formalité fournie par le moteur (même titre ou titre reformulé, même base) ; n'invente pas de seuil ni de délai qui ne figure pas dans les règles fournies ou que tu ne connais pas avec certitude ; pas de texte hors du JSON.`;

function corsHeaders(req, res) {
  const allowed = (process.env.ALLOWED_ORIGINS || "https://www.artvelchiv.com,https://artvelchiv.com").split(",").map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.origin || "";
  if (allowed.includes("*")) res.setHeader("Access-Control-Allow-Origin", "*");
  else if (allowed.includes(origin)) { res.setHeader("Access-Control-Allow-Origin", origin); res.setHeader("Vary", "Origin"); }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Artvelchiv-Key");
  res.setHeader("Access-Control-Max-Age", "86400");
}
function readBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 2_000_000) { reject(new Error("Corps trop volumineux")); req.destroy(); } });
    req.on("end", () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(new Error("JSON invalide")); } });
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  corsHeaders(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method === "GET") return res.status(200).json({ service: "artvelchiv-analyse", etat: "en ligne", anthropic_configuree: Boolean(process.env.ANTHROPIC_API_KEY), modele: process.env.ANTHROPIC_MODEL_ANALYSE || "claude-opus-5-5 (défaut)" });
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
  const token = process.env.APP_ACCESS_TOKEN === undefined ? "arttest" : process.env.APP_ACCESS_TOKEN;
  if (token && String(req.headers["x-artvelchiv-key"] || "").trim().toLowerCase() !== token.toLowerCase()) return res.status(401).json({ error: "Code d'accès invalide" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: "Analyse non configurée (ANTHROPIC_API_KEY absente)" });
  let body; try { body = await readBody(req); } catch (e) { return res.status(400).json({ error: e.message }); }
  const dossier = body.dossier && typeof body.dossier === "object" ? body.dossier : null;
  if (!dossier) return res.status(400).json({ error: "Dossier manquant" });
  const regles = Array.isArray(body.regles) ? body.regles.slice(0, 40) : [];
  const pieces = Array.isArray(body.pieces) ? body.pieces.slice(0, 40) : [];
  const model = process.env.ANTHROPIC_MODEL_ANALYSE || "claude-opus-5-5";
  const texte = PROMPT + "\n\nStructure du professionnel : " + (body.structure || "galerie") +
    "\n\nDOSSIER (fiche et opération) :\n" + JSON.stringify(dossier, null, 1).slice(0, 6000) +
    "\n\nFORMALITÉS IDENTIFIÉES PAR LE MOTEUR ARTVELCHIV :\n" + regles.map((r) => `- [${r.nature}] ${r.titre} — ${r.detail} (${r.base || "sans texte"})`).join("\n").slice(0, 9000) +
    "\n\nPIÈCES ATTENDUES :\n" + pieces.map((p) => `- ${p.titre} (${p.groupe}) : ${p.presente ? "présente" : "manquante"}`).join("\n").slice(0, 3000);
  let r;
  try {
    r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 2200, temperature: 0, messages: [{ role: "user", content: texte }] }),
    });
  } catch (e) { return res.status(502).json({ error: "Anthropic injoignable : " + e.message }); }
  if (!r.ok) return res.status(502).json({ error: "Anthropic : " + r.status + " " + (await r.text()).slice(0, 200) });
  const j = await r.json();
  const raw = (j.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
  const a = raw.indexOf("{"), b = raw.lastIndexOf("}");
  if (a < 0 || b < 0) return res.status(502).json({ error: "Réponse d'analyse illisible" });
  let plan; try { plan = JSON.parse(raw.slice(a, b + 1)); } catch (e) { return res.status(502).json({ error: "Réponse d'analyse invalide" }); }
  plan.oeuvre = plan.oeuvre && typeof plan.oeuvre === "object" ? plan.oeuvre : {};
  plan.demarches = Array.isArray(plan.demarches) ? plan.demarches.slice(0, 8) : [];
  plan.documents = plan.documents && typeof plan.documents === "object" ? plan.documents : {};
  plan.modele = model; plan.horodatage = new Date().toISOString();
  plan.mention = "Analyse d'assistance : les formalités reprennent le moteur ARTVELCHIV ; les éléments propres à l'œuvre sont à vérifier par le professionnel.";
  return res.status(200).json(plan);
}
