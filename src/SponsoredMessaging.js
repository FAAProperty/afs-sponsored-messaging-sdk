/**
 * SponsoredMessaging Class
 *
 * Provides methods to interact with the Sponsored Messaging API
 * for checking sponsorship and tracking clicks.
 */
export class SponsoredMessaging {
    #apiBaseUrl;

    /**
     * Creates an instance of SponsoredMessaging.
     * @param {object} options - Configuration options.
     * @param {string} options.apiBaseUrl - The base URL of the Sponsored Messaging API.
     * @throws {Error} If apiBaseUrl is not provided.
     */
    constructor(options) {
        if (!options || !options.apiBaseUrl) {
            throw new Error('apiBaseUrl is required when initializing SponsoredMessaging.');
        }
        // Ensure the base URL doesn't end with a slash to avoid double slashes in endpoint URLs
        this.#apiBaseUrl = options.apiBaseUrl.replace(/\/$/, '');
        console.log(`SponsoredMessaging SDK initialized with API base URL: ${this.#apiBaseUrl}`);
    }

    /**
     * Checks if the AI response should be sponsored.
     * @param {object} options - Sponsorship check options.
     * @param {string} options.userMessage - The user's message.
     * @param {string} options.aiResponse - The AI's response.
     * @param {string} [options.userSessionId] - Optional user session ID.
     * @param {string} [options.sourceAppId] - Optional source application ID.
     * @returns {Promise<object>} - A promise that resolves with the API response or a default object on failure.
     *                            Default object: { isSponsored: false, rawContent: aiResponse }
     * @throws {Error} If userMessage or aiResponse are not provided.
     */
    async checkSponsorship(options) {
        const { userMessage, aiResponse, userSessionId, sourceAppId } = options || {};

        if (!userMessage || !aiResponse) {
            throw new Error('userMessage and aiResponse are required for checkSponsorship.');
        }

        const endpoint = `${this.#apiBaseUrl}/check-sponsorship`;
        const body = JSON.stringify({
            userMessage,
            aiResponse,
            ...(userSessionId && { userSessionId }),
            ...(sourceAppId && { sourceAppId }),
        });

        console.debug(`[SponsoredMessaging] Calling POST ${endpoint} with body:`, body);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body,
            });

            if (!response.ok) {
                console.error(`[SponsoredMessaging] API Error ${response.status}: ${response.statusText}. URL: ${endpoint}`);
                // Attempt to read error body for more details
                try {
                    const errorBody = await response.text();
                    console.error(`[SponsoredMessaging] API Error Body: ${errorBody}`);
                } catch (bodyError) {
                    console.error('[SponsoredMessaging] Could not read error response body:', bodyError);
                }
                // Return default non-sponsored object on non-2xx response
                return { isSponsored: false, rawContent: aiResponse };
            }

            const data = await response.json();
            console.debug('[SponsoredMessaging] Sponsorship check successful. Response:', data);
            return data;

        } catch (error) {
            console.error(`[SponsoredMessaging] Network or fetch error calling ${endpoint}:`, error);
            // Return default non-sponsored object on fetch/network errors
            return { isSponsored: false, rawContent: aiResponse };
        }
    }

    /**
     * Tracks a click on sponsored content.
     * @param {object} options - Click tracking options.
     * @param {string} options.campaignId - The ID of the campaign.
     * @param {string} [options.userSessionId] - Optional user session ID.
     * @param {string} [options.sourceAppId] - Optional source application ID.
     * @returns {Promise<void>} - A promise that resolves when the request is sent. Errors are caught and logged silently.
     * @throws {Error} If campaignId is not provided.
     */
    async trackClick(options) {
        const { campaignId, userSessionId, sourceAppId } = options || {};

        if (!campaignId) {
            throw new Error('campaignId is required for trackClick.');
        }

        const endpoint = `${this.#apiBaseUrl}/track-click`;
        const body = JSON.stringify({
            campaignId,
            ...(userSessionId && { userSessionId }),
            ...(sourceAppId && { sourceAppId }),
        });

        console.debug(`[SponsoredMessaging] Calling POST ${endpoint} with body:`, body);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body,
            });

            if (!response.ok) {
                console.error(`[SponsoredMessaging] API Error ${response.status}: ${response.statusText} while tracking click. URL: ${endpoint}`);
                // Attempt to read error body for more details
                try {
                    const errorBody = await response.text();
                    console.error(`[SponsoredMessaging] API Error Body: ${errorBody}`);
                } catch (bodyError) {
                    console.error('[SponsoredMessaging] Could not read error response body:', bodyError);
                }
                // Don't throw, just log errors for tracking
            } else {
                console.debug('[SponsoredMessaging] Click tracking request sent successfully.');
            }

        } catch (error) {
            console.error(`[SponsoredMessaging] Network or fetch error calling ${endpoint}:`, error);
            // Don't throw, just log errors for tracking
        }
    }
}
