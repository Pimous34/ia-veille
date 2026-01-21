@echo off
set "URL=https://pjiobifgcvdapikurlbn.supabase.co/storage/v1/object/ressources-intervenants/test_upload.txt"
set "KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqaW9iaWZnY3ZkYXBpa3VybGJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTEwMjQ4MSwiZXhwIjoyMDgwNjc4NDgxfQ.TDVP4swScKmcyyrn9e3iXMRjEEiwQsSooGqpX70imEA"

curl -X POST "%URL%" ^
  -H "Authorization: Bearer %KEY%" ^
  -H "Content-Type: text/plain" ^
  --data-binary "@test_upload.txt" --verbose
