// HybridDocumentService - Presigned S3 upload + Django orchestration (no aws-amplify)
// Feature-flagged via EXPO_PUBLIC_ENABLE_AWS_DOCS | app.json extra.docsPipelineEnabled (default false)

import DjangoAPIService from './DjangoAPIService';
import Constants from 'expo-constants';

function asBool(v) {
  if (v === true) return true;
  if (typeof v === 'string') return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
  return false;
}

const ENABLE_LIVE = (() => {
  const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
  if (asBool(env.EXPO_PUBLIC_ENABLE_AWS_DOCS)) return true;
  const extra = Constants?.expoConfig?.extra || {};
  return asBool(extra.docsPipelineEnabled);
})();

async function ensureInit() {
  try { await DjangoAPIService.initialize(); } catch {}
}

async function presignUpload(meta) {
  // POST /api/v1/public_app/docs/presign
  return await DjangoAPIService.makeAuthenticatedRequest(
    '/api/v1/public_app/docs/presign',
    'POST',
    meta,
  );
}

async function submitExtraction(body) {
  return await DjangoAPIService.makeAuthenticatedRequest(
    '/api/v1/public_app/docs/submit',
    'POST',
    body,
  );
}

async function getStatus(jobId) {
  return await DjangoAPIService.makeAuthenticatedRequest(
    `/api/v1/public_app/docs/status/${jobId}`,
    'GET',
  );
}

async function getResult(jobId) {
  return await DjangoAPIService.makeAuthenticatedRequest(
    `/api/v1/public_app/docs/result/${jobId}`,
    'GET',
  );
}

async function applyResult(jobId) {
  return await DjangoAPIService.makeAuthenticatedRequest(
    `/api/v1/public_app/docs/apply/${jobId}`,
    'POST',
    {},
  );
}

async function putToS3(url, headers, file) {
  const body = await readAsArrayBuffer(file);
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      ...(headers || {}),
      'Content-Type': file.type || 'application/octet-stream',
      'Content-Length': String(file.size || body.byteLength),
    },
    body,
  });
  if (!res.ok) {
    const t = await safeText(res);
    throw new Error(`S3 PUT failed ${res.status}: ${t}`);
  }
}

async function readAsArrayBuffer(file) {
  // Support Expo DocumentPicker file shape { uri, name, size, mimeType/type }
  if (file?.arrayBuffer) return await file.arrayBuffer();
  if (file?.uri) {
    const res = await fetch(file.uri);
    return await res.arrayBuffer();
  }
  throw new Error('Unsupported file object');
}

async function safeText(res) {
  try { return await res.text(); } catch { return ''; }
}

export const HybridDocumentService = {
  // processDocument(file, { docType, agentId, quoteId })
  processDocument: async (file, options = {}) => {
    if (!ENABLE_LIVE) {
      return { success: false, disabled: true, error: 'AWS docs pipeline disabled by feature flag' };
    }
    await ensureInit();
    const filename = file?.name || 'document';
    const mimeType = file?.type || file?.mimeType || 'application/octet-stream';
    const sizeBytes = file?.size || 0;
    const docType = options.docType || 'generic';
    const notify = (phase, percent) => {
      try { if (typeof options.onProgress === 'function') options.onProgress(phase, percent); } catch {}
    };

    // 1) presign
    notify('preparing', 5);
    const { data: presign } = await presignUpload({ filename, mimeType, sizeBytes, docType, agentId: options.agentId, quoteId: options.quoteId });
    // 2) PUT to S3
    notify('uploading', 20);
    await putToS3(presign.uploadUrl, presign.headers, { ...file, type: mimeType, size: sizeBytes });
    // 3) submit extraction
    notify('submitting', 50);
    const { data: submit } = await submitExtraction({ objectKey: presign.objectKey, docType, correlationId: options.correlationId, quoteId: options.quoteId });
    const jobId = submit.jobId;
    // 4) poll status -> DONE
    const started = Date.now();
    const timeoutMs = 60_000; // 60s cap on client side
    const intervalMs = 1500;
    notify('processing', 70);
    while (Date.now() - started < timeoutMs) {
      const elapsed = Date.now() - started;
      const pct = Math.min(92, 70 + Math.floor((elapsed / timeoutMs) * 20));
      notify('processing', pct);
      const { data: st } = await getStatus(jobId);
      if (st.state === 'DONE') {
        notify('finishing', 95);
        const { data: result } = await getResult(jobId);
        // Best-effort: apply to quotation form if backend supports it and quoteId exists
        try { if (options.quoteId) { await applyResult(jobId); } } catch {}
        notify('done', 100);
        return { success: true, jobId, result };
      }
      if (st.state === 'FAILED') {
        notify('error', 0);
        return { success: false, jobId, error: st.error || 'Processing failed' };
      }
      await new Promise(r => setTimeout(r, intervalMs));
    }
    notify('timeout', 0);
    return { success: false, error: 'Timed out waiting for extraction' };
  }
};

export default HybridDocumentService;