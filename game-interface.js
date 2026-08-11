(() => {
  let muted = false;
  let paused = false;
  let focused = !document.hidden;
  const callbacks = { offset: [], mute: [], pause: [], focus: [] };
  const offsets = { left: 0, top: 0, right: 0, bottom: 0 };
  const resolvedAd = { isRewardGranted: false, adDidLoad: false, adDidShow: false };
  const storage = {
    getItem: key => localStorage.getItem(String(key)),
    setItem: (key, value) => localStorage.setItem(String(key), String(value)),
    removeItem: key => localStorage.removeItem(String(key)),
    clear: () => localStorage.clear()
  };
  const noop = () => Promise.resolve();
  const setFocus = value => {
    const next = !!value;
    if (focused === next) return;
    focused = next;
    callbacks.focus.forEach(fn => fn(focused, true));
  };
  const api = {
    init: items => Promise.resolve(Array.isArray(items) && typeof items[1] === 'function' ? items[1]() : undefined),
    log: (...args) => console.log('[Dye Hard]', ...args),
    track: noop,
    hasFeature: feature => ['standalone', 'audio', 'progress', 'score', 'storage'].includes(String(feature)),
    getFeatureProperties: () => ({}),
    getCurrentLanguage: () => (navigator.language || 'en').slice(0, 2),
    sendPreloadProgress: () => {},
    sendScore: noop,
    gameReady: noop,
    gameStart: noop,
    gameQuit: noop,
    gamePause: () => { paused = true; return Promise.resolve(); },
    gameResume: () => { paused = false; return Promise.resolve(); },
    gameMuted: value => { muted = !!value; return Promise.resolve(); },
    isMuted: () => muted,
    isPaused: () => paused,
    isFocused: () => focused,
    setMuted: value => { muted = !!value; callbacks.mute.forEach(fn => fn(muted, true)); },
    setPaused: value => { paused = !!value; callbacks.pause.forEach(fn => fn(paused, true)); },
    setFocused: setFocus,
    showInterstitialAd: () => Promise.resolve(resolvedAd),
    showRewardedAd: () => Promise.resolve(resolvedAd),
    isRewardedAdAvailable: () => false,
    hasRewardedAd: () => Promise.resolve(false),
    onMuteStateChange: fn => { if (typeof fn === 'function') callbacks.mute.push(fn); },
    onPauseStateChange: fn => { if (typeof fn === 'function') callbacks.pause.push(fn); },
    onFocusStateChange: fn => { if (typeof fn === 'function') callbacks.focus.push(fn); },
    onOffsetChange: fn => { if (typeof fn === 'function') { callbacks.offset.push(fn); fn(offsets); } },
    getOffsets: () => offsets,
    storage,
    iap: { getProducts: async () => [], buyProduct: async () => null, consumeProduct: async () => null, onEvent: () => {} }
  };
  const fallback = prop => {
    const name = String(prop);
    if (/^(is|has|can|should)[A-Z_]/.test(name)) return () => false;
    if (/^get[A-Z_]/.test(name)) return () => null;
    if (/^show[A-Z_]/.test(name)) return () => Promise.resolve(resolvedAd);
    return noop;
  };
  const safeApi = new Proxy(api, { get(target, prop) { return prop in target ? target[prop] : fallback(prop); } });
  document.addEventListener('visibilitychange', () => setFocus(!document.hidden), { passive: true });
  window.addEventListener('focus', () => setFocus(true), { passive: true });
  window.addEventListener('blur', () => setFocus(false), { passive: true });
  window.GameInterface = window.gameInterface = safeApi;
  window.famobi = {
    setPreloadProgress: safeApi.sendPreloadProgress,
    gameReady: safeApi.gameReady,
    hasFeature: safeApi.hasFeature,
    getFeatureProperties: safeApi.getFeatureProperties,
    getCurrentLanguage: safeApi.getCurrentLanguage,
    getOffsets: safeApi.getOffsets,
    onOffsetChange: safeApi.onOffsetChange,
    showInterstitialAd: (_event, done) => { if (typeof done === 'function') done(); return Promise.resolve(resolvedAd); },
    showAd: done => { if (typeof done === 'function') done(); return Promise.resolve(resolvedAd); },
    rewardedAd: done => { if (typeof done === 'function') done({ rewardGranted: false }); return Promise.resolve(resolvedAd); },
    hasRewardedAd: () => false,
    ads: { isEnabled: () => false, hasCooledDown: () => false },
    localStorage: storage,
    log: safeApi.log
  };
  window.famobi_analytics = { trackEvent: () => Promise.resolve() };
  window.famobi_tracking = { trackEvent: () => Promise.resolve() };
})();