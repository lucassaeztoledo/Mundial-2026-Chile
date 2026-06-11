export function normalizeString(str) {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const FLAGS = {
  "méxico": "🇲🇽", "mexico": "🇲🇽",
  "sudáfrica": "🇿🇦", "sudafrica": "🇿🇦",
  "corea del sur": "🇰🇷",
  "república checa": "🇨🇿", "republica checa": "🇨🇿",
  "canadá": "🇨🇦", "canada": "🇨🇦",
  "bosnia-herzegovina": "🇧🇦", "bosnia y herzegovina": "🇧🇦",
  "suiza": "🇨🇭",
  "qatar": "🇶🇦",
  "brasil": "🇧🇷",
  "marruecos": "🇲🇦",
  "haití": "🇭🇹", "haiti": "🇭🇹",
  "escocia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "estados unidos": "🇺🇸",
  "paraguay": "🇵🇾",
  "australia": "🇦🇺",
  "turquía": "🇹🇷", "turquia": "🇹🇷",
  "alemania": "🇩🇪",
  "curazao": "🇨🇼",
  "costa de marfil": "🇨🇮",
  "ecuador": "🇪🇨",
  "países bajos": "🇳🇱", "paises bajos": "🇳🇱",
  "japón": "🇯🇵", "japon": "🇯🇵",
  "suecia": "🇸🇪",
  "túnez": "🇹🇳", "tunez": "🇹🇳",
  "bélgica": "🇧🇪", "belgica": "🇧🇪",
  "egipto": "🇪🇬",
  "irán": "🇮🇷", "iran": "🇮🇷",
  "nueva zelanda": "🇳🇿",
  "españa": "🇪🇸", "espana": "🇪🇸",
  "cabo verde": "🇨🇻",
  "arabia saudita": "🇸🇦",
  "uruguay": "🇺🇾",
  "francia": "🇫🇷",
  "senegal": "🇸🇳",
  "irak": "🇮🇶",
  "noruega": "🇳🇴",
  "argentina": "🇦🇷",
  "argelia": "🇩🇿",
  "austria": "🇦🇹",
  "jordania": "🇯🇴",
  "portugal": "🇵🇹",
  "rd congo": "🇨🇩",
  "uzbekistán": "🇺🇿", "uzbekistan": "🇺🇿",
  "colombia": "🇨🇴",
  "inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "croacia": "🇭🇷",
  "ghana": "🇬🇭",
  "panamá": "🇵🇦", "panama": "🇵🇦"
};

export function getFlag(teamName) {
  if (!teamName) return "";
  const normalized = normalizeString(teamName);
  return FLAGS[normalized] || "🏳️";
}

