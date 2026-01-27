// Stub for libsodium-sumo.mjs to prevent webpack bundling errors
// The actual libsodium will be loaded at runtime by libsodium-wrappers-sumo
// This stub provides a minimal interface to satisfy webpack's static analysis
// but allows libsodium-wrappers-sumo to load the real WASM module at runtime

// Export a default object that matches what libsodium-wrappers expects
// The actual loading happens inside libsodium-wrappers-sumo, which will
// dynamically load the WASM file at runtime
const stub = {
  ready: Promise.resolve(),
  _sodium: {
    // Provide a minimal _sodium object structure
    // The real initialization happens in libsodium-wrappers-sumo
    _sodium_init: function() {
      // This will be replaced by the real libsodium at runtime
      console.warn('libsodium stub: _sodium_init called before libsodium is loaded')
    }
  },
}

export default stub
