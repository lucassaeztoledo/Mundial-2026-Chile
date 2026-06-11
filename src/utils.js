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

export const TEAM_ENG_TO_ESP = {
  "Mexico": "México", "South Africa": "Sudáfrica",
  "South Korea": "Corea del Sur", "Czech Republic": "República Checa",
  "Canada": "Canadá", "Bosnia and Herzegovina": "Bosnia y Herzegovina",
  "Switzerland": "Suiza", "Qatar": "Qatar",
  "Brazil": "Brasil", "Morocco": "Marruecos",
  "Haiti": "Haití", "Scotland": "Escocia",
  "United States": "Estados Unidos", "Paraguay": "Paraguay",
  "Australia": "Australia", "Turkey": "Turquía",
  "Germany": "Alemania", "Curaçao": "Curazao", "Curacao": "Curazao",
  "Ivory Coast": "Costa de Marfil", "Ecuador": "Ecuador",
  "Netherlands": "Países Bajos", "Japan": "Japón",
  "Sweden": "Suecia", "Tunisia": "Túnez",
  "Belgium": "Bélgica", "Egypt": "Egipto",
  "Iran": "Irán", "New Zealand": "Nueva Zelanda",
  "Spain": "España", "Cape Verde": "Cabo Verde",
  "Saudi Arabia": "Arabia Saudita", "Uruguay": "Uruguay",
  "France": "Francia", "Senegal": "Senegal",
  "Iraq": "Irak", "Norway": "Noruega",
  "Argentina": "Argentina", "Algeria": "Argelia",
  "Austria": "Austria", "Jordan": "Jordania",
  "Portugal": "Portugal", "DR Congo": "RD Congo",
  "Uzbekistan": "Uzbekistán", "Colombia": "Colombia",
  "England": "Inglaterra", "Croatia": "Croacia",
  "Ghana": "Ghana", "Panama": "Panamá"
};

