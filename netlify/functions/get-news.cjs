const https = require('https');

exports.handler = async function (event, context) {
  return new Promise((resolve) => {
    const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/news';

    https.get(url, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          const articles = parsedData.articles || [];
          
          const news = articles.map(a => {
            return {
              id: a.id,
              headline: a.headline || '',
              description: a.description || '',
              published: a.published || '',
              url: a.links?.web?.href || '',
              image: a.images?.[0]?.url || ''
            };
          });

          resolve({
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=600'
            },
            body: JSON.stringify(news),
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
