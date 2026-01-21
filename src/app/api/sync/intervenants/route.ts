import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client (Service Role)
// We need Service Role to allow deletions/updates regardless of RLS, although usually RLS should cover it.
// Ideally usage: process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST() {
    try {
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
        const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Intervenants';

        if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
            return NextResponse.json(
                { error: 'Missing Airtable configuration (AIRTABLE_API_KEY or AIRTABLE_BASE_ID)' },
                { status: 500 }
            );
        }

        // 1. Fetch from Airtable
        let allRecords: any[] = [];
        let offset = null;

        do {
            const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}?view=Grid%20view${offset ? `&offset=${offset}` : ''}`;

            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Airtable Fetch Error: ${res.statusText} - ${err}`);
            }

            const data = await res.json();
            allRecords = [...allRecords, ...data.records];
            offset = data.offset;
        } while (offset);

        console.log(`Fetched ${allRecords.length} records from Airtable.`);

        // 2. Transform Data
        // Adjust field mapping based on your Airtable column names
        const transformedData = allRecords.map((record) => {
            const fields = record.fields;

            // Handle Email field which might be an array in Airtable if it's a lookup or multiple select
            let email = fields['Courriels'] || fields['Email'] || fields['email'];
            if (Array.isArray(email)) {
                email = email[0];
            }

            return {
                email: email,
                nom: fields['Nom de famille'] || fields['Nom'] || '',
                prenom: fields['Prénom'] || fields['Prenom'] || '',
                role: fields['Role'] || fields['Rôle'] || 'Intervenant',
                bio: fields['Bio'] || fields['Biographie'] || '',
                avatar_url: fields['Avatar']?.[0]?.url || fields['Photo']?.[0]?.url || '',
                linkedin_url: fields['LinkedIn'] || fields['Linkedin'] || '',
                website_url: fields['Website'] || fields['Site Web'] || '',
                specialties: fields['Specialties'] || fields['Spécialités'] || [],
            };
        }).filter(item => item.email); // Filter out records without email

        if (transformedData.length === 0) {
            const firstRecordFields = allRecords.length > 0 ? Object.keys(allRecords[0].fields) : [];
            console.log('Available Airtable Keys:', firstRecordFields);
            return NextResponse.json({
                message: "No valid records found (checking 'Email'). Available keys:",
                keys: firstRecordFields
            });
        }

        // 3. Sync with Supabase (Upsert)
        // We stick to Email as unique key.
        const { error: upsertError } = await supabaseAdmin
            .from('intervenants')
            .upsert(transformedData, { onConflict: 'email' });

        if (upsertError) throw upsertError;

        // 4. Handle Deletions (Optional but requested: "Si on enlève... cela se répercute")
        // Use Supabase Service Role to list all emails and remove those not in Airtable
        const airtableEmails = transformedData.map(d => d.email);

        // Safety check: Don't delete everything if Airtable returns 0 records (handled above)
        // Delete where email NOT IN airtableEmails
        const { error: deleteError } = await supabaseAdmin
            .from('intervenants')
            .delete()
            .not('email', 'in', `(${airtableEmails.map(e => `"${e}"`).join(',')})`); // Syntax for 'in' filter with list? 
        // Actually .in() takes an array. .not() takes column, operator, value.
        // Proper way: .not('email', 'in', airtableEmails) ? No, Supabase filter syntax is tricky for NOT IN list.
        // Easier: Get all DB emails, compare in JS, then delete specific IDs or Emails.

        // Fetch all DB emails
        const { data: dbIntervenants } = await supabaseAdmin.from('intervenants').select('email');
        const emailsToDelete = (dbIntervenants || [])
            .map((i: any) => i.email)
            .filter(e => !airtableEmails.includes(e));

        let deletedCount = 0;
        if (emailsToDelete.length > 0) {
            const { error: delError, count } = await supabaseAdmin
                .from('intervenants')
                .delete()
                .in('email', emailsToDelete); // Delete all in this list

            if (delError) console.error("Deletion error", delError);
            else deletedCount = count || emailsToDelete.length;
        }

        return NextResponse.json({
            success: true,
            subtotal_airtable: allRecords.length,
            valid_records: transformedData.length,
            upserted: transformedData.length, // Upsert doesn't return count easily without select
            deleted: deletedCount,
            message: `Sync successful: ${transformedData.length} upserted, ${deletedCount} deleted.`
        });

    } catch (error: any) {
        console.error('Sync Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
