// Edge Function Supabase (Deno). Déployer avec :
//   supabase functions deploy notify-new-message
// Puis configurer un Database Webhook (Database -> Webhooks) sur la table
// `messages`, événement INSERT, qui appelle l'URL de cette fonction.
// Nécessite le secret RESEND_API_KEY :
//   supabase secrets set RESEND_API_KEY=re_xxxxxxxx

const NOTIFY_TO = "aangejosue@gmail.com";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
  if (!RESEND_API_KEY) {
    return new Response("RESEND_API_KEY not configured", { status: 500 });
  }

  const payload = await req.json();
  const message = payload.record ?? payload.new ?? payload;

  const content: string = message.content ?? "(contenu vide)";
  const tags: string[] = message.tags ?? [];
  const createdAt: string = message.created_at ?? new Date().toISOString();
  const alias: string = message.alias ?? "Étudiant·e anonyme";

  const html = `
    <h2>Nouveau message sur Hors Micro</h2>
    <p><strong>${alias}</strong> — ${new Date(createdAt).toLocaleString("fr-FR")}</p>
    <p>${content.replace(/\n/g, "<br/>")}</p>
    <p>Thèmes : ${tags.length ? tags.join(", ") : "aucun"}</p>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Hors Micro <onboarding@resend.dev>",
      to: [NOTIFY_TO],
      subject: "Nouveau message anonyme sur Hors Micro",
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return new Response(`Resend error: ${errText}`, { status: 502 });
  }

  return new Response("ok", { status: 200 });
});
