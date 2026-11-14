// Add new listing valadaions form script

(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })

  // Auto-carry active listing/booking context when clicking "AI Planner" in the navbar
  function syncNavbarPlannerLink() {
    const plannerLink = document.getElementById('wl-nav-ai-planner');
    const ctx = document.getElementById('wl-chat-context');
    if (!plannerLink || !ctx) return;

    const params = new URLSearchParams();
    const bookingId = (ctx.dataset.bookingId || '').trim();
    const listingId = (ctx.dataset.listingId || '').trim();

    if (bookingId) {
      params.set('bookingId', bookingId);
    } else if (listingId) {
      params.set('listingId', listingId);

      // If user already chose dates on the booking page, forward the exact nights
      const checkInEl = document.querySelector('input[name="booking[checkIn]"]');
      const checkOutEl = document.querySelector('input[name="booking[checkOut]"]');
      if (checkInEl && checkOutEl && checkInEl.value && checkOutEl.value) {
        const diff = Math.ceil((new Date(checkOutEl.value) - new Date(checkInEl.value)) / 86400000);
        if (Number.isFinite(diff) && diff >= 1 && diff <= 14) {
          params.set('days', String(diff));
        }
      } else if (ctx.dataset.days) {
        params.set('days', ctx.dataset.days);
      }
    }

    const qs = params.toString();
    plannerLink.href = qs ? `/itineraries/new?${qs}` : '/itineraries/new';
  }

  document.addEventListener('DOMContentLoaded', () => {
    syncNavbarPlannerLink();
    document.addEventListener('change', (e) => {
      if (e.target && e.target.name && (e.target.name === 'booking[checkIn]' || e.target.name === 'booking[checkOut]')) {
        syncNavbarPlannerLink();
      }
    });
  });
})();

// Track geolocation permission state when supported so prompts stay visible on the active tab
let wlGeoPermissionState = 'unknown';
let wlLastKnownLocation = null;

if (typeof navigator !== 'undefined' && navigator.permissions && typeof navigator.permissions.query === 'function') {
  navigator.permissions.query({ name: 'geolocation' })
    .then((status) => {
      wlGeoPermissionState = status.state;
      status.addEventListener('change', () => {
        wlGeoPermissionState = status.state;
      });
    })
    .catch(() => {});
}

// Show an on-page overlay for geolocation status, "Turn on your location", or a 1-click Maps button
function wlShowLocationStatusModal({ title, message, isError = false, mapsUrl = null, mapsLabel = 'Open Google Maps', onRetry = null, onClose = null }) {
  let modal = document.getElementById('wl-location-status-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'wl-location-status-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:1090;background:rgba(15,23,42,0.52);display:flex;align-items:center;justify-content:center;padding:16px;';
    document.body.appendChild(modal);
  }

  modal.innerHTML = '';
  const card = document.createElement('div');
  card.style.cssText = 'background:#fff;border-radius:16px;max-width:420px;width:100%;padding:22px;box-shadow:0 18px 45px rgba(0,0,0,0.22);font-family:system-ui,-apple-system,sans-serif;';

  const heading = document.createElement('h5');
  heading.style.cssText = `margin:0 0 8px;font-weight:700;font-size:1.08rem;color:${isError ? '#dc2626' : '#111827'};`;
  heading.textContent = title;

  const body = document.createElement('p');
  body.style.cssText = 'margin:0 0 16px;font-size:0.93rem;color:#4b5563;line-height:1.45;';
  body.textContent = message;

  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;';

  if (mapsUrl) {
    const openLink = document.createElement('a');
    openLink.href = mapsUrl;
    openLink.target = '_blank';
    openLink.rel = 'noopener noreferrer';
    openLink.className = 'btn btn-danger btn-sm rounded-pill px-3 fw-semibold';
    openLink.textContent = mapsLabel;
    openLink.addEventListener('click', () => modal.remove());
    actions.appendChild(openLink);
  }

  if (typeof onRetry === 'function') {
    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'btn btn-danger btn-sm rounded-pill px-3 fw-semibold';
    retryBtn.textContent = 'Try Again';
    retryBtn.addEventListener('click', () => {
      modal.remove();
      onRetry();
    });
    actions.appendChild(retryBtn);
  }

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'btn btn-outline-secondary btn-sm rounded-pill px-3';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', () => {
    modal.remove();
    if (typeof onClose === 'function') onClose();
  });
  actions.appendChild(closeBtn);

  card.appendChild(heading);
  card.appendChild(body);
  card.appendChild(actions);
  modal.appendChild(card);
}

function wlCloseLocationStatusModal() {
  const modal = document.getElementById('wl-location-status-modal');
  if (modal) modal.remove();
}

