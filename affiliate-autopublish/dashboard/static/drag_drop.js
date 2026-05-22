/* ════════════════════════════════════════════════════════════
 *  Drag & Drop Multi-File Upload
 *  Drop multiple videos at once → batch queue
 * ════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  setupDropZone();
});

function setupDropZone() {
  const card = document.querySelector('#tab-multi .card');
  if (!card) return;

  // Add visual drop zone wrapper
  const dropZone = document.createElement('div');
  dropZone.className = 'drop-zone';
  dropZone.innerHTML = `
    <div class="drop-icon">📥</div>
    <p class="drop-msg">Drop videos here or click to select</p>
    <p class="drop-sub">MP4, MOV, WEBM · up to 100 MB each · batch supported</p>
  `;

  const fileInput = document.getElementById('mp-video-file');
  if (fileInput && fileInput.parentNode) {
    fileInput.parentNode.insertBefore(dropZone, fileInput);
    fileInput.style.display = 'none';
  }

  dropZone.addEventListener('click', () => fileInput?.click());

  ['dragenter', 'dragover'].forEach(ev => {
    dropZone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(ev => {
    dropZone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'));
    if (files.length === 0) {
      if (window.toast) toast('No videos', 'Drop video files only', 'warn');
      return;
    }
    handleMultipleFiles(files);
  });
}

async function handleMultipleFiles(files) {
  if (files.length === 1) {
    // Single file → use existing single upload flow
    const fileInput = document.getElementById('mp-video-file');
    if (fileInput) {
      const dt = new DataTransfer();
      dt.items.add(files[0]);
      fileInput.files = dt.files;
      fileInput.dispatchEvent(new Event('change'));
    }
    return;
  }

  if (window.toast) {
    toast(`Batch upload`, `${files.length} videos queued`, 'info', 4000);
  }

  // Multiple files → batch upload + create entries
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fd = new FormData();
    fd.append('video', file);
    try {
      const r = await fetch('/api/multi-platform/upload', { method: 'POST', body: fd });
      const data = await r.json();
      results.push({ file: file.name, ok: true, data });
      if (window.toast) toast(`Uploaded ${i + 1}/${files.length}`, file.name, 'success', 2000);
    } catch (err) {
      results.push({ file: file.name, ok: false, error: err.message });
      if (window.toast) toast(`Failed ${i + 1}/${files.length}`, file.name, 'error', 3000);
    }
  }

  renderBatchResults(results);
}

function renderBatchResults(results) {
  let panel = document.getElementById('batch-results');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'batch-results';
    panel.className = 'card';
    document.querySelector('#tab-multi').appendChild(panel);
  }

  panel.innerHTML = `
    <h3>📦 Batch upload — ${results.length} videos</h3>
    <p style="opacity:0.7">Each video can now be configured and scheduled individually.</p>
    <table style="width:100%;border-collapse:collapse;margin-top:12px">
      <thead>
        <tr><th>File</th><th>Status</th><th>Size</th><th>Action</th></tr>
      </thead>
      <tbody>
        ${results.map((r, i) => `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.06)">
            <td style="padding:8px 4px">${r.file}</td>
            <td>${r.ok ? '✅ Ready' : '❌ ' + (r.error || 'failed')}</td>
            <td>${r.data?.size_mb || '—'} MB</td>
            <td>
              ${r.ok ? `<button class="btn-secondary" onclick="useBatchVideo(${i})">Configure</button>` : ''}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  // Store for later use
  window._batchResults = results;
}

window.useBatchVideo = function (idx) {
  const r = window._batchResults?.[idx];
  if (!r || !r.ok) return;
  window.mpUploadedVideo = r.data;
  const preview = document.getElementById('mp-video-preview');
  if (preview) preview.innerHTML = `<video src="${r.data.video_url}" controls style="max-width:300px;border-radius:8px"></video>`;
  document.getElementById('mp-product-card').style.display = 'block';
  document.getElementById('mp-product-card').scrollIntoView({behavior:'smooth'});
};
