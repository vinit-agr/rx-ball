// Web Audio API sound generation
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

export function playTone(frequency: number, duration: number, type: OscillatorType = 'square', volume: number = 0.3): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    // Audio not supported or blocked
  }
}

export function playPaddleHit(): void {
  playTone(440, 0.1, 'square', 0.2);
}

export function playBrickHit(): void {
  playTone(660, 0.08, 'square', 0.25);
}

export function playBrickBreak(): void {
  playTone(880, 0.15, 'triangle', 0.3);
}

export function playExplosion(): void {
  const ctx = getAudioContext();
  try {
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    source.start();
  } catch (e) {}
}

export function playPowerUp(): void {
  playTone(523, 0.1, 'sine', 0.3);
  setTimeout(() => playTone(659, 0.1, 'sine', 0.3), 100);
  setTimeout(() => playTone(784, 0.15, 'sine', 0.3), 200);
}

export function playPowerDown(): void {
  playTone(400, 0.1, 'sawtooth', 0.2);
  setTimeout(() => playTone(300, 0.15, 'sawtooth', 0.2), 100);
}

export function playLifeLost(): void {
  playTone(300, 0.2, 'sawtooth', 0.3);
  setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.3), 200);
}

export function playLevelComplete(): void {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.3), i * 150);
  });
}

export function playGameOver(): void {
  const notes = [400, 350, 300, 250];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'sawtooth', 0.25), i * 200);
  });
}

export function playLaser(): void {
  playTone(1200, 0.05, 'square', 0.15);
}
