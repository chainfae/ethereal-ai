exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const accessToken = process.env.GMAIL_ACCESS_TOKEN;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;

  try {
    let token = accessToken;

    // If we have refresh token credentials, try refreshing
    if (refreshToken && clientId && clientSecret) {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });
      const tokenData = await tokenRes.json();
      if (tokenData.access_token) {
        token = tokenData.access_token;
      }
    }

    if (!token) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ messages: [], note: "Gmail OAuth not configured. Set GMAIL_REFRESH_TOKEN, GMAIL_CLIENT_ID, and GMAIL_CLIENT_SECRET." }),
      };
    }

    // Fetch message list
    const listRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=in:inbox",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const listData = await listRes.json();

    if (!listData.messages) {
      return { statusCode: 200, headers, body: JSON.stringify({ messages: [] }) };
    }

    // Fetch details for each message (batch of first 10)
    const messageIds = listData.messages.slice(0, 10);
    const details = await Promise.all(
      messageIds.map(async (m) => {
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.json();
      })
    );

    const messages = details.map((msg) => {
      const getHeader = (name) => {
        const h = (msg.payload?.headers || []).find(
          (h) => h.name.toLowerCase() === name.toLowerCase()
        );
        return h ? h.value : "";
      };

      return {
        id: msg.id,
        threadId: msg.threadId,
        snippet: msg.snippet || "",
        from: getHeader("From"),
        to: getHeader("To"),
        subject: getHeader("Subject"),
        date: getHeader("Date"),
        labelIds: msg.labelIds || [],
        isUnread: (msg.labelIds || []).includes("UNREAD"),
      };
    });

    return { statusCode: 200, headers, body: JSON.stringify({ messages }) };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
