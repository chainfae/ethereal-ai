exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const apiKey = process.env.RETELL_API_KEY;

  try {
    const res = await fetch("https://api.retellai.com/v2/list-calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ limit: 20, sort_order: "descending" }),
    });
    const data = await res.json();

    const calls = (Array.isArray(data) ? data : []).map((c) => ({
      callId: c.call_id,
      callType: c.call_type,
      agentName: c.agent_name || "AI Agent",
      callStatus: c.call_status,
      direction: c.direction || (c.from_number ? "inbound" : "outbound"),
      fromNumber: c.from_number || "",
      toNumber: c.to_number || "",
      startTimestamp: c.start_timestamp,
      endTimestamp: c.end_timestamp,
      durationMs: c.duration_ms || 0,
      transcript: c.transcript || "",
      disconnectReason: c.disconnect_reason || "",
      callAnalysis: c.call_analysis || null,
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
