import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import db from './data/db.json';
import { normalizeString, getFlag, TEAM_ENG_TO_ESP } from './utils';

function StatRow({ label, homeVal, awayVal, isPct = false }) {
  const homeNum = parseFloat(homeVal) || 0;
  const awayNum = parseFloat(awayVal) || 0;
  let homeWidth = 50;
  if (isPct) {
    homeWidth = homeNum;
  } else {
    const total = homeNum + awayNum;
    homeWidth = total > 0 ? (homeNum / total) * 100 : 50;
  }
  
  return (
    <div className="stat-comparison-row">
      <div className="stat-label-row">
        <span className="stat-val home-val">{homeVal || '0'}</span>
        <span className="stat-name">{label}</span>
        <span className="stat-val away-val">{awayVal || '0'}</span>
      </div>
      <div className="stat-bar-container">
        <div className="stat-bar home-bar" style={{ width: `${homeWidth}%` }}></div>
        <div className="stat-bar away-bar" style={{ width: `${100 - homeWidth}%` }}></div>
      </div>
    </div>
  );
}

function MatchCard({ match, searchTerm, isExpanded, onToggleExpand }) {
  const homeGoals = match.details?.filter(d => d.scoringPlay && (d.team_id === match.homeTeamId || TEAM_ENG_TO_ESP[match.home_team_name_en] === TEAM_ENG_TO_ESP[d.team_id])) || [];
  const awayGoals = match.details?.filter(d => d.scoringPlay && (d.team_id === match.awayTeamId || TEAM_ENG_TO_ESP[match.away_team_name_en] === TEAM_ENG_TO_ESP[d.team_id])) || [];
  const hasDetails = match.details && match.details.length > 0;
  
  // Custom icons for timeline events
  const getTimelineIcon = (type) => {
    if (type.toLowerCase().includes('goal')) return '⚽';
    if (type.toLowerCase().includes('red card') || type.toLowerCase().includes('red')) return '🟥';
    if (type.toLowerCase().includes('yellow card') || type.toLowerCase().includes('yellow')) return '🟨';
    return '⏱️';
  };

  const isFinished = match.score1 !== undefined && !match.isLive;

  return (
    <div className={`match-card ${match.score1 !== undefined ? 'result-card' : ''} ${match.isLive ? 'live-card' : ''} ${isFinished ? 'finished-card' : ''}`}>
      {/* Status banner at top */}
      {match.isLive && (
        <div className="match-status-banner live-banner">
          <span className="live-dot"></span>
          <span>EN VIVO</span>
          {match.timeElapsed && match.timeElapsed !== 'notstarted' && (
            <span className="live-elapsed">
              {match.timeElapsed.toLowerCase().includes('ht') || match.timeElapsed.toLowerCase().includes('half')
                ? '— ENTRETIEMPO ☕'
                : `— MIN ${match.timeElapsed}`}
            </span>
          )}
        </div>
      )}
      {isFinished && (
        <div className="match-status-banner finished-banner">
          <span>✔</span>
          <span>FINALIZADO</span>
        </div>
      )}

      <div className="match-datetime">
        <div className="match-date">{match.date}</div>
        <div className="match-time-container">
          <span className="match-time">{match.time} hrs</span>
        </div>
      </div>
      
      <div className="match-teams">
        <span className={`team-name text-right ${normalizeString(match.team1).includes(normalizeString(searchTerm)) && searchTerm ? 'highlight' : ''}`}>
          {getFlag(match.team1)} {match.team1}
        </span>
        {match.score1 !== undefined ? (
          <span className="match-score-pill">
            {match.score1} - {match.score2}
          </span>
        ) : (
          <span className="vs">vs</span>
        )}
        <span className={`team-name text-left ${normalizeString(match.team2).includes(normalizeString(searchTerm)) && searchTerm ? 'highlight' : ''}`}>
          {getFlag(match.team2)} {match.team2}
        </span>
      </div>
      
      <div className="match-info">
        <div className="match-group">Grupo {match.group}</div>
        <div className="match-location">{match.venue || match.location}</div>
        {match.channels && match.channels.length > 0 && (
          <div className="match-channels">
            {match.channels.map(ch => (
              <span key={ch} className="channel-tag">{ch}</span>
            ))}
          </div>
        )}
      </div>

      {/* Scorers Row (direct glance) */}
      {match.details && match.details.some(d => d.scoringPlay) && (
        <div className="match-scorers-row">
          <div className="home-scorers">
            {homeGoals.map((g, i) => (
              <div key={i} className="scorer">
                <span>⚽ {g.athlete} <span className="scorer-clock">({g.clock})</span></span>
                {g.assist && <span className="scorer-assist">🅰️ {g.assist}</span>}
              </div>
            ))}
          </div>
          <div className="scorer-icon-divider">|</div>
          <div className="away-scorers">
            {awayGoals.map((g, i) => (
              <div key={i} className="scorer">
                <span>⚽ {g.athlete} <span className="scorer-clock">({g.clock})</span></span>
                {g.assist && <span className="scorer-assist">🅰️ {g.assist}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded details (stats & timeline) */}
      {isExpanded && hasDetails && (
        <div className="match-details-expanded">
          <div className="details-grid">
            {/* Timeline Column */}
            <div>
              <div className="details-column-title">
                <span>⏱️</span> Cronología del partido
              </div>
              <div className="details-timeline">
                {match.details.map((d, i) => (
                  <div key={i} className="timeline-item">
                    <span className="timeline-time">{d.clock}</span>
                    <span className="timeline-icon">{getTimelineIcon(d.type)}</span>
                    <span className="timeline-text">
                      <strong>{d.athlete}</strong>
                      {d.assist && <span className="timeline-assist"> (🅰️ {d.assist})</span>}
                      {' '}({d.team_id === match.homeTeamId || TEAM_ENG_TO_ESP[match.home_team_name_en] === TEAM_ENG_TO_ESP[d.team_id] ? match.team1 : match.team2}) — {d.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistics Column */}
            <div>
              <div className="details-column-title">
                <span>📊</span> Estadísticas del partido
              </div>
              <div className="stats-comparison-container">
                <StatRow 
                  label="Posesión" 
                  homeVal={match.homeStats?.possession} 
                  awayVal={match.awayStats?.possession} 
                  isPct={true} 
                />
                <StatRow 
                  label="Tiros al Arco" 
                  homeVal={match.homeStats?.shotsOnTarget} 
                  awayVal={match.awayStats?.shotsOnTarget} 
                />
                <StatRow 
                  label="Tiros Totales" 
                  homeVal={match.homeStats?.totalShots} 
                  awayVal={match.awayStats?.totalShots} 
                />
                <StatRow 
                  label="Faltas Cometidas" 
                  homeVal={match.homeStats?.fouls} 
                  awayVal={match.awayStats?.fouls} 
                />
                <StatRow 
                  label="Tiros de Esquina" 
                  homeVal={match.homeStats?.corners} 
                  awayVal={match.awayStats?.corners} 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expand/Collapse Button */}
      {hasDetails && (
        <div className="expand-btn-container">
          <button className="expand-btn" onClick={onToggleExpand}>
            {isExpanded ? (
              <>Ocultar Detalles ⬆️</>
            ) : (
              <>Ver Detalles y Estadísticas ⬇️</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function BracketMatch({ match, matchNumber, resolveTeamName }) {
  if (!match) {
    return (
      <div className="bracket-match-card">
        <div className="bracket-match-info">
          <span>P. {matchNumber}</span>
          <span>Por definir</span>
        </div>
        <div className="bracket-team">
          <span className="bracket-team-name">🏳️ Por definir</span>
        </div>
        <div className="bracket-team">
          <span className="bracket-team-name">🏳️ Por definir</span>
        </div>
      </div>
    );
  }

  const team1Resolved = resolveTeamName(match.home_team_name_en);
  const team2Resolved = resolveTeamName(match.away_team_name_en);

  const score1 = (match.finished === 'TRUE' || match.time_elapsed !== 'notstarted') ? match.home_score : undefined;
  const score2 = (match.finished === 'TRUE' || match.time_elapsed !== 'notstarted') ? match.away_score : undefined;

  const isLive = match.finished === 'FALSE' && match.time_elapsed !== 'notstarted';

  // Determine winner for class highlighting
  let team1IsWinner = false;
  let team2IsWinner = false;
  if (match.finished === 'TRUE') {
    if (match.home_score > match.away_score) team1IsWinner = true;
    else if (match.away_score > match.home_score) team2IsWinner = true;
  }

  return (
    <div className="bracket-match-card">
      <div className="bracket-match-info">
        <span>P. {matchNumber}</span>
        <span className="bracket-match-venue" title={match.venue}>{match.venue || 'Por definir'}</span>
      </div>
      <div className={`bracket-team ${team1IsWinner ? 'winner' : ''}`}>
        <span className="bracket-team-name">
          {team1Resolved.flag} {team1Resolved.name}
          {team1Resolved.slot && <span className="bracket-team-slot"> ({team1Resolved.slot})</span>}
        </span>
        {score1 !== undefined && (
          <span className="bracket-team-score">{score1}</span>
        )}
      </div>
      <div className={`bracket-team ${team2IsWinner ? 'winner' : ''}`}>
        <span className="bracket-team-name">
          {team2Resolved.flag} {team2Resolved.name}
          {team2Resolved.slot && <span className="bracket-team-slot"> ({team2Resolved.slot})</span>}
        </span>
        {score2 !== undefined && (
          <span className="bracket-team-score">{score2}</span>
        )}
      </div>
    </div>
  );
}

const parseSpanishDate = (spanishDateStr) => {
  if (!spanishDateStr) return null;
  const parts = spanishDateStr.split(' ');
  if (parts.length < 4) return null;
  const dayNum = parseInt(parts[1], 10);
  const monthName = parts[3].toLowerCase();
  
  const months = {
    'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
    'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
  };
  
  const monthNum = months[monthName];
  if (monthNum === undefined) return null;
  
  return new Date(2026, monthNum, dayNum);
};

function App() {
  const [activeTab, setActiveTab] = useState('partidos');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMatches, setExpandedMatches] = useState({});
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [newsError, setNewsError] = useState(null);

  const fallbackNews = [
    {
      id: 'mock-1',
      headline: 'El Estadio Azteca se prepara para una inauguración histórica',
      description: 'El legendario Estadio Azteca de la Ciudad de México recibirá el partido inaugural del torneo, convirtiéndose en el primer estadio en albergar tres Copas del Mundo.',
      published: '2026-06-11T19:00:00Z',
      url: 'https://www.espn.com/soccer',
      image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=60'
    },
    {
      id: 'mock-2',
      headline: 'Los favoritos para alzar la Copa del Mundo en 2026',
      description: 'Analistas deportivos de todo el mundo debaten sobre las posibilidades de Francia, Brasil, Argentina e Inglaterra para consagrarse en la Gran Final del 19 de julio.',
      published: '2026-06-12T10:00:00Z',
      url: 'https://www.espn.com/soccer',
      image: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=800&auto=format&fit=crop&q=60'
    },
    {
      id: 'mock-3',
      headline: 'FIFA confirma las sedes de entrenamiento oficiales de las selecciones',
      description: 'Conoce los complejos complejos deportivos elegidos por los equipos clasificados para concentrar a lo largo de las distintas ciudades sede en Norteamérica.',
      published: '2026-06-12T12:00:00Z',
      url: 'https://www.espn.com/soccer',
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=60'
    }
  ];

  const toggleMatchExpanded = (key) => {
    setExpandedMatches(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Contador regresivo para el partido inaugural (11 de junio, 15:00 CLT / UTC-4)
  const calculateTimeLeft = () => {
    const targetDate = new Date('2026-06-11T15:00:00-04:00');
    const difference = +targetDate - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        finished: false
      };
    } else {
      timeLeft = { finished: true };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const [apiMatches, setApiMatches] = useState([]);

  useEffect(() => {
    const fetchResults = () => {
      fetch('/.netlify/functions/get-results')
        .then(res => {
          if (!res.ok) throw new Error('Error al cargar marcadores remotos');
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setApiMatches(data);
          }
        })
        .catch(err => {
          console.warn('Usando base de datos estática como respaldo:', err);
        });
    };

    fetchResults();

    // Consultar marcadores cada 30 segundos
    const intervalId = setInterval(fetchResults, 30000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (activeTab === 'noticias' && news.length === 0) {
      setLoadingNews(true);
      fetch('/.netlify/functions/get-news')
        .then(res => {
          if (!res.ok) throw new Error('Error al cargar noticias remotas');
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setNews(data);
          }
          setLoadingNews(false);
        })
        .catch(err => {
          console.warn('Error al cargar noticias:', err);
          setNewsError(err.message);
          setLoadingNews(false);
        });
    }
  }, [activeTab, news.length]);


  const mergedMatches = useMemo(() => {
    return db.matches.map(match => {
      // Buscar coincidencia en la API
      const apiMatch = apiMatches.find(g => {
        const homeEsp = TEAM_ENG_TO_ESP[g.home_team_name_en] || g.home_team_name_en;
        const awayEsp = TEAM_ENG_TO_ESP[g.away_team_name_en] || g.away_team_name_en;
        return (
          normalizeString(homeEsp) === normalizeString(match.team1) &&
          normalizeString(awayEsp) === normalizeString(match.team2)
        );
      });

      if (apiMatch) {
        const hasStarted = apiMatch.time_elapsed !== 'notstarted';
        let localTime = match.time;
        let localDate = match.date;

        if (apiMatch.date) {
          try {
            const matchDate = new Date(apiMatch.date);
            // Formatear la hora local en formato HH:MM
            localTime = matchDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
            
            // Formatear la fecha local en formato "Día N de Mes" (ej: "Miércoles 17 de junio")
            const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            localDate = `${days[matchDate.getDay()]} ${matchDate.getDate()} de ${months[matchDate.getMonth()]}`;
          } catch (e) {
            console.error('Error parsing apiMatch date:', e);
          }
        }

        return {
          ...match,
          time: localTime,
          date: localDate,
          score1: hasStarted ? apiMatch.home_score : undefined,
          score2: hasStarted ? apiMatch.away_score : undefined,
          isLive: hasStarted && apiMatch.finished === 'FALSE',
          timeElapsed: apiMatch.time_elapsed,
          venue: apiMatch.venue || match.location,
          homeTeamId: apiMatch.home_team_id,
          awayTeamId: apiMatch.away_team_id,
          details: apiMatch.details || [],
          homeStats: apiMatch.home_stats || {},
          awayStats: apiMatch.away_stats || {},
          home_team_name_en: apiMatch.home_team_name_en,
          away_team_name_en: apiMatch.away_team_name_en
        };
      }
      return match;
    });
  }, [apiMatches]);

  // Standings computation
  const groupStandings = useMemo(() => {
    const standings = {};
    
    // Initialize groups
    db.groups.forEach(g => {
      standings[g.name] = g.teams.map(teamName => ({
        team: teamName,
        pj: 0,
        pg: 0,
        pe: 0,
        pp: 0,
        gf: 0,
        gc: 0,
        dg: 0,
        pts: 0
      }));
    });

    // Populate stats from matches
    mergedMatches.forEach(match => {
      if (match.group && match.score1 !== undefined && match.score1 !== null) {
        const groupList = standings[match.group];
        if (groupList) {
          const t1 = groupList.find(t => t.team === match.team1);
          const t2 = groupList.find(t => t.team === match.team2);
          if (t1 && t2) {
            const s1 = parseInt(match.score1, 10);
            const s2 = parseInt(match.score2, 10);
            
            t1.pj += 1;
            t2.pj += 1;
            t1.gf += s1;
            t1.gc += s2;
            t2.gf += s2;
            t2.gc += s1;
            
            if (s1 > s2) {
              t1.pg += 1;
              t1.pts += 3;
              t2.pp += 1;
            } else if (s1 < s2) {
              t2.pg += 1;
              t2.pts += 3;
              t1.pp += 1;
            } else {
              t1.pe += 1;
              t1.pts += 1;
              t2.pe += 1;
              t2.pts += 1;
            }
          }
        }
      }
    });

    // Sort and calculate dg
    Object.keys(standings).forEach(letter => {
      standings[letter].forEach(t => {
        t.dg = t.gf - t.gc;
      });
      
      standings[letter].sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.dg !== a.dg) return b.dg - a.dg;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.team.localeCompare(b.team);
      });
    });

    return standings;
  }, [mergedMatches]);

  const bestThirds = useMemo(() => {
    const thirds = [];
    Object.keys(groupStandings).forEach(letter => {
      const teamStat = groupStandings[letter][2]; // 3rd place team
      if (teamStat) {
        thirds.push({
          ...teamStat,
          groupName: letter
        });
      }
    });

    return thirds.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dg !== a.dg) return b.dg - a.dg;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.team.localeCompare(b.team);
    });
  }, [groupStandings]);

  // Helper to resolve team names and flags for knockout stages
  const resolveTeamName = (teamNameEn) => {
    if (!teamNameEn) return { name: 'Por definir', flag: '🏳️', slot: '' };

    const cleanName = teamNameEn.trim();

    // 1. Check direct Spanish mapping
    if (TEAM_ENG_TO_ESP[cleanName]) {
      const espName = TEAM_ENG_TO_ESP[cleanName];
      return { name: espName, flag: getFlag(espName), slot: '' };
    }

    // If it's a real team name not in mapping, but not a placeholder
    const isPlaceholder = cleanName.includes('Winner') || 
                          cleanName.includes('Place') || 
                          cleanName.includes('Loser') || 
                          cleanName.includes('Round of') || 
                          cleanName.includes('Quarterfinal') || 
                          cleanName.includes('Semifinal');

    if (!isPlaceholder) {
      return { name: cleanName, flag: getFlag(cleanName), slot: '' };
    }

    // 2. Parse Winner of Group
    const winnerMatch = cleanName.match(/Group ([A-L]) Winner/i);
    if (winnerMatch) {
      const letter = winnerMatch[1];
      const stand = groupStandings[letter];
      const slotLabel = `1° Grupo ${letter}`;
      if (stand && stand[0]) {
        const groupHasStarted = stand.some(t => t.pj > 0);
        if (groupHasStarted) {
          const team = stand[0].team;
          return { name: team, flag: getFlag(team), slot: slotLabel };
        }
      }
      return { name: slotLabel, flag: '🏳️', slot: '' };
    }

    // 3. Parse 2nd Place of Group
    const secondMatch = cleanName.match(/Group ([A-L]) 2nd Place/i);
    if (secondMatch) {
      const letter = secondMatch[1];
      const stand = groupStandings[letter];
      const slotLabel = `2° Grupo ${letter}`;
      if (stand && stand[1]) {
        const groupHasStarted = stand.some(t => t.pj > 0);
        if (groupHasStarted) {
          const team = stand[1].team;
          return { name: team, flag: getFlag(team), slot: slotLabel };
        }
      }
      return { name: slotLabel, flag: '🏳️', slot: '' };
    }

    // 4. Parse Third Place combinations
    const thirdMatch = cleanName.match(/Third Place Group ([A-L\/]+)/i);
    if (thirdMatch) {
      const combos = thirdMatch[1]; // e.g. "A/B/C/D/F"
      const groupLetters = combos.split('/');
      const slotLabel = `3° Grupo ${combos}`;
      
      const qualifiedThirds = bestThirds.slice(0, 8);
      const candidates = qualifiedThirds.filter(t => groupLetters.includes(t.groupName) && t.pj > 0);
      
      if (candidates.length > 0) {
        const selected = candidates[0];
        return { name: selected.team, flag: getFlag(selected.team), slot: slotLabel };
      }
      return { name: slotLabel, flag: '🏳️', slot: '' };
    }

    // 5. Winners of previous knockout stages
    const r32Winner = cleanName.match(/Round of 32 (\d+) Winner/i);
    if (r32Winner) {
      return { name: `Ganador 16avos ${r32Winner[1]}`, flag: '🏳️', slot: '' };
    }
    const r16Winner = cleanName.match(/Round of 16 (\d+) Winner/i);
    if (r16Winner) {
      return { name: `Ganador Octavos ${r16Winner[1]}`, flag: '🏳️', slot: '' };
    }
    const qfWinner = cleanName.match(/Quarterfinal (\d+) Winner/i);
    if (qfWinner) {
      return { name: `Ganador Cuartos ${qfWinner[1]}`, flag: '🏳️', slot: '' };
    }
    const sfWinner = cleanName.match(/Semifinal (\d+) Winner/i);
    if (sfWinner) {
      return { name: `Ganador Semifinal ${sfWinner[1]}`, flag: '🏳️', slot: '' };
    }
    const sfLoser = cleanName.match(/Semifinal (\d+) Loser/i);
    if (sfLoser) {
      return { name: `Perdedor Semifinal ${sfLoser[1]}`, flag: '🏳️', slot: '' };
    }

    return { name: cleanName, flag: '🏳️', slot: '' };
  };

  // Ticker Games computation
  const tickerGames = useMemo(() => {
    let list = [];
    if (apiMatches && apiMatches.length > 0) {
      list = apiMatches.map(m => {
        const homeRes = resolveTeamName(m.home_team_name_en);
        const awayRes = resolveTeamName(m.away_team_name_en);
        
        const finished = m.finished === 'TRUE';
        const isLive = m.finished === 'FALSE' && m.time_elapsed !== 'notstarted';
        
        let dateStr = '';
        let timeStr = '';
        let isToday = false;
        let dateObj = null;

        if (m.date) {
          dateObj = new Date(m.date);
          const matchDate = dateObj;
          const today = new Date();
          
          isToday = matchDate.getFullYear() === today.getFullYear() &&
                    matchDate.getMonth() === today.getMonth() &&
                    matchDate.getDate() === today.getDate();
          
          const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
          dateStr = `${matchDate.getDate()} ${months[matchDate.getMonth()]}`;
          timeStr = matchDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
        }

        let statusText = '';
        if (isLive) {
          const elapsed = m.time_elapsed || 'Live';
          if (elapsed.toLowerCase().includes('ht') || elapsed.toLowerCase().includes('half') || elapsed.toLowerCase().includes('entretiempo') || elapsed.toLowerCase().includes('mid')) {
            statusText = 'ENTRETIEMPO ☕';
          } else if (elapsed.toLowerCase().includes('live')) {
            statusText = 'EN VIVO ⏱️';
          } else {
            statusText = `MIN ${elapsed}`;
          }
        } else if (finished) {
          statusText = 'FINALIZADO 🏁';
        } else {
          statusText = isToday ? `HOY | ${timeStr}` : `${dateStr} | ${timeStr}`;
        }

        const scoreString = (finished || isLive) ? `${m.home_score} - ${m.away_score}` : 'vs';

        return {
          home: homeRes.name,
          homeFlag: homeRes.flag,
          away: awayRes.name,
          awayFlag: awayRes.flag,
          score: scoreString,
          isLive,
          finished,
          statusText,
          isToday,
          dateObj
        };
      });
    } else {
      list = db.matches.map(m => {
        const today = new Date();
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const todayStr = `${days[today.getDay()]} ${today.getDate()} de ${months[today.getMonth()]}`;
        
        const isToday = m.date === todayStr;
        const dateObj = parseSpanishDate(m.date);
        
        const parts = m.date.split(' ');
        const dateStr = parts.length >= 3 ? `${parts[1]} ${parts[3].slice(0, 3)}` : m.date;
        
        const statusText = isToday ? `HOY | ${m.time}` : `${dateStr} | ${m.time}`;

        return {
          home: m.team1,
          homeFlag: getFlag(m.team1),
          away: m.team2,
          awayFlag: getFlag(m.team2),
          score: 'vs',
          isLive: false,
          finished: false,
          statusText,
          isToday,
          dateObj
        };
      });
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const filteredList = list.filter(item => {
      if (item.isLive) return true;
      if (!item.dateObj) return true;

      const itemDate = new Date(item.dateObj.getFullYear(), item.dateObj.getMonth(), item.dateObj.getDate());
      const diffTime = itemDate.getTime() - todayStart.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      return diffDays === 0 || diffDays === 1;
    });

    if (filteredList.length === 0) {
      return list;
    }
    return filteredList;
  }, [apiMatches, groupStandings, bestThirds]);

  // Statistics computation
  const stats = useMemo(() => {
    const scorersMap = {};
    const cleanSheetsMap = {};
    const cardsMap = {}; // player -> { yellow, red, team }

    const teamGoalkeepers = {
      'Argentina': 'Emiliano Martínez',
      'Brasil': 'Alisson Becker',
      'Francia': 'Mike Maignan',
      'Inglaterra': 'Jordan Pickford',
      'Alemania': 'Marc-André ter Stegen',
      'España': 'Unai Simón',
      'Portugal': 'Diogo Costa',
      'Bélgica': 'Thibaut Courtois',
      'México': 'Luis Malagón',
      'Estados Unidos': 'Matt Turner',
      'Canadá': 'Maxime Crépeau',
      'Uruguay': 'Sergio Rochet',
      'Ecuador': 'Alexander Domínguez',
      'Colombia': 'Camilo Vargas',
      'Países Bajos': 'Bart Verbruggen',
      'Croacia': 'Dominik Livaković',
      'Noruega': 'Ørjan Nyland'
    };

    const getTeamPlayedGames = (teamName) => {
      let count = 0;
      if (apiMatches && apiMatches.length > 0) {
        apiMatches.forEach(match => {
          const homeTeam = resolveTeamName(match.home_team_name_en).name;
          const awayTeam = resolveTeamName(match.away_team_name_en).name;
          const isPlayed = match.finished === 'TRUE' || match.time_elapsed !== 'notstarted';
          if (isPlayed && (homeTeam === teamName || awayTeam === teamName)) {
            count++;
          }
        });
      }
      return count || 1;
    };

    if (apiMatches && apiMatches.length > 0) {
      apiMatches.forEach(match => {
        const homeRes = resolveTeamName(match.home_team_name_en);
        const awayRes = resolveTeamName(match.away_team_name_en);
        const homeTeam = homeRes.name;
        const awayTeam = awayRes.name;

        const isPlayed = match.finished === 'TRUE' || match.time_elapsed !== 'notstarted';

        if (isPlayed) {
          const s1 = match.home_score;
          const s2 = match.away_score;
          
          if (s2 === 0) {
            const gk = teamGoalkeepers[homeTeam] || `Arquero de ${homeTeam}`;
            cleanSheetsMap[gk] = (cleanSheetsMap[gk] || 0) + 1;
          }
          if (s1 === 0) {
            const gk = teamGoalkeepers[awayTeam] || `Arquero de ${awayTeam}`;
            cleanSheetsMap[gk] = (cleanSheetsMap[gk] || 0) + 1;
          }

          if (match.details && match.details.length > 0) {
            match.details.forEach(d => {
              const player = d.athlete;
              if (!player) return;

              const isHome = d.team_id === match.home_team_id || TEAM_ENG_TO_ESP[match.home_team_name_en] === TEAM_ENG_TO_ESP[d.team_id];
              const playerTeam = isHome ? homeTeam : awayTeam;

              if (d.scoringPlay) {
                scorersMap[player] = scorersMap[player] || { goals: 0, team: playerTeam };
                scorersMap[player].goals += 1;
              }

              if (d.redCard || d.type.toLowerCase().includes('red')) {
                cardsMap[player] = cardsMap[player] || { yellow: 0, red: 0, team: playerTeam };
                cardsMap[player].red += 1;
              } else if (d.yellowCard || d.type.toLowerCase().includes('yellow')) {
                cardsMap[player] = cardsMap[player] || { yellow: 0, red: 0, team: playerTeam };
                cardsMap[player].yellow += 1;
              }
            });
          }
        }
      });
    }

    const liveScorers = Object.keys(scorersMap).map(player => ({
      player,
      team: scorersMap[player].team,
      value: scorersMap[player].goals,
      games: getTeamPlayedGames(scorersMap[player].team)
    }));

    const liveCleanSheets = Object.keys(cleanSheetsMap).map(player => {
      const team = Object.keys(teamGoalkeepers).find(t => teamGoalkeepers[t] === player) || 'Selección';
      return {
        player,
        team,
        value: cleanSheetsMap[player],
        games: getTeamPlayedGames(team)
      };
    });

    const liveCards = Object.keys(cardsMap).map(player => ({
      player,
      team: cardsMap[player].team,
      yellow: cardsMap[player].yellow,
      red: cardsMap[player].red,
      games: getTeamPlayedGames(cardsMap[player].team)
    }));

    const getTop5Scorers = () => {
      return [...liveScorers].sort((a, b) => b.value - a.value).slice(0, 5);
    };

    const getTop5Assists = () => {
      return [];
    };

    const getTop5CleanSheets = () => {
      return [...liveCleanSheets].sort((a, b) => b.value - a.value).slice(0, 5);
    };

    const getTop5Cards = () => {
      return [...liveCards].sort((a, b) => (b.red * 3 + b.yellow) - (a.red * 3 + a.yellow)).slice(0, 5);
    };

    return {
      scorers: getTop5Scorers(),
      assists: getTop5Assists(),
      cleanSheets: getTop5CleanSheets(),
      cards: getTop5Cards()
    };
  }, [apiMatches, groupStandings]);

  // Fechas únicas para el calendario
  const uniqueDates = useMemo(() => {
    const dates = new Set();
    mergedMatches.forEach(m => dates.add(m.date));
    return Array.from(dates);
  }, [mergedMatches]);

  // Helper to construct today's date in local language format (e.g. "Viernes 12 de junio")
  const getTodayDateString = () => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const today = new Date();
    const dayName = days[today.getDay()];
    const dateNum = today.getDate();
    const monthName = months[today.getMonth()];
    
    return `${dayName} ${dateNum} de ${monthName}`;
  };

  const getInitialDate = () => {
    const todayStr = getTodayDateString();
    if (uniqueDates.includes(todayStr)) {
      return todayStr;
    }
    // Fallback to inaugural date if today's date is not in the calendar
    return uniqueDates[0] || 'Jueves 11 de junio';
  };

  const [visibleDates, setVisibleDates] = useState([getInitialDate()]);

  // Desplazar automáticamente el calendario horizontal móvil al día seleccionado
  useEffect(() => {
    if (activeTab === 'partidos') {
      const timer = setTimeout(() => {
        const selectedBtn = document.querySelector('.calendar-day-btn.selected');
        if (selectedBtn) {
          selectedBtn.scrollIntoView({
            behavior: 'auto',
            block: 'nearest',
            inline: 'center'
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, visibleDates]);

  const filteredMatches = useMemo(() => {
    let matches = mergedMatches;
    
    // Filtro de búsqueda
    if (searchTerm.trim()) {
      const searchNormalized = normalizeString(searchTerm);
      matches = matches.filter(match => {
        const team1Match = normalizeString(match.team1).includes(searchNormalized);
        const team2Match = normalizeString(match.team2).includes(searchNormalized);
        return team1Match || team2Match;
      });
      // Si hay búsqueda activa, mostramos todos los partidos que coincidan sin filtrar por visibleDates
      return matches;
    }
    
    // Filtro por días visibles si no hay búsqueda
    return matches.filter(match => visibleDates.includes(match.date));
  }, [searchTerm, visibleDates, mergedMatches]);

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return db.groups;
    
    const searchNormalized = normalizeString(searchTerm);
    return db.groups.filter(group => {
      return group.teams.some(team => normalizeString(team).includes(searchNormalized));
    });
  }, [searchTerm]);

  const finishedMatches = useMemo(() => {
    return mergedMatches.filter(match => match.score1 !== undefined && match.score1 !== null);
  }, [mergedMatches]);

  const loadMoreDates = () => {
    const lastVisibleIndex = uniqueDates.indexOf(visibleDates[visibleDates.length - 1]);
    if (lastVisibleIndex < uniqueDates.length - 1) {
      const nextDate = uniqueDates[lastVisibleIndex + 1];
      setVisibleDates([...visibleDates, nextDate]);
    }
  };

  const selectSpecificDate = (date) => {
    setVisibleDates([date]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Draggable ticker logic
  const tickerRef = useRef(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const scrollStartLeft = useRef(0);
  const autoScrollRef = useRef(null);
  const AUTO_SCROLL_SPEED = 0.6; // px per frame

  const startAutoScroll = useCallback(() => {
    if (autoScrollRef.current) return;
    autoScrollRef.current = requestAnimationFrame(function tick() {
      if (!isDragging.current && tickerRef.current) {
        tickerRef.current.scrollLeft += AUTO_SCROLL_SPEED;
        // Loop when reaching halfway (content is doubled)
        const half = tickerRef.current.scrollWidth / 2;
        if (tickerRef.current.scrollLeft >= half) {
          tickerRef.current.scrollLeft -= half;
        }
      }
      autoScrollRef.current = requestAnimationFrame(tick);
    });
  }, []);

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (autoScrollRef.current) cancelAnimationFrame(autoScrollRef.current);
    };
  }, [startAutoScroll]);

  const handlePointerDown = (e) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    scrollStartLeft.current = tickerRef.current.scrollLeft;
    tickerRef.current.setPointerCapture(e.pointerId);
    tickerRef.current.style.cursor = 'grabbing';
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStartX.current;
    tickerRef.current.scrollLeft = scrollStartLeft.current - dx;
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    if (tickerRef.current) tickerRef.current.style.cursor = 'grab';
  };

  return (
    <>
      <div className="ticker-wrap">
        <div
          className="ticker-drag"
          ref={tickerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div className="ticker-inner">
            {[...tickerGames, ...tickerGames].map((game, idx) => (
              <div className="ticker-item" key={idx}>
                <span style={{ fontSize: '0.7rem', color: game.isLive ? '#ef4444' : '#64748b', marginRight: '0.55rem', fontWeight: 'bold' }}>
                  {game.statusText}
                </span>
                {game.isLive && <span className="ticker-live-dot"></span>}
                <span>{game.homeFlag} {game.home}</span>
                {game.finished || game.isLive ? (
                  <span className="ticker-score-tag">{game.score}</span>
                ) : (
                  <strong> {game.score} </strong>
                )}
                <span>{game.away} {game.awayFlag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <header className="header">
        <h1>Mundial 2026</h1>
        <p>Guía de partidos y grupos</p>
        
        {timeLeft.finished ? (
          <div className="countdown-container finished">
            <span>¡El Mundial 2026 ha comenzado! 🏆</span>
          </div>
        ) : (
          <div className="countdown-container">
            <div className="countdown-title">El partido inaugural comienza en:</div>
            <div className="countdown-timer">
              <div className="countdown-segment">
                <span className="countdown-number">{timeLeft.days}</span>
                <span className="countdown-label">días</span>
              </div>
              <div className="countdown-divider">:</div>
              <div className="countdown-segment">
                <span className="countdown-number">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="countdown-label">horas</span>
              </div>
              <div className="countdown-divider">:</div>
              <div className="countdown-segment">
                <span className="countdown-number">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="countdown-label">min</span>
              </div>
              <div className="countdown-divider">:</div>
              <div className="countdown-segment">
                <span className="countdown-number">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="countdown-label">seg</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="tabs-container">
          <button className={`tab-btn ${activeTab === 'partidos' ? 'active' : ''}`} onClick={() => setActiveTab('partidos')}>Partidos</button>
          <button className={`tab-btn ${activeTab === 'grupos' ? 'active' : ''}`} onClick={() => setActiveTab('grupos')}>Grupos</button>
          <button className={`tab-btn ${activeTab === 'resultados' ? 'active' : ''}`} onClick={() => setActiveTab('resultados')}>Resultados</button>
          <button className={`tab-btn ${activeTab === 'fase-eliminatoria' ? 'active' : ''}`} onClick={() => setActiveTab('fase-eliminatoria')}>Fase Eliminatoria</button>
          <button className={`tab-btn ${activeTab === 'estadisticas' ? 'active' : ''}`} onClick={() => setActiveTab('estadisticas')}>Estadísticas</button>
          <button className={`tab-btn ${activeTab === 'noticias' ? 'active' : ''}`} onClick={() => setActiveTab('noticias')}>Noticias</button>
        </div>
      </header>

      {(activeTab === 'partidos' || activeTab === 'grupos') && (
        <div className="search-container">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Busca la selección que quieras..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      <main>
        {activeTab === 'grupos' && (
          <section>
            <h2 className="section-title">Grupos</h2>
            {filteredGroups.length > 0 ? (
              <div className="groups-grid">
                {filteredGroups.map(group => {
                  const standings = groupStandings[group.name] || [];
                  return (
                    <div key={group.name} className="group-card">
                      <div className="group-header">Grupo {group.name}</div>
                      <div className="standings-table-container">
                        <table className="standings-table">
                          <thead>
                            <tr>
                              <th className="pos-col">#</th>
                              <th>Selección</th>
                              <th className="num-col">PJ</th>
                              <th className="num-col">G</th>
                              <th className="num-col">E</th>
                              <th className="num-col">P</th>
                              <th className="num-col">GF</th>
                              <th className="num-col">GC</th>
                              <th className="num-col">DG</th>
                              <th className="pts-col">Pts</th>
                            </tr>
                          </thead>
                          <tbody>
                            {standings.map((teamStat, index) => {
                              let rowClass = '';
                              if (index < 2) rowClass = 'qualified-direct';
                              else if (index === 2) rowClass = 'qualified-thirds';
                              
                              return (
                                <tr key={teamStat.team} className={rowClass}>
                                  <td className="pos-col">{index + 1}</td>
                                  <td>
                                    <div className="team-col">
                                      <span>{getFlag(teamStat.team)}</span>
                                      <span title={teamStat.team} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                                        {teamStat.team}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="num-col">{teamStat.pj}</td>
                                  <td className="num-col">{teamStat.pg}</td>
                                  <td className="num-col">{teamStat.pe}</td>
                                  <td className="num-col">{teamStat.pp}</td>
                                  <td className="num-col">{teamStat.gf}</td>
                                  <td className="num-col">{teamStat.gc}</td>
                                  <td className="num-col">{teamStat.dg > 0 ? `+${teamStat.dg}` : teamStat.dg}</td>
                                  <td className="pts-col">{teamStat.pts}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">No se encontraron grupos con esa selección.</div>
            )}
          </section>
        )}

        {activeTab === 'partidos' && (
          <section className="partidos-section">
            {!searchTerm.trim() && (
              <aside className="sidebar-calendar">
                <h3>Filtro por días</h3>
                <ul className="calendar-days-list">
                  {uniqueDates.map(date => {
                    const isToday = date === getTodayDateString();
                    return (
                      <li key={date}>
                        <button 
                          className={`calendar-day-btn ${visibleDates.length === 1 && visibleDates[0] === date ? 'selected' : ''}`}
                          onClick={() => selectSpecificDate(date)}
                        >
                          {date}{isToday ? ' (Hoy)' : ''}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>
            )}

            <div className="matches-content">
              {filteredMatches.length > 0 ? (
                (() => {
                  const today = new Date();
                  const todayStr = getTodayDateString();

                  // Separate into groups
                  const liveMatches = filteredMatches.filter(m => m.isLive);
                  const finishedToday = filteredMatches.filter(m => {
                    const isFinished = m.score1 !== undefined && !m.isLive;
                    return isFinished && m.date === todayStr;
                  });
                  const upcomingMatches = filteredMatches.filter(m => {
                    const isFinished = m.score1 !== undefined && !m.isLive;
                    return !m.isLive && !isFinished;
                  });

                  // Featured match: live or first upcoming today
                  const featuredMatch = liveMatches.length > 0
                    ? liveMatches[0]
                    : upcomingMatches.find(m => m.date === todayStr) || upcomingMatches[0];

                  const renderCard = (match) => {
                    const matchKey = `${match.team1}_${match.team2}`;
                    return (
                      <MatchCard
                        key={matchKey}
                        match={match}
                        searchTerm={searchTerm}
                        isExpanded={!!expandedMatches[matchKey]}
                        onToggleExpand={() => toggleMatchExpanded(matchKey)}
                      />
                    );
                  };

                  // If search is active, just show flat list with count
                  if (searchTerm.trim()) {
                    return (
                      <>
                        <div className="matches-count-indicator">
                          Mostrando <strong>{filteredMatches.length}</strong> de <strong>{mergedMatches.length}</strong> partidos de la fase de grupos
                        </div>
                        <div className="calendar-list">
                          {filteredMatches.map(renderCard)}
                        </div>
                      </>
                    );
                  }

                  return (
                    <>
                      {/* Featured match (live or next) */}
                      {featuredMatch && (
                        <div className="featured-match-section">
                          <div className="section-divider-label">
                            <span className={featuredMatch.isLive ? 'divider-live' : 'divider-next'}>
                              {featuredMatch.isLive ? '🔴 EN VIVO' : '⏩ Próximo partido'}
                            </span>
                          </div>
                          <div className="featured-match-wrapper">
                            {renderCard(featuredMatch)}
                          </div>
                        </div>
                      )}

                      {/* Matches played today (excluding featured if it's live) */}
                      {finishedToday.length > 0 && (
                        <div className="matches-section">
                          <div className="section-divider-label">
                            <span className="divider-finished">📋 Partidos jugados hoy</span>
                          </div>
                          <div className="calendar-list">
                            {finishedToday.map(renderCard)}
                          </div>
                        </div>
                      )}

                      {/* Upcoming matches (excluding featured) */}
                      {upcomingMatches.filter(m => m !== featuredMatch).length > 0 && (
                        <div className="matches-section">
                          <div className="section-divider-label">
                            <span className="divider-upcoming">🗓️ Próximos partidos</span>
                          </div>
                          <div className="calendar-list">
                            {upcomingMatches.filter(m => m !== featuredMatch).map(renderCard)}
                          </div>
                        </div>
                      )}

                      {!searchTerm.trim() && visibleDates[visibleDates.length - 1] !== uniqueDates[uniqueDates.length - 1] && (
                        <div className="load-more-container">
                          <button className="load-more-btn" onClick={loadMoreDates}>
                            Cargar siguientes partidos
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()
              ) : (
                <div className="empty-state">
                  No se encontraron partidos para la selección ingresada.
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'resultados' && (
          <section className="resultados-section">
            <h2 className="section-title">Resultados</h2>
            {finishedMatches.length > 0 ? (
              <div className="calendar-list">
                {finishedMatches.map((match) => {
                  const matchKey = `${match.team1}_${match.team2}`;
                  return (
                    <MatchCard
                      key={matchKey}
                      match={match}
                      searchTerm={searchTerm}
                      isExpanded={!!expandedMatches[matchKey]}
                      onToggleExpand={() => toggleMatchExpanded(matchKey)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <h3>El torneo aún no comienza</h3>
                <p>Aquí se mostrarán los marcadores en tiempo real a medida que terminen los partidos.</p>
                <div className="upcoming-hint" style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--card-border)', display: 'inline-block', maxWidth: '400px', width: '100%' }}>
                  <strong style={{ color: 'var(--primary)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>Próximo partido inaugural</strong>
                  <div style={{ marginTop: '0.75rem', fontSize: '1.2rem', fontWeight: '600' }}>
                    🇲🇽 México vs. Sudáfrica 🇿🇦
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    jueves 11 de junio, 15:00 hrs
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'fase-eliminatoria' && (
          <section className="bracket-section">
            <h2 className="section-title">Fase Eliminatoria</h2>
            <div className="bracket-scroll-hint">
              ← Desliza horizontalmente para ver las llaves →
            </div>
            
            <div className="bracket-wrapper">
              <div className="bracket-container">
                {/* 1. Round of 32 Left */}
                <div className="bracket-column">
                  <div className="bracket-column-title">Dieciseisavos (Izq)</div>
                  <div className="bracket-column-matches">
                    <BracketMatch match={apiMatches[72]} matchNumber={1} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[74]} matchNumber={3} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[73]} matchNumber={2} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[76]} matchNumber={5} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[82]} matchNumber={11} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[83]} matchNumber={12} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[80]} matchNumber={9} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[81]} matchNumber={10} resolveTeamName={resolveTeamName} />
                  </div>
                </div>

                {/* 2. Round of 16 Left */}
                <div className="bracket-column">
                  <div className="bracket-column-title">Octavos (Izq)</div>
                  <div className="bracket-column-matches">
                    <BracketMatch match={apiMatches[88]} matchNumber={17} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[89]} matchNumber={18} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[92]} matchNumber={21} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[93]} matchNumber={22} resolveTeamName={resolveTeamName} />
                  </div>
                </div>

                {/* 3. Quarterfinals Left */}
                <div className="bracket-column">
                  <div className="bracket-column-title">Cuartos (Izq)</div>
                  <div className="bracket-column-matches">
                    <BracketMatch match={apiMatches[96]} matchNumber={25} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[97]} matchNumber={26} resolveTeamName={resolveTeamName} />
                  </div>
                </div>

                {/* 4. Semifinals Left */}
                <div className="bracket-column">
                  <div className="bracket-column-title">Semifinal (Izq)</div>
                  <div className="bracket-column-matches">
                    <BracketMatch match={apiMatches[100]} matchNumber={29} resolveTeamName={resolveTeamName} />
                  </div>
                </div>

                {/* 5. Center Column: Trophy, Champion & Final */}
                <div className="bracket-center-column">
                  <div className="trophy-container">
                    <div className="trophy-glow"></div>
                    <img src="/world_cup_trophy.png" alt="Copa del Mundo" className="trophy-image" />
                  </div>

                  {/* Champion Banner */}
                  <div className="champion-card">
                    <div className="champion-title">Campeón del Mundo</div>
                    {apiMatches[103] && apiMatches[103].finished === 'TRUE' ? (
                      (() => {
                        const winnerEn = apiMatches[103].home_score > apiMatches[103].away_score 
                          ? apiMatches[103].home_team_name_en 
                          : apiMatches[103].away_team_name_en;
                        const winner = resolveTeamName(winnerEn);
                        return (
                          <div className="champion-team">
                            {winner.flag} {winner.name} 🏆
                          </div>
                        );
                      })()
                    ) : (
                      <div className="champion-team" style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: '500' }}>
                        Por definir 🏆
                      </div>
                    )}
                  </div>

                  {/* Grand Final Box */}
                  <div>
                    <div className="bracket-column-title" style={{ border: 'none', marginBottom: '0.25rem' }}>Gran Final</div>
                    <div className="bracket-match-card final-match-box">
                      <BracketMatch match={apiMatches[103]} matchNumber={32} resolveTeamName={resolveTeamName} />
                    </div>
                  </div>

                  {/* Third Place Box */}
                  <div>
                    <div className="bracket-column-title" style={{ border: 'none', marginBottom: '0.25rem', color: '#94a3b8' }}>Tercer Lugar</div>
                    <div className="bracket-match-card third-place-box">
                      <BracketMatch match={apiMatches[102]} matchNumber={31} resolveTeamName={resolveTeamName} />
                    </div>
                  </div>
                </div>

                {/* 6. Semifinals Right */}
                <div className="bracket-column">
                  <div className="bracket-column-title">Semifinal (Der)</div>
                  <div className="bracket-column-matches">
                    <BracketMatch match={apiMatches[101]} matchNumber={30} resolveTeamName={resolveTeamName} />
                  </div>
                </div>

                {/* 7. Quarterfinals Right */}
                <div className="bracket-column">
                  <div className="bracket-column-title">Cuartos (Der)</div>
                  <div className="bracket-column-matches">
                    <BracketMatch match={apiMatches[98]} matchNumber={27} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[99]} matchNumber={28} resolveTeamName={resolveTeamName} />
                  </div>
                </div>

                {/* 8. Round of 16 Right */}
                <div className="bracket-column">
                  <div className="bracket-column-title">Octavos (Der)</div>
                  <div className="bracket-column-matches">
                    <BracketMatch match={apiMatches[90]} matchNumber={19} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[91]} matchNumber={20} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[95]} matchNumber={24} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[94]} matchNumber={23} resolveTeamName={resolveTeamName} />
                  </div>
                </div>

                {/* 9. Round of 32 Right */}
                <div className="bracket-column">
                  <div className="bracket-column-title">Dieciseisavos (Der)</div>
                  <div className="bracket-column-matches">
                    <BracketMatch match={apiMatches[75]} matchNumber={4} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[77]} matchNumber={6} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[78]} matchNumber={7} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[79]} matchNumber={8} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[84]} matchNumber={13} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[86]} matchNumber={15} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[85]} matchNumber={14} resolveTeamName={resolveTeamName} />
                    <BracketMatch match={apiMatches[87]} matchNumber={16} resolveTeamName={resolveTeamName} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'estadisticas' && (
          <section className="stats-section">
            <h2 className="section-title">Estadísticas</h2>
            <div className="stats-grid">
              {/* 1. Goleadores */}
              <div className="stats-card">
                <h3 className="stats-card-title">⚽ Goleadores</h3>
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Jugador</th>
                      <th className="stats-num-col">Goles</th>
                      <th className="stats-meta-col">PJ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.scorers.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="stats-empty">Sin registros aún</td>
                      </tr>
                    ) : (
                      stats.scorers.map((p, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="player-col">
                              <span className="player-name">{p.player}</span>
                              <span className="player-team">{getFlag(p.team)} {p.team}</span>
                            </div>
                          </td>
                          <td className="stats-num-col">{p.value}</td>
                          <td className="stats-meta-col">{p.games}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
 
              {/* 2. Asistidores */}
              <div className="stats-card">
                <h3 className="stats-card-title">👟 Asistidores</h3>
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Jugador</th>
                      <th className="stats-num-col">Asist.</th>
                      <th className="stats-meta-col">PJ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.assists.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="stats-empty">Sin registros aún</td>
                      </tr>
                    ) : (
                      stats.assists.map((p, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="player-col">
                              <span className="player-name">{p.player}</span>
                              <span className="player-team">{getFlag(p.team)} {p.team}</span>
                            </div>
                          </td>
                          <td className="stats-num-col">{p.value}</td>
                          <td className="stats-meta-col">{p.games}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
 
              {/* 3. Vallas Invictas */}
              <div className="stats-card">
                <h3 className="stats-card-title">🧤 Vallas Invictas</h3>
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Arquero</th>
                      <th className="stats-num-col">Vallas</th>
                      <th className="stats-meta-col">PJ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.cleanSheets.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="stats-empty">Sin registros aún</td>
                      </tr>
                    ) : (
                      stats.cleanSheets.map((p, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="player-col">
                              <span className="player-name">{p.player}</span>
                              <span className="player-team">{getFlag(p.team)} {p.team}</span>
                            </div>
                          </td>
                          <td className="stats-num-col">{p.value}</td>
                          <td className="stats-meta-col">{p.games}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
 
              {/* 4. Disciplina */}
              <div className="stats-card">
                <h3 className="stats-card-title">🟨 Disciplina</h3>
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Jugador</th>
                      <th className="stats-num-col">Amarillas</th>
                      <th className="stats-num-col">Rojas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.cards.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="stats-empty">Sin registros aún</td>
                      </tr>
                    ) : (
                      stats.cards.map((p, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="player-col">
                              <span className="player-name">{p.player}</span>
                              <span className="player-team">{getFlag(p.team)} {p.team}</span>
                            </div>
                          </td>
                          <td className="stats-num-col" style={{ color: '#eab308' }}>{p.yellow}</td>
                          <td className="stats-num-col" style={{ color: '#ef4444' }}>{p.red}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'noticias' && (
          <section className="news-section">
            <h2 className="section-title">Noticias</h2>
            {loadingNews ? (
              <div className="empty-state">
                <span className="live-dot"></span> Cargando las últimas noticias...
              </div>
            ) : newsError && news.length === 0 ? (
              <div className="news-grid">
                {fallbackNews.map(n => (
                  <div key={n.id} className="news-card">
                    <div className="news-image-wrapper">
                      <img src={n.image} alt={n.headline} className="news-image" />
                    </div>
                    <div className="news-content">
                      <div className="news-date">{new Date(n.published).toLocaleDateString('es-CL')}</div>
                      <h3 className="news-headline">{n.headline}</h3>
                      <p className="news-description">{n.description}</p>
                      <a href={n.url} target="_blank" rel="noopener noreferrer" className="news-link">Leer más ➔</a>
                    </div>
                  </div>
                ))}
              </div>
            ) : news.length > 0 ? (
              <div className="news-grid">
                {news.map(n => (
                  <div key={n.id} className="news-card">
                    <div className="news-image-wrapper">
                      <img src={n.image || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=60'} alt={n.headline} className="news-image" />
                    </div>
                    <div className="news-content">
                      <div className="news-date">{new Date(n.published).toLocaleDateString('es-CL')}</div>
                      <h3 className="news-headline">{n.headline}</h3>
                      <p className="news-description">{n.description}</p>
                      <a href={n.url} target="_blank" rel="noopener noreferrer" className="news-link">Leer más ➔</a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No hay noticias disponibles en este momento.</div>
            )}
          </section>
        )}
      </main>
    </>
  );
}

export default App;
