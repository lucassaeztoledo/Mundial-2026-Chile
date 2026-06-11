const https = require('https');

exports.handler = async function (event, context) {
  return new Promise((resolve, reject) => {
    https.get('https://worldcup26.ir/get/games', (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          resolve({
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(parsedData),
          });
        } catch (e) {
          resolve({
            statusCode: 500,
            body: JSON.stringify({ error: `Failed to parse JSON: ${e.message}` }),
          });
        }
      });
    }).on('error', (e) => {
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: `HTTPS Request error: ${e.message}` }),
      });
    });
  });
};
