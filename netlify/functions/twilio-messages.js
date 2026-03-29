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
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json?PageSize=20`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    const data = await res.json();

    const messages = (data.messages || []).map((m) => ({
      sid: m.sid,
      body: m.body,
      from: m.from,
      to: m.to,
      direction: m.direction,
      status: m.status,
      dateSent: m.date_sent,
      dateCreated: m.date_created,
    }));

    return { statusCode: 200, headers, body: JSON.stringify({ messages }) };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
