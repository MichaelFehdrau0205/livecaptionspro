/**
 * RNNoise AudioWorklet Processor (ES module)
 *
 * Imports the @jitsi/rnnoise-wasm sync JS glue from /rnnoise-sync.js,
 * which in turn fetches /rnnoise.wasm. Falls back to pass-through if
 * either file is unavailable.
 *
 * Load this worklet with:
 *   ctx.audioWorklet.addModule('/audio-processor.js', { type: 'module' })
 *
 * RNNoise expects 480 Float32 samples per frame (10ms at 48kHz),
 * scaled to the [-32768, 32767] range. Web Audio delivers 128-sample
 * blocks, so we buffer until we have enough for a full frame.
 */

import createRNNWasmModuleSync from '/rnnoise-sync.js';

const FRAME_SIZE = 480;

class RNNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._ready  = false;
    this._module = null;
    this._state  = 0;
    this._inPtr  = 0;
    this._outPtr = 0;
    this._pending = new Float32Array(0);

    this._init();
  }

  async _init() {
    try {
      const m = await createRNNWasmModuleSync();
      await m.ready;

      this._state  = m._rnnoise_create(0);
      this._inPtr  = m._malloc(FRAME_SIZE * 4);   // Float32 = 4 bytes
      this._outPtr = m._malloc(FRAME_SIZE * 4);
      this._module = m;
      this._ready  = true;
    } catch {
      // WASM unavailable — pass-through mode
    }
  }

  _processFrame(inputF32, outputF32) {
    const m      = this._module;
    const HEAPF32 = m.HEAPF32;
    const inOff  = this._inPtr  / 4;
    const outOff = this._outPtr / 4;

    // Scale Float32 [-1, 1] → RNNoise range [-32768, 32767]
    for (let i = 0; i < FRAME_SIZE; i++) {
      HEAPF32[inOff + i] = inputF32[i] * 32768;
    }

    m._rnnoise_process_frame(this._state, this._outPtr, this._inPtr);

    // Scale back → Float32 [-1, 1]
    for (let i = 0; i < FRAME_SIZE; i++) {
      outputF32[i] = HEAPF32[outOff + i] / 32768;
    }
  }

  process(inputs, outputs) {
    const inputChannel  = inputs[0]?.[0];
    const outputChannel = outputs[0]?.[0];

    if (!inputChannel || !outputChannel) return true;

    if (!this._ready) {
      outputChannel.set(inputChannel);
      return true;
    }

    // Buffer 128-sample blocks into 480-sample RNNoise frames
    const combined = new Float32Array(this._pending.length + inputChannel.length);
    combined.set(this._pending);
    combined.set(inputChannel, this._pending.length);

    let offset = 0;
    const processed = new Float32Array(combined.length);

    while (offset + FRAME_SIZE <= combined.length) {
      const frameIn  = combined.subarray(offset, offset + FRAME_SIZE);
      const frameOut = new Float32Array(FRAME_SIZE);
      this._processFrame(frameIn, frameOut);
      processed.set(frameOut, offset);
      offset += FRAME_SIZE;
    }

    this._pending = combined.subarray(offset);
    outputChannel.set(processed.subarray(0, outputChannel.length));

    return true;
  }
}

registerProcessor('rnnoise-processor', RNNoiseProcessor);
