/**
 * AudioWorklet processor for Deepgram PCM streaming.
 * Captures Float32 audio samples from the mic and forwards them
 * to the main thread via postMessage for Int16 conversion + WebSocket send.
 */
class DeepgramPCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (channel?.length) {
      // Transfer a copy so the buffer isn't recycled before the main thread reads it
      this.port.postMessage(channel.slice());
    }
    return true; // keep processor alive
  }
}

registerProcessor('deepgram-pcm-processor', DeepgramPCMProcessor);
