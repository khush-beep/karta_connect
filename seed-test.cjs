const ws = require("ws");
globalThis.WebSocket = ws;

const { createClient } = require("@supabase/supabase-js");

const url = "https://gycraqkmftxvalzvxvyj.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5Y3JhcWttZnR4dmFsenZ4dnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTc0MTYsImV4cCI6MjA5NTUzMzQxNn0.HbTHLyy4kiLtwWaz_BULptOBaV9xBJfe3atgYoFeI0I";
const supabase = createClient(url, key);

async function seed() {
  const { data: wlData, error: wlError } = await supabase.from('student_whitelist').insert([
    { email: 'student@karta.com' }
  ]).select();
  console.log('student_whitelist insertion:', wlError ? wlError.message : wlData);

  const { data: compData, error: compError } = await supabase.from('companies').insert([
    { name: 'Google', contact_email: 'company@karta.com', industry: 'Technology', website: 'https://google.com' }
  ]).select();
  console.log('companies insertion:', compError ? compError.message : compData);
}

seed();
