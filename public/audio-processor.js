/**
 * RNNoise AudioWorklet processor placeholder.
 * In production, replace this with the actual RNNoise WASM processor.
 * For MVP, this is a pass-through processor that allows the worklet to load
 * without errors while browser's built-in noise suppression handles audio cleanup.
 */
class RNNoiseProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    for (let channel = 0; channel < output.length; channel++) {
      if (input[channel]) {
        output[channel].set(input[channel]);
      }
    }
    return true;
  }
}

registerProcessor('rnnoise-processor', RNNoiseProcessor);
