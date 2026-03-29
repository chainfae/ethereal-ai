// Proxies authenticated Twilio media URLs so images display in the browser
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*" }, body: "" };
  }

  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  const mediaSid = event.queryStringParameters?.mediaSid;
  const messageSid = event.queryStringParameters?.messageSid;

  if (!mediaSid || !messageSid) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing mediaSid or messageSid" }),
    };
  }

  try {
    const mediaUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages/${messageSid}/Media/${mediaSid}`;

    // First, get the redirect to the actual media file
    const res = await fetch(mediaUrl, {
      headers: { Authorization: `Basic ${auth}` },
      redirect: "follow",
    });

    if (!res.ok) {
      return { statusCode: res.status, body: "Media not found" };
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await res.arrayBuffer());

    return {
      statusCode: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
