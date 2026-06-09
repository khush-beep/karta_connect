const ws = require("ws");
globalThis.WebSocket = ws;

const { createClient } = require("@supabase/supabase-js");

const url = "https://gycraqkmftxvalzvxvyj.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5Y3JhcWttZnR4dmFsenZ4dnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTc0MTYsImV4cCI6MjA5NTUzMzQxNn0.HbTHLyy4kiLtwWaz_BULptOBaV9xBJfe3atgYoFeI0I";
const supabase = createClient(url, key);

async function check() {
  // Check if we can select whitelist record for mehek55@gmail.com anonymously
  const { data: wlData, error: wlError } = await supabase.from('student_whitelist').select('*').eq('email', 'mehek55@gmail.com');
  console.log('student_whitelist anon select:', wlError ? wlError.message : wlData);

  // Check if we can select companies contact email anonymously
  const { data: compData, error: compError } = await supabase.from('companies').select('*').eq('contact_email', 'bellurbis@gmail.com');
  console.log('companies anon select:', compError ? compError.message : compData);
}

check();
