import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { connectorId } = await req.json();
  if (!connectorId) return Response.json({ error: 'connectorId required' }, { status: 400 });

  // Get the OAuth connect URL for this connector
  const connectUrl = await base44.connectors.connectAppUser(connectorId);

  // Parse the redirect_uri from the URL so we know what to register in Google Console
  let redirectUri = null;
  try {
    const parsed = new URL(connectUrl);
    redirectUri = parsed.searchParams.get('redirect_uri');
  } catch (_) {}

  return Response.json({ connectUrl, redirectUri });
});