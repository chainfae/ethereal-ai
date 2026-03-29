// Receives incoming SMS/MMS to your Twilio number
// Configure in Twilio Console: Phone Number > Messaging > Webhook URL
// Set to: https://etheral-ai.netlify.app/api/twilio-webhook (HTTP POST)
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*" }, body: "" };
  }

  // Parse the incoming Twilio webhook payload
  const params = new URLSearchParams(event.body || "");
  const from = params.get("From") || "";
  const body = params.get("Body") || "";
  const numMedia = parseInt(params.get("NumMedia") || "0", 10);

  console.log(`Incoming message from ${from}: "${body}" with ${numMedia} media`);

  // Build TwiML response
  let responseMsg = "Got it! Your message has been received.";
  if (numMedia > 0) {
    responseMsg = `Receipt received! ${numMedia} image${numMedia > 1 ? "s" : ""} captured and added to your dashboard.`;
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseMsg}</Message>
</Response>`;

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/xml" },
    body: twiml,
  };
};
