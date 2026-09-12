import { supabase } from "./supabase";


const API_URL = "http://127.0.0.1:8000";


export async function getAuthHeaders() {
    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
        throw new Error("You are not authenticated.");
    }

    return {
        Authorization: `Bearer ${session.access_token}`,
    };
}


export async function apiFetch(
    endpoint,
    options = {}
) {
    const headers = await getAuthHeaders();

    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...headers,
                ...options.headers,
            },
        }
    );


    if (!response.ok) {
        let message = "Something went wrong.";

        try {
            const data = await response.json();

            if (Array.isArray(data.detail)) {
                message = data.detail
                    .map((error) => {
                        if (
                            typeof error === "object" &&
                            error?.msg
                        ) {
                            const location =
                                error.loc
                                    ?.slice(1)
                                    .join(".");

                            return location
                                ? `${location}: ${error.msg}`
                                : error.msg;
                        }

                        return String(error);
                    })
                    .join(", ");
            } else if (
                typeof data.detail === "object" &&
                data.detail !== null
            ) {
                message =
                    data.detail.msg ||
                    JSON.stringify(data.detail);
            } else if (data.detail) {
                message = data.detail;
            }
        } catch {
            // Ignore invalid error responses.
        }

        throw new Error(message);
    }


    return response.json();
}