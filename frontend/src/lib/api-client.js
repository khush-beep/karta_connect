import { supabase } from "@/integrations/supabase/client";

/**
 * Make an authenticated API call with JWT token
 */
export async function authenticatedFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error("User not authenticated");
  }

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.access_token}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }

  return response.json();
}
