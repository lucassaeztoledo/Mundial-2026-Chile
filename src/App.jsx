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
                {filteredGroups.map(group => (
                  <div key={group.name} className="group-card">
                    <div className="group-header">Grupo {group.name}</div>
                    <ul className="team-list">
                      {group.teams.map(team => (
                        <li key={team} className="team-item">
                          {getFlag(team)} {team}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
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
      </main>
    </>
  );
}

export default App;
