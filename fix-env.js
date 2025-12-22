const fs = require('fs');
const path = require('path');

// [TEMPLATE] Fill these with your actual keys (DO NOT COMMIT THIS FILE)
const content = `GOOGLE_GENAI_API_KEY=YOUR_NEW_KEY_HERE
NEXT_PUBLIC_SUPABASE_URL=https://pjiobifgcvdapikurlbn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
# D-ID API Configuration
D_ID_API_KEY=YOUR_DID_API_KEY
JT_PRESENTER_IMAGE_URL=https://pjiobifgcvdapikurlbn.supabase.co/storage/v1/object/public/jt-assets/presenter/gretta-jt.jpg
JT_JINGLE_VIDEO_PATH=/video/Jingle.mp4
`;

fs.writeFileSync(path.join(__dirname, '.env.local'), content, 'utf8');
console.log('.env.local template created. Please edit it with your real keys.');
