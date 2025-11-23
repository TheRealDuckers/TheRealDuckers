import fetch from "node-fetch";

export async function handler(event) {
  const params = new URLSearchParams(event.queryStringParameters);
  const code = params.get("code");

  // Exchange code for token
  const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code,
      redirect_uri: "https://your-netlify-site.netlify.app/.netlify/functions/callback"
    })
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;

  // Send DM to the logged-in user
  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      channel: tokenData.authed_user.id, // Slack user ID
      text: "Welcome! You’re now logged in 🎉"
    })
  });

  return {
    statusCode: 200,
    body: "You’re logged in and got a DM!"
  };
}
