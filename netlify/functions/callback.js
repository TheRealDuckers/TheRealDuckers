// netlify/functions/callback.js
import fetch from "node-fetch";

export async function handler(event) {
  try {
    // Grab the "code" Slack sends back in the query string
    const params = new URLSearchParams(event.queryStringParameters);
    const code = params.get("code");

    if (!code) {
      return {
        statusCode: 400,
        body: "Missing OAuth code"
      };
    }

    // Exchange the code for an access token
    const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: "https://your-site.netlify.app/.netlify/functions/callback"
      })
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.ok) {
      return {
        statusCode: 500,
        body: `OAuth failed: ${JSON.stringify(tokenData)}`
      };
    }

    const token = tokenData.access_token;
    const userId = tokenData.authed_user.id;

    // Open a DM channel with the logged-in user
    const dmRes = await fetch("https://slack.com/api/conversations.open", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ users: userId })
    });
    const dmData = await dmRes.json();

    if (!dmData.ok) {
      return {
        statusCode: 500,
        body: `Failed to open DM: ${JSON.stringify(dmData)}`
      };
    }

    // Send a welcome message
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        channel: dmData.channel.id,
        text: "🎉 Welcome! You’re now logged in with Slack."
      })
    });

    return {
      statusCode: 200,
      body: "OAuth successful — DM sent!"
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: `Error: ${err.message}`
    };
  }
}
