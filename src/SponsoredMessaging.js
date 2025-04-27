/**
 * SponsoredMessaging Class
 *
 * Provides methods to interact with the Sponsored Messaging API
 * for checking sponsorship and tracking clicks.
 */
class SponsoredMessaging {
    // Store config and state
    config = {};
    apiBaseUrl = '';
    isChatAreaSponsored = false;
    static BASE_STYLES_ID = 'sponsored-messaging-styles';

    /**
     * Initializes the SDK.
     * @param {object} options - Configuration options.
     * @param {string} options.apiBaseUrl - The base URL for the sponsorship API.
     * @param {string} options.sourceAppId - Identifier for the source application using the SDK.
     * @param {string} options.chatContainerId - The ID of the HTML element containing chat messages.
     * @param {string} [options.sponsorshipMode='message'] - How to display sponsorship ('message' or 'chat'). Defaults to 'message'.
     */
    constructor(options) {
        if (!options || !options.apiBaseUrl || !options.sourceAppId || !options.chatContainerId) {
            throw new Error('SDK Initialization Error: Missing required options (apiBaseUrl, sourceAppId, chatContainerId).');
        }

        this.apiBaseUrl = options.apiBaseUrl.replace(/\/$/, ''); // Remove trailing slash if present
        this.config = {
            sourceAppId: options.sourceAppId,
            chatContainerId: options.chatContainerId,
            sponsorshipMode: options.sponsorshipMode || 'message', // Default to 'message'
        };
        this.isChatAreaSponsored = false;

        console.log('SponsoredMessaging SDK Configured:', this.config);

        // Inject base CSS styles needed for sponsorship display
        this._injectBaseStyles();
    }

    /**
     * Injects the base CSS styles required for sponsored elements into the document head.
     * Avoids injecting multiple times.
     * @private
     */
    _injectBaseStyles() {
        if (document.getElementById(SponsoredMessaging.BASE_STYLES_ID)) {
            // Styles already injected
            return; 
        }

        const css = `
            /* Base styles injected by SponsoredMessaging SDK */
            fieldset.sponsored-wrapper {
                border: 1px solid #ffd36b; /* Default border */
                border-radius: 8px;
                position: relative; /* Needed for absolute legend positioning (optional) */
                margin: 10px 0; /* Keep some vertical margin */
                padding: 25px 15px 10px 15px; /* T:25, R:15, B:10, L:15 - Adjusted padding */
                box-sizing: border-box; /* Include padding/border in size */
            }
            legend.sponsor-header {
                font-size: 0.8em;
                font-weight: bold;
                color: #cc8400; /* Default color */
                padding: 0 5px;
                margin-left: 10px; /* Indent legend slightly */
                /* Position absolutely (optional, for 'cut-out' effect) */
                /* position: absolute; */
                /* top: -0.6em; */
                /* left: 10px; */
                /* background: #fff; */ /* Match background if using absolute */
            }
            .sponsor-content {
                 /* No extra padding needed if fieldset handles it */
            }
            .sponsor-content p {
                 margin: 5px 0; /* Keep paragraph margin */
            }
            .sponsor-footer {
                text-align: right;
                font-size: 0.9em;
                margin-top: 10px; /* Add space above footer */
            }
            .sponsor-footer p {
                margin: 0;
            }
            .sponsor-footer .cta-link {
                margin-left: 8px;
                color: #007bff; /* Default link color */
                text-decoration: underline;
                cursor: pointer;
                white-space: nowrap;
            }
        `;

        const styleElement = document.createElement('style');
        styleElement.id = SponsoredMessaging.BASE_STYLES_ID;
        styleElement.textContent = css;
        document.head.appendChild(styleElement);
        console.log('SponsoredMessaging SDK: Base styles injected.');
    }

