import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { connectorId } = await req.json();
    const accessToken = await base44.asServiceRole.connectors.getCurrentAppUserAccessToken(connectorId);
    
    if (!accessToken) return Response.json({ error: 'Not connected' }, { status: 400 });
    return Response.json({ connected: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
});