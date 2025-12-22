const fs = require('fs');
const path = require('path');

const content = `GOOGLE_GENAI_API_KEY=AIzaSyA0Jo-KYUrwA5fU0A3hPO3jJ70JmLehkIU
NEXT_PUBLIC_SUPABASE_URL=https://pjiobifgcvdapikurlbn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqaW9iaWZnY3ZkYXBpa3VybGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDI0ODEsImV4cCI6MjA4MDY3ODQ4MX0.-y5bw3WwHKGpR9FxNcZhyEWY-iLoAXnI4ZGlhH8DXYo
# D-ID API Configuration
D_ID_API_KEY=YmVuamFtaW4ucmlnb3VzdGVAZ21haWwuY29t:2EzsU0X9S7PWyOuI9dPBx
JT_PRESENTER_IMAGE_URL=https://pjiobifgcvdapikurlbn.supabase.co/storage/v1/object/public/jt-assets/presenter/gretta-jt.jpg
JT_JINGLE_VIDEO_PATH=/video/Jingle.mp4
`;

fs.writeFileSync(path.join(__dirname, '.env.local'), content, 'utf8');
console.log('.env.local rewritten successfully');