    /**
     * Creates and appends a sponsored message block to the chat container.
     * @param {object} sponsoredData - The sponsorship data from the API.
     * @param {string} userSessionId - The current user session ID for tracking.
     * @private
     */
    _displaySponsoredMessage(sponsoredData, userSessionId) {
        const chatArea = document.getElementById(this.config.chatContainerId);
        if (!chatArea) {
            console.error('SDK Error: Chat container not found:', this.config.chatContainerId);
            return;
        }

        // --- Create Sponsored Message Elements --- 
        const fieldsetWrapper = document.createElement('fieldset');
        fieldsetWrapper.classList.add('sponsored-wrapper');
        // Apply dynamic color if available
        if (sponsoredData.colour) {
            fieldsetWrapper.style.borderColor = sponsoredData.colour;
        }

        const header = document.createElement('legend');
        header.classList.add('sponsor-header');
        header.textContent = `Sponsored by ${sponsoredData.brandName || 'Advertiser'}`;
        // Apply dynamic color if available
        if (sponsoredData.colour) {
            header.style.color = sponsoredData.colour;
        }
        fieldsetWrapper.appendChild(header);

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('sponsor-content');
        const textPara = document.createElement('p');
        textPara.textContent = sponsoredData.rawContent || 'Sponsored offer.'; // Use rawContent from API
        contentDiv.appendChild(textPara);
        fieldsetWrapper.appendChild(contentDiv);

        // --- Create Footer (if needed) ---
        if (sponsoredData.ctaLink && sponsoredData.ctaText) {
            const sponsorFooter = document.createElement('div');
            sponsorFooter.classList.add('sponsor-footer');

            const footerPara = document.createElement('p');
            if (sponsoredData.sponsoredContent) {
                footerPara.appendChild(document.createTextNode(sponsoredData.sponsoredContent + ' '));
            }

            const link = document.createElement('a');
            link.href = sponsoredData.ctaLink;
            link.textContent = sponsoredData.ctaText;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.classList.add('cta-link');
            // TODO: Apply inline styles from sponsoredData (e.g., link color)
            // link.style.color = sponsoredData.style?.linkColor || 'blue';

            link.addEventListener('click', (event) => {
                event.preventDefault();
                this._trackClickAndNavigate(link.href, sponsoredData.campaignId, userSessionId);
            });

            footerPara.appendChild(link);
            sponsorFooter.appendChild(footerPara);
            fieldsetWrapper.appendChild(sponsorFooter);
        }

        chatArea.appendChild(fieldsetWrapper);
        // Optional: Scroll to bottom
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    /**
     * Wraps the chat container with sponsorship styling (fieldset, legend, footer).
     * Only runs once per SDK instance if mode is 'chat'.
     * @param {object} sponsoredData - The sponsorship data from the API.
     * @param {string} userSessionId - The current user session ID for tracking.
     * @private
     */
    _applyChatSponsorshipWrapper(sponsoredData, userSessionId) {
        if (this.isChatAreaSponsored) {
            console.log('SDK: Chat area already sponsored, skipping wrapper application.');
            return; // Already applied
        }

        const originalChatArea = document.getElementById(this.config.chatContainerId);
        if (!originalChatArea) {
            console.error('SDK Error: Chat container not found for wrapping:', this.config.chatContainerId);
            return;
        }
        const parent = originalChatArea.parentNode;
        if (!parent) {
             console.error('SDK Error: Chat container has no parent for wrapping.');
            return;
        }

        console.log('SDK: Applying chat sponsorship wrapper.');

        // 1. Create the fieldset wrapper
        const fieldsetWrapper = document.createElement('fieldset');
        fieldsetWrapper.classList.add('sponsored-wrapper');
        // Apply dynamic color if available
        if (sponsoredData.colour) {
            fieldsetWrapper.style.borderColor = sponsoredData.colour;
        }
        // Reset padding/margin if needed, as it's now the outer container
        // fieldsetWrapper.style.padding = '25px 15px 10px 15px'; // Example reset

        // 2. Create the legend
        const header = document.createElement('legend');
        header.classList.add('sponsor-header');
        header.textContent = `Sponsored by ${sponsoredData.brandName || 'Advertiser'}`;
        // Apply dynamic color if available
        if (sponsoredData.colour) {
            header.style.color = sponsoredData.colour;
        }
        fieldsetWrapper.appendChild(header);

        // 3. Insert the fieldset before the original chat area, then move the chat area inside
        parent.insertBefore(fieldsetWrapper, originalChatArea);
        fieldsetWrapper.appendChild(originalChatArea);

        // 4. Create and append the footer
        if (sponsoredData.ctaLink && sponsoredData.ctaText) {
            const sponsorFooter = document.createElement('div');
            sponsorFooter.classList.add('sponsor-footer');

            const footerPara = document.createElement('p');
             if (sponsoredData.sponsoredContent) {
                footerPara.appendChild(document.createTextNode(sponsoredData.sponsoredContent + ' '));
            }

            const link = document.createElement('a');
            link.href = sponsoredData.ctaLink;
            link.textContent = sponsoredData.ctaText;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.classList.add('cta-link');
             // TODO: Apply inline styles from sponsoredData (e.g., link color)
            // link.style.color = sponsoredData.style?.linkColor || 'blue';

            link.addEventListener('click', (event) => {
                event.preventDefault();
                 this._trackClickAndNavigate(link.href, sponsoredData.campaignId, userSessionId);
            });

            footerPara.appendChild(link);
            sponsorFooter.appendChild(footerPara);
            fieldsetWrapper.appendChild(sponsorFooter);
        }
        
        this.isChatAreaSponsored = true;
        console.log('SDK: Chat area wrapper applied.');
    }

     /**
     * Helper method for tracking clicks and then navigating.
     * @param {string} url - The URL to navigate to.
     * @param {string} campaignId - Campaign ID for tracking.
     * @param {string} userSessionId - User session ID for tracking.
     * @private
     */
    _trackClickAndNavigate(url, campaignId, userSessionId) {
        if (campaignId && userSessionId && this.config.sourceAppId) {
             console.log('SDK Tracking click with:', { 
                campaignId: campaignId, 
                userSessionId: userSessionId,
                sourceAppId: this.config.sourceAppId
            });
            this.trackClick({ 
                campaignId: campaignId, 
                userSessionId: userSessionId,
                sourceAppId: this.config.sourceAppId
            })
            .then(trackResponse => {
                console.log('SDK Track click response:', trackResponse);
                window.open(url, '_blank');
            })
            .catch(error => {
                console.error('SDK Error tracking click:', error);
                window.open(url, '_blank'); // Navigate even if tracking fails
            });
        } else {
            console.warn('SDK: Missing data for click tracking. Navigating directly.');
            window.open(url, '_blank');
        }
    }

    /**
     * Checks if the AI response should be sponsored.
     * @param {object} context - Sponsorship check context.
     * @param {string} context.userMessage - The user's message.
     * @param {string} context.aiResponse - The AI's response.
     * @param {string} [context.userSessionId] - Optional user session ID.
     * @param {string} [context.sourceAppId] - Optional source application ID.
     * @returns {Promise<object>} - A promise that resolves with the API response or a default object on failure.
     *                            Default object: { isSponsored: false, rawContent: aiResponse }
     * @throws {Error} If required context parameters are missing.
     */
    async checkSponsorship(context) {
        // Destructure context with fallback for sourceAppId
        const { userMessage, aiResponse, userSessionId } = context;

        // Basic validation
        if (!userMessage || !aiResponse) {
            throw new Error('userMessage and aiResponse are required for checkSponsorship.');
        }

        // Construct the full API URL
        const url = `${this.apiBaseUrl}/api/v1/sponsorship/check-sponsorship`;

        // Log the payload being sent
        console.log('[SponsoredMessaging] Sending checkSponsorship payload:', {
            userMessage,
            aiResponse,
            userSessionId, // From arguments
            sourceAppId: this.config.sourceAppId // From config stored during initialization
        });

        const body = JSON.stringify({
            userMessage,
            aiResponse,
            userSessionId, // From arguments
            sourceAppId: this.config.sourceAppId // From config stored during initialization
        });

        console.debug(`[SponsoredMessaging] Calling POST ${url} with body:`, body);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' // Explicitly set Content-Type
                },
                body: body,
            });

            if (!response.ok) {
                console.error(`[SponsoredMessaging] API Error ${response.status}: ${response.statusText}`);
                // Non-fatal: return non-sponsored response
                return { success: false, isSponsored: false, rawContent: aiResponse, error: `API Error ${response.status}` }; 
            }

            const responseData = await response.json();
            console.debug('[SponsoredMessaging] API Response:', responseData);

            // If the API call was successful and indicates sponsorship, let the SDK handle display
            if (responseData.success && responseData.data && responseData.data.isSponsored) {
                console.log('SDK: Sponsorship detected. Handling display based on mode:', this.config.sponsorshipMode);
                if (this.config.sponsorshipMode === 'message') {
                    this._displaySponsoredMessage(responseData.data, userSessionId);
                } else if (this.config.sponsorshipMode === 'chat') {
                    this._applyChatSponsorshipWrapper(responseData.data, userSessionId);
                } else {
                    console.warn(`SDK: Unknown sponsorshipMode '${this.config.sponsorshipMode}'. Defaulting to no display.`);
                }
                 // Return the data, but the SDK handled the display part
                return responseData.data;
            } else {
                // Not sponsored or API indicated failure, return data indicating not sponsored
                return {
                    success: responseData.success ?? false, // Use API success if available
                    isSponsored: false,
                    rawContent: aiResponse // Pass back original AI response
                    // Include other fields from responseData.data if needed?
                };
            }

        } catch (error) {
            console.error('[SponsoredMessaging] Network or other error checking sponsorship:', error);
            // Network or other error, return non-sponsored
            return { success: false, isSponsored: false, rawContent: aiResponse, error: error.message }; 
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
        const { campaignId, userSessionId } = options;

        if (!campaignId) {
            throw new Error('campaignId is required for trackClick.');
        }

        // Correct the endpoint path
        const endpoint = `${this.apiBaseUrl}/api/v1/sponsorship/track-click`; // Correct path
        const body = JSON.stringify({
            campaignId,
            ...(userSessionId && { userSessionId }),
            // Use options sourceAppId or fallback to the one from config
            sourceAppId: this.config.sourceAppId
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
