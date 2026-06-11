import { useState, useMemo, useEffect } from 'react';
import db from './data/db.json';
import { normalizeString, getFlag } from './utils';

function App() {
  const [activeTab, setActiveTab] = useState('partidos');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Fechas únicas para el calendario
  const uniqueDates = useMemo(() => {
    const dates = new Set();
    db.matches.forEach(m => dates.add(m.date));
    return Array.from(dates);
  }, []);

  const [visibleDates, setVisibleDates] = useState([uniqueDates[0]]); // Jueves 11 de junio por defecto

  const filteredMatches = useMemo(() => {
    let matches = db.matches;
    
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
    return db.matches.filter(match => match.score1 !== undefined && match.score1 !== null);
  }, []);

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
            placeholder="Busca a tu selección (ej. Chile, Brasil)..." 
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
                    Mostrando <strong>{filteredMatches.length}</strong> de <strong>{db.matches.length}</strong> partidos de la fase de grupos
                  </div>
                  <div className="calendar-list">
                    {filteredMatches.map((match, idx) => (
                      <div key={idx} className="match-card">
                        <div className="match-datetime">
                          <div className="match-date">{match.date}</div>
                          <div className="match-time">{match.time} hrs</div>
                        </div>
                        
                        <div className="match-teams">
                          <span className={`team-name ${normalizeString(match.team1).includes(normalizeString(searchTerm)) && searchTerm ? 'highlight' : ''}`}>
                            {getFlag(match.team1)} {match.team1}
                          </span>
                          <span className="vs">vs</span>
                          <span className={`team-name ${normalizeString(match.team2).includes(normalizeString(searchTerm)) && searchTerm ? 'highlight' : ''}`}>
                            {getFlag(match.team2)} {match.team2}
                          </span>
                        </div>
                        
                        <div className="match-info">
                          <div className="match-group">Grupo {match.group}</div>
                          <div className="match-location">{match.location}</div>
                          {match.channels.length > 0 && (
                            <div className="match-channels">
                              {match.channels.map(ch => (
                                <span key={ch} className="channel-tag">{ch}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
                {finishedMatches.map((match, idx) => (
                  <div key={idx} className="match-card result-card">
                    <div className="match-datetime">
                      <div className="match-date">{match.date}</div>
                      <div className="match-time">{match.time} hrs</div>
                    </div>
                    
                    <div className="match-teams result-teams">
                      <span className="team-name text-right">
                        {getFlag(match.team1)} {match.team1}
                      </span>
                      <span className="result-score">
                        {match.score1} - {match.score2}
                      </span>
                      <span className="team-name text-left">
                        {getFlag(match.team2)} {match.team2}
                      </span>
                    </div>
                    
                    <div className="match-info">
                      <div className="match-group">Grupo {match.group}</div>
                      <div className="match-location">{match.location}</div>
                    </div>
                  </div>
                ))}
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
