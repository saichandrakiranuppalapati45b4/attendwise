import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(url, key);

async function test() {
    console.log("Testing insert with dummy past_conducted...");
    const { data, error } = await supabase.from('subjects').insert({
        subject_name: 'test',
        past_conducted: 0,
        past_attended: 0
    });
    console.log("Error object:");
    console.log(JSON.stringify(error, null, 2));
}
test();
