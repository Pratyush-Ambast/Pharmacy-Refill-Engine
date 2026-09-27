// Adapter seam for patient notifications.
// Uses Twilio when configured; otherwise simulates (server log).
// In this demo all texts go to DEMO_PATIENT_PHONE by design.
export async function sendSms(body: string): Promise<{ delivered: boolean; channel: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE;
  const to = process.env.DEMO_PATIENT_PHONE;

  if (!sid || !token || !from || !to) {
    console.log(`[sms:simulated] → patient — ${body}`);
    return { delivered: false, channel: "simulated" };
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
      },
      body: new URLSearchParams({ From: from, To: to, Body: body }),
    }
  );
  if (!res.ok) console.error("[sms:twilio] failed:", await res.text());
  return { delivered: res.ok, channel: "twilio" };
}
