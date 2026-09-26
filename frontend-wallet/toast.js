// toast.js — clean, high-contrast toast notification utility for OpenVyapar (Light Theme)

let toastContainer = null;

function getContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 64px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

const STYLES = {
  success: { bg: '#ffffff', border: '#bbf7d0', accent: '#059669', icon: '✓', text: '#065f46' },
  error:   { bg: '#ffffff', border: '#fecaca', accent: '#dc2626', icon: '✕', text: '#991b1b' },
  warning: { bg: '#ffffff', border: '#fde68a', accent: '#d97706', icon: '!', text: '#92400e' },
  info:    { bg: '#ffffff', border: '#bfdbfe', accent: '#2563eb', icon: 'i', text: '#1e40af' },
};

function dismiss(toast) {
  clearTimeout(toast._timer);
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(-10px)';
  setTimeout(() => toast.remove(), 250);
}

export function showToast(message, type = 'info', duration = 3500) {
  const c = STYLES[type] || STYLES.info;
  const container = getContainer();

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${c.bg};
    border: 1px solid ${c.border};
    border-left: 4px solid ${c.accent};
    border-radius: 8px;
    padding: 12px 16px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    min-width: 280px;
    max-width: 400px;
    pointer-events: all;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0,0,0,0.05);
    opacity: 0;
    transform: translateY(-8px);
    transition: opacity 0.2s ease, transform 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
    font-size: 0.85rem;
    color: #1e293b;
    line-height: 1.45;
    cursor: pointer;
  `;

  toast.innerHTML = `
    <span style="font-weight:700; color:${c.accent}; flex-shrink:0; font-size: 0.9rem; background:${c.border}; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">${c.icon}</span>
    <span style="flex:1; color: #1e293b; font-weight: 500;">${message}</span>
    <span style="font-size:1rem;color:#94a3b8;flex-shrink:0;line-height:1;margin-left:4px">×</span>
  `;

  toast.addEventListener('click', () => dismiss(toast));
  container.appendChild(toast);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }));

  toast._timer = setTimeout(() => dismiss(toast), duration);
  return toast;
}
