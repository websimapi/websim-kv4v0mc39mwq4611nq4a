import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';

class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {};

        this.synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'fmtriangle' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 1 }
        }).toDestination();
        this.midi = null;
    }

    async loadSound(name, url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.sounds[name] = audioBuffer;
    }

    async loadAssets() {
        await Promise.all([
            this.loadSound('hit', './hit.mp3'),
            this.loadSound('miss', './miss.mp3'),
        ]);

        this.midi = await Midi.fromUrl('./beethoven_fifth_op67.mid');
        this.prepareMidiPlayback();
    }

    prepareMidiPlayback() {
        if (!this.midi) return;
        
        this.midi.tracks.forEach(track => {
            // Schedule all notes to be played by the synth
            track.notes.forEach(note => {
                this.synth.triggerAttackRelease(
                    note.name,
                    note.duration,
                    note.time,
                    note.velocity
                );
            });
        });
    }

    playSound(name) {
        if (!this.sounds[name] || this.audioContext.state === 'suspended') return;
        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[name];
        source.connect(this.audioContext.destination);
        source.start(0);
    }

    async playMusic() {
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        Tone.Transport.start();
    }

    stopMusic() {
        Tone.Transport.stop();
        // Cancel all scheduled events to prevent them from playing again on restart
        Tone.Transport.cancel(0);
    }

    getCurrentTime() {
        return Tone.Transport.seconds;
    }
}

export default AudioManager;