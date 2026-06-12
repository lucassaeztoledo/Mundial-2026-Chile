import { useState, useMemo, useEffect } from 'react';
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

  return (
    <div className={`match-card ${match.score1 !== undefined ? 'result-card' : ''}`}>
      <div className="match-datetime">
        <div className="match-date">{match.date}</div>
        <div className="match-time-container">
          <span className="match-time">{match.time} hrs</span>
          {match.isLive && (
            <span className="live-badge">
              <span className="live-dot"></span> EN VIVO {match.timeElapsed}
            </span>
          )}
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
                {g.athlete} ({g.clock})
              </div>
            ))}
          </div>
          <div className="scorer-icon-divider">⚽</div>
          <div className="away-scorers">
            {awayGoals.map((g, i) => (
              <div key={i} className="scorer">
                ({g.clock}) {g.athlete}
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
                      <strong>{d.athlete}</strong> ({d.team_id === match.homeTeamId || TEAM_ENG_TO_ESP[match.home_team_name_en] === TEAM_ENG_TO_ESP[d.team_id] ? match.team1 : match.team2}) - {d.type}
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

function App() {
  const [activeTab, setActiveTab] = useState('partidos');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMatches, setExpandedMatches] = useState({});

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
    // Intentar cargar marcadores automáticos desde la Netlify Function
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
  }, []);

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

      if (apiMatch && apiMatch.time_elapsed !== 'notstarted') {
        return {
          ...match,
          score1: apiMatch.home_score,
          score2: apiMatch.away_score,
          isLive: apiMatch.finished === 'FALSE',
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

  // Fechas únicas para el calendario
  const uniqueDates = useMemo(() => {
    const dates = new Set();
    db.matches.forEach(m => dates.add(m.date));
    return Array.from(dates);
  }, []);

  const [visibleDates, setVisibleDates] = useState([uniqueDates[0]]); // Jueves 11 de junio por defecto

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
  }, [searchTerm, visibleDates]);

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

  return (
    <>
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
          <button className={`tab-btn ${activeTab === 'partidos' ? 'active' : ''}`} onClick={() => setActiveTab('partidos')}>partidos</button>
          <button className={`tab-btn ${activeTab === 'grupos' ? 'active' : ''}`} onClick={() => setActiveTab('grupos')}>grupos</button>
          <button className={`tab-btn ${activeTab === 'resultados' ? 'active' : ''}`} onClick={() => setActiveTab('resultados')}>resultados</button>
          <button className={`tab-btn ${activeTab === 'fase-eliminatoria' ? 'active' : ''}`} onClick={() => setActiveTab('fase-eliminatoria')}>fase eliminatoria</button>
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
                              <th className="num-col hide-mobile">G</th>
                              <th className="num-col hide-mobile">E</th>
                              <th className="num-col hide-mobile">P</th>
                              <th className="num-col hide-mobile">GF</th>
                              <th className="num-col hide-mobile">GC</th>
                              <th className="num-col hide-mobile">DG</th>
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
                                  <td className="num-col hide-mobile">{teamStat.pg}</td>
                                  <td className="num-col hide-mobile">{teamStat.pe}</td>
                                  <td className="num-col hide-mobile">{teamStat.pp}</td>
                                  <td className="num-col hide-mobile">{teamStat.gf}</td>
                                  <td className="num-col hide-mobile">{teamStat.gc}</td>
                                  <td className="num-col hide-mobile">{teamStat.dg > 0 ? `+${teamStat.dg}` : teamStat.dg}</td>
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
                  {uniqueDates.map(date => (
                    <li key={date}>
                      <button 
                        className={`calendar-day-btn ${visibleDates.length === 1 && visibleDates[0] === date ? 'selected' : ''}`}
                        onClick={() => selectSpecificDate(date)}
                      >
                        {date}
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>
            )}

            <div className="matches-content">
              {filteredMatches.length > 0 ? (
                <>
                  <div className="matches-count-indicator">
                    Mostrando <strong>{filteredMatches.length}</strong> de <strong>{mergedMatches.length}</strong> partidos de la fase de grupos
                  </div>
                  <div className="calendar-list">
                    {filteredMatches.map((match) => {
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

                  {!searchTerm.trim() && visibleDates[visibleDates.length - 1] !== uniqueDates[uniqueDates.length - 1] && (
                    <div className="load-more-container">
                      <button className="load-more-btn" onClick={loadMoreDates}>
                        Cargar siguientes partidos
                      </button>
                    </div>
                  )}
                </>
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
            <h2 className="section-title">resultados de los partidos</h2>
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
      </main>
    </>
  );
}

export default App;
