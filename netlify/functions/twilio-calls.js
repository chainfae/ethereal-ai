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
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json?PageSize=20`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    const data = await res.json();

    const calls = (data.calls || []).map((c) => ({
      sid: c.sid,
      from: c.from,
      to: c.to,
      direction: c.direction,
      status: c.status,
      duration: c.duration,
      startTime: c.start_time,
      endTime: c.end_time,
      dateCreated: c.date_created,
    }));

    return { statusCode: 200, headers, body: JSON.stringify({ calls }) };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
