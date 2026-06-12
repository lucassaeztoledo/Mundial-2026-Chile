const https = require('https');

exports.handler = async function (event, context) {
  return new Promise((resolve) => {
    const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=150';

    https.get(url, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          const events = parsedData.events || [];
          
          const games = events.map(e => {
            const comp = e.competitions?.[0];
            if (!comp) return null;
            
            const home = comp.competitors?.find(c => c.homeAway === 'home');
            const away = comp.competitors?.find(c => c.homeAway === 'away');
            if (!home || !away) return null;

            const isCompleted = e.status?.type?.completed || false;
            const state = e.status?.type?.state;

            let finished = 'FALSE';
            let time_elapsed = 'notstarted';

            if (state === 'pre') {
              finished = 'FALSE';
              time_elapsed = 'notstarted';
            } else if (state === 'post' || isCompleted) {
              finished = 'TRUE';
              time_elapsed = e.status?.type?.shortDetail || 'FT';
            } else if (state === 'in') {
              finished = 'FALSE';
              time_elapsed = e.status?.displayClock || 'Live';
            }

            const getStat = (competitor, name) => {
              return competitor.statistics?.find(s => s.name === name)?.displayValue || '';
            };

            const homeStats = {
              possession: getStat(home, 'possessionPct'),
              shotsOnTarget: getStat(home, 'shotsOnTarget'),
              totalShots: getStat(home, 'totalShots'),
              fouls: getStat(home, 'foulsCommitted'),
              corners: getStat(home, 'wonCorners')
            };

            const awayStats = {
              possession: getStat(away, 'possessionPct'),
              shotsOnTarget: getStat(away, 'shotsOnTarget'),
              totalShots: getStat(away, 'totalShots'),
              fouls: getStat(away, 'foulsCommitted'),
              corners: getStat(away, 'wonCorners')
            };

            const details = comp.details?.map(d => {
              return {
                type: d.type?.text || '',
                clock: d.clock?.displayValue || '',
                team_id: d.team?.id || '',
                athlete: d.athletesInvolved?.[0]?.displayName || '',
                scoringPlay: d.scoringPlay || false,
                redCard: d.redCard || false,
                yellowCard: d.yellowCard || false
              };
            }) || [];

            return {
              date: e.date || '',
              home_team_name_en: home.team?.name || home.team?.displayName || '',
              away_team_name_en: away.team?.name || away.team?.displayName || '',
              home_score: parseInt(home.score, 10) || 0,
              away_score: parseInt(away.score, 10) || 0,
              finished: finished,
              time_elapsed: time_elapsed,
              venue: comp.venue?.fullName || '',
              home_team_id: home.team?.id || '',
              away_team_id: away.team?.id || '',
              details: details,
              home_stats: homeStats,
              away_stats: awayStats
            };
          }).filter(Boolean);

          resolve({
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(games),
          });
        } catch (error) {
          resolve({
            statusCode: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ error: `Failed to parse JSON: ${error.message}` }),
          });
        }
      });
    }).on('error', (error) => {
      resolve({
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: `HTTPS Request error: ${error.message}` }),
      });
    });
  });
};
