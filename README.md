# Chat Ads SDK

SDK for interacting with the Sponsored Messaging API.

## Installation

```bash
npm install chat-ads-sdk
# or
yarn add chat-ads-sdk
```

## Usage

```javascript
import { SponsoredMessaging } from 'chat-ads-sdk';

const sdk = new SponsoredMessaging({
  apiBaseUrl: 'https://your-sponsorship-api.com' // Replace with your actual API base URL
});

async function checkAndTrack() {
  try {
    const sponsoredResponse = await sdk.checkSponsorship({
      userMessage: "Where should I travel next?",
      aiResponse: "Consider visiting the beautiful beaches of Thailand.",
      userSessionId: 'session-xyz-123',
      sourceAppId: 'my-chat-app'
    });

    console.log('Sponsorship Check Response:', sponsoredResponse);

    if (sponsoredResponse.isSponsored) {
      console.log('Content is sponsored! Campaign ID:', sponsoredResponse.campaignId);
      // Render the sponsored content (e.g., sponsoredResponse.content)

      // Track the click if the user interacts with the sponsored content
      await sdk.trackClick({
        campaignId: sponsoredResponse.campaignId,
        userSessionId: 'session-xyz-123',
        sourceAppId: 'my-chat-app'
      });
      console.log('Click tracked for campaign:', sponsoredResponse.campaignId);

    } else {
      console.log('Content is not sponsored.');
      // Render the original AI response (sponsoredResponse.rawContent)
    }
  } catch (error) {
    console.error('An error occurred:', error);
    // Handle errors appropriately
  }
}

checkAndTrack();
```

## API

### `new SponsoredMessaging(options)`

Initializes the SDK.

-   `options` (Object): Configuration options.
    -   `apiBaseUrl` (String, required): The base URL for the Sponsored Messaging API.

### `checkSponsorship(options)`

Checks if a given AI response should be replaced with sponsored content.

-   `options` (Object): Details for the sponsorship check.
    -   `userMessage` (String, required): The user's input message.
    -   `aiResponse` (String, required): The AI's generated response.
    -   `userSessionId` (String, optional): A unique identifier for the user's session.
    -   `sourceAppId` (String, optional): An identifier for the application using the SDK.
-   **Returns**: `Promise<Object>` - Resolves with the API response or a default object `{ isSponsored: false, rawContent: aiResponse }` on failure.

### `trackClick(options)`

Tracks a user click on sponsored content.

-   `options` (Object): Details for tracking the click.
    -   `campaignId` (String, required): The ID of the campaign associated with the clicked content.
    -   `userSessionId` (String, optional): A unique identifier for the user's session.
    -   `sourceAppId` (String, optional): An identifier for the application using the SDK.
-   **Returns**: `Promise<void>` - Resolves when the tracking request is sent. Errors are logged silently.
