export interface NetlifyDeployOptions {
  token: string;
  siteId?: string;
  siteName?: string;
}

export interface NetlifyDeployResult {
  success: boolean;
  siteId: string;
  deployId: string;
  url: string;
  adminUrl: string;
  error?: string;
}

export async function deployZipToNetlify(
  zipBlob: Blob,
  options: NetlifyDeployOptions
): Promise<NetlifyDeployResult> {
  const { token, siteId, siteName } = options;
  if (!token) {
    return {
      success: false,
      siteId: '',
      deployId: '',
      url: '',
      adminUrl: '',
      error: 'Netlify Personal Access Token is required.',
    };
  }

  try {
    const isRedeploy = Boolean(siteId);
    let endpoint = isRedeploy
      ? `https://api.netlify.com/api/v1/sites/${siteId}/deploys`
      : 'https://api.netlify.com/api/v1/sites';

    if (!isRedeploy && siteName) {
      endpoint += `?name=${encodeURIComponent(siteName)}`;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        'Content-Type': 'application/zip',
      },
      body: zipBlob,
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `Netlify API error (${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        errorMsg = parsed.message || parsed.error || errorMsg;
      } catch {}
      return {
        success: false,
        siteId: siteId || '',
        deployId: '',
        url: '',
        adminUrl: '',
        error: errorMsg,
      };
    }

    const data = await res.json();
    const resolvedSiteId = data.site_id || data.id || siteId || '';
    const deployId = data.deploy_id || data.id || '';
    const liveUrl =
      data.ssl_url ||
      data.url ||
      (data.subdomain ? `https://${data.subdomain}.netlify.app` : '') ||
      (data.name ? `https://${data.name}.netlify.app` : '');
    const adminUrl =
      data.admin_url ||
      (resolvedSiteId ? `https://app.netlify.com/sites/${resolvedSiteId}` : '');

    return {
      success: true,
      siteId: resolvedSiteId,
      deployId,
      url: liveUrl,
      adminUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      siteId: siteId || '',
      deployId: '',
      url: '',
      adminUrl: '',
      error: err?.message || 'Network or CORS failure during Netlify upload',
    };
  }
}

export async function testNetlifyConnection(
  token: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  if (!token) return { success: false, error: 'Token is empty' };
  try {
    const res = await fetch('https://api.netlify.com/api/v1/user', {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
      },
    });
    if (!res.ok) {
      return { success: false, error: `Invalid token (${res.status})` };
    }
    const data = await res.json();
    return { success: true, email: data.email || data.full_name || 'Connected' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Connection failed' };
  }
}
