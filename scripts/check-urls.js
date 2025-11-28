
import https from 'https';

const urls = [
  'https://jrlecaepyoivtplpvwoe.supabase.co/storage/v1/object/public/jt-assets/assets/jingle.mp4',
  'https://jrlecaepyoivtplpvwoe.supabase.co/storage/v1/object/public/jt-assets/videos/jt_2025-11-28_tlk_121zLFt55fVtrxcfsnZX4.mp4'
];

urls.forEach(url => {
  const req = https.request(url, { method: 'HEAD' }, (res) => {
    console.log(`URL: ${url}`);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Content-Type: ${res.headers['content-type']}`);
    console.log('---');
  });
  req.on('error', (e) => {
    console.error(`Error fetching ${url}: ${e.message}`);
  });
  req.end();
});
