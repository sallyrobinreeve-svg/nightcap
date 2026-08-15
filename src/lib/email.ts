/**
 * Developer notifications for UGC (App Store Guideline 1.2).
 * Sends email to support when users report or block.
 * Requires RESEND_API_KEY and UGC_ALERT_EMAIL in env.
 */
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const to = process.env.UGC_ALERT_EMAIL || "nightcapt1@outlook.com";
const from =
  process.env.EMAIL_FROM || "NightCapt Alerts <onboarding@resend.dev>";

export async function notifyDeveloperOfReport(info: {
  reporter_id: string;
  reported_user_id: string;
  entry_id?: string;
  comment_id?: string;
  reason?: string;
}) {
  if (!resend) return;
  const { reporter_id, reported_user_id, entry_id, comment_id, reason } = info;
  await resend.emails.send({
    from,
    to,
    subject: "[NightCapt] New content report",
    html: `
      <p>A user has reported objectionable content.</p>
      <ul>
        <li>Reporter ID: ${reporter_id}</li>
        <li>Reported user ID: ${reported_user_id}</li>
        ${entry_id ? `<li>Entry ID: ${entry_id}</li>` : ""}
        ${comment_id ? `<li>Comment ID: ${comment_id}</li>` : ""}
        ${reason ? `<li>Reason: ${reason}</li>` : ""}
      </ul>
      <p>Please review and act within 24 hours (remove content, eject user if appropriate).</p>
    `,
  });
}

export async function notifyDeveloperOfBlock(info: {
  blocker_id: string;
  blocked_id: string;
}) {
  if (!resend) return;
  const { blocker_id, blocked_id } = info;
  await resend.emails.send({
    from,
    to,
    subject: "[NightCapt] User blocked for abusive behavior",
    html: `
      <p>A user has blocked another user. The blocked user's content has been removed from the blocker's feed.</p>
      <ul>
        <li>Blocker (reporter) ID: ${blocker_id}</li>
        <li>Blocked user ID: ${blocked_id}</li>
      </ul>
      <p>Consider reviewing the blocked user and taking action within 24 hours if the behavior warrants removal.</p>
    `,
  });
}
