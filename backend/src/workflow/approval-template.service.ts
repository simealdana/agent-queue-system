import { Injectable } from '@nestjs/common';

export interface ApprovalPageData {
  token?: string;
  workflowName?: string;
  workflowId?: string;
  stepName?: string;
  pendingData?: Record<string, unknown>;
  status: 'pending' | 'approved' | 'not_found' | 'already_approved';
}

@Injectable()
export class ApprovalTemplateService {
  render(data: ApprovalPageData): string {
    const content = this.renderContent(data);
    return this.wrapInLayout(content);
  }

  private renderContent(data: ApprovalPageData): string {
    switch (data.status) {
      case 'not_found':
        return this.renderNotFound();
      case 'already_approved':
        return this.renderAlreadyApproved();
      case 'approved':
        return this.renderApproved(data);
      default:
        return this.renderPending(data);
    }
  }

  private renderNotFound(): string {
    return `
      ${this.icon('error')}
      <h2>Approval Not Found</h2>
      <p class="subtitle">This approval link is invalid or has already been used.</p>
    `;
  }

  private renderAlreadyApproved(): string {
    return `
      ${this.icon('success')}
      <h2>Already Approved</h2>
      <p class="subtitle">This workflow has already been approved and is continuing execution.</p>
    `;
  }

  private renderApproved(data: ApprovalPageData): string {
    return `
      ${this.icon('success')}
      <h2>Approved</h2>
      <p class="subtitle">
        <strong>${this.esc(data.workflowName ?? '')}</strong> has been approved and is now continuing execution.
      </p>
      <p class="subtitle muted">You can close this tab.</p>
    `;
  }

  private renderPending(data: ApprovalPageData): string {
    const dataEntries = data.pendingData
      ? Object.entries(data.pendingData)
          .filter(([k]) => !k.startsWith('_'))
          .map(([k, v]) => `<div class="data-row"><span class="data-key">${this.esc(k)}</span><span class="data-value">${this.esc(String(v))}</span></div>`)
          .join('')
      : '';

    return `
      ${this.icon('waiting')}
      <h2>Approval Required</h2>
      <p class="subtitle">
        Workflow <strong>${this.esc(data.workflowName ?? '')}</strong> is waiting for your approval to continue.
      </p>
      <div class="meta">
        <span class="meta-item"><span class="meta-label">Workflow</span>${this.esc(data.workflowId?.slice(0, 8) ?? '')}</span>
        <span class="meta-item"><span class="meta-label">Step</span>${this.esc(data.stepName ?? '')}</span>
      </div>
      ${dataEntries ? `<div class="data-card">${dataEntries}</div>` : ''}
      <form method="POST" action="/approve/${this.esc(data.token ?? '')}">
        <button type="submit" class="btn-approve">Approve & Continue Workflow</button>
      </form>
    `;
  }

  private icon(type: 'waiting' | 'success' | 'error'): string {
    const svgs: Record<string, string> = {
      waiting: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />',
      success: '<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />',
      error: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />',
    };

    return `
      <div class="icon icon-${type}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">${svgs[type]}</svg>
      </div>
    `;
  }

  private esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private wrapInLayout(content: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SilkChart — Approval</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',system-ui,sans-serif;background:#0c0c10;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:#13131a;border:1px solid #2a2a3d;border-radius:12px;padding:40px;max-width:480px;width:100%;text-align:center}
    .brand{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:32px;font-size:13px;color:#64748b}
    .brand-logo{width:24px;height:24px;border-radius:6px;background:linear-gradient(135deg,#6366f1,#7c3aed);display:flex;align-items:center;justify-content:center}
    .brand-logo svg{width:14px;height:14px;color:white}
    .icon{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px}
    .icon svg{width:28px;height:28px}
    .icon-waiting{background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.3);color:#fb923c}
    .icon-success{background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);color:#34d399}
    .icon-error{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#f87171}
    h2{font-size:20px;font-weight:600;margin-bottom:8px;color:white}
    .subtitle{font-size:14px;color:#94a3b8;line-height:1.5}
    .subtitle strong{color:#e2e8f0}
    .subtitle.muted{margin-top:8px;font-size:12px;color:#64748b}
    .meta{display:flex;justify-content:center;gap:24px;margin-top:20px;padding:12px;background:#1a1a24;border-radius:8px;border:1px solid #22222e}
    .meta-item{display:flex;flex-direction:column;font-size:13px;font-family:'JetBrains Mono',monospace;color:#94a3b8}
    .meta-label{font-family:'Inter',sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin-bottom:2px}
    .data-card{margin-top:16px;padding:12px 16px;background:#1a1a24;border:1px solid #22222e;border-radius:8px;text-align:left}
    .data-row{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid #22222e;font-size:12px}
    .data-row:last-child{border-bottom:none}
    .data-key{color:#64748b;font-family:'JetBrains Mono',monospace;flex-shrink:0}
    .data-value{color:#e2e8f0;text-align:right;word-break:break-word}
    .btn-approve{margin-top:24px;width:100%;padding:12px 24px;font-size:14px;font-weight:600;background:#ea580c;color:white;border:none;border-radius:8px;cursor:pointer;transition:background 0.2s;font-family:'Inter',sans-serif}
    .btn-approve:hover{background:#f97316}
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">
      <div class="brand-logo">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      </div>
      SilkChart Workflow Engine
    </div>
    ${content}
  </div>
</body>
</html>`;
  }
}
