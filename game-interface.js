(() => {
  let muted = false;
  let paused = false;
  const callbacks = { offset: [], mute: [], pause: [] };
  const offsets = { left: 0, top: 0, right: 0, bottom: 0 };
  const storage = {
    getItem: key => localStorage.getItem(String(key)),
    setItem: (key, value) => localStorage.setItem(String(key), String(value)),
    removeItem: key => localStorage.removeItem(String(key)),
    clear: () => localStorage.clear()
  };
  const resolvedAd = { isRewardGranted: false, adDidLoad: false, adDidShow: false };
  const noop = () => Promise.resolve();
  const api = {
    init: items => Promise.resolve(Array.isArray(items) && typeof items[1] === 'function' ? items[1]() : undefined),
    log: (...args) => console.log('[Dye Hard]', ...args),
    track: noop,
    hasFeature: feature => ['standalone', 'audio', 'pause', 'progress', 'storage'].includes(feature),
    getCurrentLanguage: () => (navigator.language || 'en').slice(0, 2),
    sendPreloadProgress: () => {},
    sendScore: noop,
    gameReady: noop,
    gameStart: noop,
    gameQuit: noop,
    gamePause: () => { paused = true; callbacks.pause.forEach(fn => fn(paused, false)); return Promise.resolve(); },
    gameResume: () => { paused = false; callbacks.pause.forEach(fn => fn(paused, false)); return Promise.resolve(); },
    gameMuted: value => { muted = !!value; callbacks.mute.forEach(fn => fn(muted, false)); return Promise.resolve(); },
    isMuted: () => muted,
    isPaused: () => paused,
    setMuted: value => { muted = !!value; callbacks.mute.forEach(fn => fn(muted, true)); },
    setPaused: value => { paused = !!value; callbacks.pause.forEach(fn => fn(paused, true)); },
    showInterstitialAd: () => Promise.resolve(resolvedAd),
    showRewardedAd: () => Promise.resolve(resolvedAd),
    isRewardedAdAvailable: () => false,
    onMuteStateChange: fn => { if (typeof fn === 'function') callbacks.mute.push(fn); },
    onPauseStateChange: fn => { if (typeof fn === 'function') callbacks.pause.push(fn); },
    onOffsetChange: fn => { if (typeof fn === 'function') { callbacks.offset.push(fn); fn(offsets); } },
    getOffsets: () => offsets,
    storage,
    iap: { getProducts: async () => [], buyProduct: async () => null, consumeProduct: async () => null, onEvent: () => {} }
  };
  const safeApi = new Proxy(api, { get(target, prop) { return prop in target ? target[prop] : noop; } });
  window.GameInterface = window.gameInterface = safeApi;
  window.famobi = {
    setPreloadProgress: safeApi.sendPreloadProgress,
    gameReady: safeApi.gameReady,
    hasFeature: safeApi.hasFeature,
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