// Acquire device coordinates in the foreground tab with getCurrentPosition + watchPosition fallback
function wlAcquireCurrentPosition({ onSuccess, onError }) {
  const now = Date.now();
  if (wlLastKnownLocation && (now - wlLastKnownLocation.ts) < 300000) {
    onSuccess(wlLastKnownLocation.lat, wlLastKnownLocation.lng);
    return () => {};
  }

  let finished = false;
  let watchId = null;
  let watchTimer = null;

  function cleanup() {
    if (watchId !== null && navigator.geolocation.clearWatch) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    if (watchTimer) {
      clearTimeout(watchTimer);
      watchTimer = null;
    }
  }

  function succeed(pos) {
    if (finished) return;
    finished = true;
    cleanup();
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    wlLastKnownLocation = { lat, lng, ts: Date.now() };
    onSuccess(lat, lng);
  }

  function fail(err) {
    if (finished) return;
    finished = true;
    cleanup();
    onError(err || { code: 2 });
  }

  function startWatchFallback(lastErr) {
    if (finished || typeof navigator.geolocation.watchPosition !== 'function') {
      fail(lastErr);
      return;
    }
    let latestErr = lastErr;
    watchId = navigator.geolocation.watchPosition(
      succeed,
      (err) => {
        latestErr = err;
        if (err && err.code === 1) fail(err);
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 300000 }
    );
    watchTimer = setTimeout(() => fail(latestErr), 6000);
  }

  // Stage 1: standard network/OS position (accepts up to 5-min cached Windows location)
  navigator.geolocation.getCurrentPosition(
    succeed,
    (err) => {
      if (finished) return;
      if (err && err.code === 1) {
        fail(err);
        return;
      }
      // Stage 2: POSITION_UNAVAILABLE (2) or TIMEOUT (3) -> retry via watchPosition
      startWatchFallback(err);
    },
    { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
  );

  return () => {
    finished = true;
    cleanup();
  };
}

// Shared helper to open Google Maps directions from the user's present location
window.wlOpenMapsDirections = function wlOpenMapsDirections({ lng, lat, waypoints = [], travelMode = 'driving' }) {
  const destLat = Number(lat);
  const destLng = Number(lng);
  if (!Number.isFinite(destLat) || !Number.isFinite(destLng)) return;

  const mode = travelMode === 'walking' ? 'walking' : (travelMode === 'transit' ? 'transit' : 'driving');
  const retryCall = () => wlOpenMapsDirections({ lng, lat, waypoints, travelMode });

  function buildMapsUrl(originLat, originLng) {
    const params = new URLSearchParams({
      api: '1',
      destination: `${destLat},${destLng}`,
      travelmode: mode
    });
    if (Number.isFinite(originLat) && Number.isFinite(originLng)) {
      params.set('origin', `${originLat},${originLng}`);
    }
    if (Array.isArray(waypoints) && waypoints.length > 0) {
      const wpStr = waypoints
        .filter((w) => Array.isArray(w) && w.length >= 2 && Number.isFinite(Number(w[0])) && Number.isFinite(Number(w[1])))
        .map((w) => `${Number(w[1])},${Number(w[0])}`)
        .join('|');
      if (wpStr) params.set('waypoints', wpStr);
    }
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  if (!window.isSecureContext || !navigator.geolocation || typeof navigator.geolocation.getCurrentPosition !== 'function' || wlGeoPermissionState === 'denied') {
    wlShowLocationStatusModal({
      title: 'Turn on your location',
      message: 'Turn on your location for to redirect. Please allow location access in your browser and Windows Location settings, then click Try Again.',
      isError: true,
      onRetry: retryCall
    });
    return;
  }

  let cancelAcquisition = () => {};

  // Keep user on the active foreground tab while acquiring coordinates so Edge/Chrome never throttle geolocation or hide prompts
  wlShowLocationStatusModal({
    title: 'Getting your present location...',
    message: 'Fetching your present location so we can open Google Maps directions. If prompted by your browser, click Allow.',
    onClose: () => cancelAcquisition()
  });

  cancelAcquisition = wlAcquireCurrentPosition({
    onSuccess: (originLat, originLng) => {
      wlCloseLocationStatusModal();
      const url = buildMapsUrl(originLat, originLng);
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened || opened.closed) {
        wlShowLocationStatusModal({
          title: 'Present location ready',
          message: `Detected location (${originLat.toFixed(4)}, ${originLng.toFixed(4)}). Click below to open Google Maps directions.`,
          mapsUrl: url,
          mapsLabel: 'Open Google Maps'
        });
      }
    },
    onError: (err) => {
      const isDenied = err && err.code === 1;
      if (isDenied) {
        wlShowLocationStatusModal({
          title: 'Turn on your location',
          message: 'Turn on your location for to redirect. Location permission is currently blocked—please enable it in your browser/device settings and try again.',
          isError: true,
          onRetry: retryCall
        });
        return;
      }

      // Permission is ON, but Windows/network couldn't compute a GPS/Wi-Fi coordinate fix (POSITION_UNAVAILABLE / TIMEOUT)
      const fallbackUrl = buildMapsUrl(null, null);
      wlShowLocationStatusModal({
        title: 'Unable to detect exact GPS/Wi-Fi fix',
        message: 'Location access is ON, but your device could not pinpoint coordinates right now (no GPS / Wi-Fi fix). You can try again, or open Google Maps directly to pick/use your location there.',
        isError: true,
        mapsUrl: fallbackUrl,
        mapsLabel: 'Open Google Maps',
        onRetry: retryCall
      });
    }
  });
};

// Sync active tab for Mobile Bottom Navigation Bar (10+ Year Mobile Lead)
document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname.toLowerCase();
  const bottomTabs = document.querySelectorAll(".bottom-nav-tab");
  if (!bottomTabs.length) return;

  bottomTabs.forEach((tab) => {
    const tabPath = (tab.getAttribute("data-path") || "").toLowerCase();
    if (!tabPath) return;

    let isMatch = false;
    if (tabPath === "/listings") {
      isMatch = currentPath === "/" || currentPath.startsWith("/listings");
    } else {
      isMatch = currentPath.startsWith(tabPath);
    }

    if (isMatch) {
      bottomTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
    }
  });
});
