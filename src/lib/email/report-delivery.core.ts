function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character
  );
}

export function buildFullReportEmail({
  recipientName,
  domain,
  reportUrl,
}: {
  recipientName?: string;
  domain: string;
  reportUrl: string;
}) {
  const greeting = recipientName?.trim()
    ? `Hi ${recipientName.trim()},`
    : "Hello,";
  const subject = `Your Author Website Report for ${domain}`;
  const text = [
    greeting,
    "",
    `Your complete Author Website Report for ${domain} is attached as a PDF.`,
    "",
    `You can also reopen the online report here: ${reportUrl}`,
    "",
    "GrailHiiv",
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:600px;margin:0 auto">
      <p>${escapeHtml(greeting)}</p>
      <p>Your complete Author Website Report for <strong>${escapeHtml(domain)}</strong> is attached as a PDF.</p>
      <p><a href="${escapeHtml(reportUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px">Open your online report</a></p>
      <p style="color:#6b7280;font-size:14px">Keep this email so you can return to your report later.</p>
      <p>GrailHiiv</p>
    </div>
  `.trim();

  return { html, subject, text };
}
