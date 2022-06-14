const fs = require('fs');
const axios = require('axios');
const xml2js = require('xml2js');

function log(message) {
  console.log(message);
}

const parser = new xml2js.Parser({
  trim: true,
  explicitArray: false,
});

// Scrapes studentencodex.org to get all codex songs and info
const loadSongs = async (datetime) => {
  const object = {};
  const jsonUrl = 'https://studentencodex.org/getsongs';
  fs.writeFileSync('data/codex.json', '[');

  await axios.get(jsonUrl)
    .then(async (jsonResponse) => {
      // handle success
      const jsonSongs = jsonResponse.data.value;

      jsonSongs.forEach((song) => {
        object[song.Id] = `https://studentencodex.org/lied/${song.FriendlyUrl}`;
      });

      const datetimestring = datetime.toISOString().replace(/\..+/, '').replace(/[-T:]/g, '.');
      const xmlUrl = `https://studentencodex.org/codex/xml/codexsongsupdate/${datetimestring}`;

      await axios.get(xmlUrl)
        .then((xmlResponse) => {
          parser.parseStringPromise(xmlResponse.data)
            .then((result) => {
              const xmlSongs = result.songs.song;

              xmlSongs.forEach((song) => {

                  let song_object = {
                    title: song.title,
                    text: song.text,
                    extraInfo: song.extraInfo,
                    year: song.year,
                    page: {
                      "kvhv-2017": song.page,
                    },
                    musicalScore: song.musicalScore,
                    writers: song.writers,
                  }

                  if (song.page != null) fs.appendFileSync('data/codex.json', JSON.stringify(song_object) + ',\n') 
              });
            })
            .catch((_error) => {
              log(`XML parser failed: ${_error}`);
            });
        })
        .catch((error) => {
          log('error in xml request');
          log(error);
        });
        fs.appendFileSync('data/codex.json', ']');

    })
    .catch((error) => {
      log('error in json request');
      log(error);
    });
};

loadSongs(new Date(3600000));
