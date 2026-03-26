import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

async function getToken(base44, connectorId) {
  return base44.asServiceRole.connectors.getCurrentAppUserAccessToken(connectorId).then(
    (token) => token,
    () => null
  );
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ connected: false });

  const body = await req.json();
  const token = await getToken(base44, body.connectorId);
  return Response.json({ connected: !!token });
});