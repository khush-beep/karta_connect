export function normalizeResumePath(value) {
    let path = value.trim();
    if (/^https?:\/\//.test(path)) {
        const marker = "/storage/v1/object/";
        const index = path.indexOf(marker);
        if (index >= 0) {
            path = path.slice(index + marker.length);
        }
    }
    path = path.replace(/^sign\//, "").replace(/^public\//, "").replace(/^resumes\//, "");
    return decodeURIComponent(path.split("?")[0]);
}

export async function getSignedResumeUrl(value, supabaseClient) {
    if (!value)
        return null;
    const trimmed = value.trim();
    const marker = "/storage/v1/object/";
    if (/^https?:\/\//.test(trimmed) && !trimmed.includes(marker)) {
        return trimmed;
    }
    const normalized = normalizeResumePath(trimmed);
    if (!normalized)
        return null;
    async function createUrl() {
        const { data, error } = await supabaseClient.storage
            .from("resumes")
            .createSignedUrl(normalized, 3600);
        if (error) {
            throw error;
        }
        return data?.signedUrl ?? null;
    }
    try {
        return await createUrl();
    }
    catch (err) {
        const message = err?.message || "";
        console.warn("Private resume URL generation failed, retrying after auth refresh:", message);
        if (message.includes("InvalidJWT") || message.includes("exp")) {
            if (typeof supabaseClient.auth?.refreshSession === "function") {
                const refreshResult = await supabaseClient.auth.refreshSession();
                if (refreshResult?.data?.session) {
                    try {
                        return await createUrl();
                    }
                    catch (retryError) {
                        console.error("Retry failed after auth refresh:", retryError);
                        return null;
                    }
                }
            }
        }
        return null;
    }
}

export async function getResumeDownloadUrl(value, supabaseClient) {
    if (!value)
        return null;
    const trimmed = value.trim();
    const marker = "/storage/v1/object/";
    if (/^https?:\/\//.test(trimmed) && !trimmed.includes(marker)) {
        return trimmed;
    }
    return getSignedResumeUrl(trimmed, supabaseClient);
}
