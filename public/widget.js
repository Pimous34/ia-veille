
(function() {
  const script = document.currentScript;
  const tenantId = script.getAttribute('data-tenant-id') || 'oreegami';
  
  // 🛡️ RECURSION GUARD: Do not load if inside the embed page
  if (window.location.href.includes('/embed')) return;

  // Check if we are in dev (localhost) or prod
  // For now, assuming the script is served from the same domain as the iframe for this test
  // Ideally this URL is hardcoded to the production URL, e.g. https://ia-veille.vercel.app/embed
  const baseUrl = new URL(script.src).origin; 
  const iframeUrl = `${baseUrl}/embed?tenantId=${tenantId}`;
  
  const iframe = document.createElement('iframe');
  iframe.src = iframeUrl;
  iframe.style.position = 'fixed';
  iframe.style.bottom = '16px'; // 1rem
  iframe.style.right = '16px';
  iframe.style.width = '80px'; // Button size initially
  iframe.style.height = '80px';
  iframe.style.border = 'none';
  iframe.style.zIndex = '2147483647'; // Max z-index
  iframe.style.transition = 'width 0.3s ease, height 0.3s ease';
  iframe.style.background = 'transparent';
  iframe.setAttribute('allow', 'clipboard-write'); // Allow copy paste
  
  document.body.appendChild(iframe);
  
  // Listen for resize messages from the iframe
  window.addEventListener('message', (event) => {
    // Security check: ideally check event.origin matches baseUrl
    if (event.data && event.data.type === 'OREEGAMI_CHAT_RESIZE') {
      if (event.data.isOpen) {
        // Expand
        if (window.innerWidth < 640) {
            // Mobile: Full screen
             iframe.style.width = '100vw';
             iframe.style.height = '100vh';
             iframe.style.bottom = '0';
             iframe.style.right = '0';
             iframe.style.borderRadius = '0';
        } else {
             // Desktop: Widget size
             iframe.style.width = '420px'; // Slightly larger than internal 400px to avoid scrollbars
             iframe.style.height = '650px';
        }
      } else {
        // Collapse to button
        iframe.style.width = '80px';
        iframe.style.height = '80px';
        iframe.style.bottom = '16px';
        iframe.style.right = '16px';
      }
    }
  });
})();
