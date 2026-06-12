import https from 'https';

export async function handler(event, context) {
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

            return {
              home_team_name_en: home.team?.name || home.team?.displayName || '',
              away_team_name_en: away.team?.name || away.team?.displayName || '',
              home_score: parseInt(home.score, 10) || 0,
              away_score: parseInt(away.score, 10) || 0,
              finished: finished,
              time_elapsed: time_elapsed
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
}
