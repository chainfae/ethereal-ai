// Fetches incoming MMS messages (receipts) from Twilio
exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE || "+14782809442";
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  try {
    // Fetch incoming messages to our Twilio number
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json?To=${encodeURIComponent(twilioPhone)}&PageSize=30`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    const data = await res.json();

    // Filter for messages with media (MMS = receipts)
    const mmsMessages = (data.messages || []).filter(
      (m) => parseInt(m.num_media, 10) > 0
    );

    // For each MMS, fetch the media URLs
    const receipts = await Promise.all(
      mmsMessages.map(async (m) => {
        let mediaUrls = [];
        try {
          const mediaRes = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages/${m.sid}/Media.json`,
            { headers: { Authorization: `Basic ${auth}` } }
          );
          const mediaData = await mediaRes.json();
          mediaUrls = (mediaData.media_list || []).map((media) => ({
            url: `https://api.twilio.com${media.uri.replace(".json", "")}`,
            contentType: media.content_type,
            sid: media.sid,
          }));
        } catch (e) {
          console.error("Media fetch error:", e);
        }

        return {
          sid: m.sid,
          from: m.from,
          body: m.body || "",
          dateSent: m.date_sent,
          dateCreated: m.date_created,
          numMedia: parseInt(m.num_media, 10),
          status: m.status,
          mediaUrls,
        };
      })
    );

    // Also include all incoming messages (no media) as text receipts/notes
    const textMessages = (data.messages || [])
      .filter((m) => parseInt(m.num_media, 10) === 0 && m.body)
      .map((m) => ({
        sid: m.sid,
        from: m.from,
        body: m.body,
        dateSent: m.date_sent,
        dateCreated: m.date_created,
        numMedia: 0,
        status: m.status,
        mediaUrls: [],
      }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        receipts,
        textMessages,
        total: receipts.length,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
