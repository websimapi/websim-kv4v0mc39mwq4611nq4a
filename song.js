import { Midi } from '@tonejs/midi';

export async function loadSong() {
    const midi = await Midi.fromUrl('./beethoven_fifth_op67.mid');
    const notes = [];
    let idCounter = 0;

    // Merge notes from all tracks
    midi.tracks.forEach(track => {
        track.notes.forEach(note => {
            notes.push({
                id: idCounter++,
                time: note.time,
                column: note.midi % 4, // Simple mapping from pitch to column
                duration: note.duration
            });
        });
    });

    // Sort all notes by time
    notes.sort((a, b) => a.time - b.time);

    // Filter out notes that are too close to each other to be playable, but allow chords
    const filteredNotes = [];
    if (notes.length > 0) {
        const timeThreshold = 0.05; // 50ms
        let lastTime = -1;

        for (let i = 0; i < notes.length; i++) {
            const note = notes[i];
            if (note.time - lastTime > timeThreshold) {
                filteredNotes.push(note);
                lastTime = note.time;
            } else { // It's a chord with a previous note
                // Check if this column is already used in this chord
                const isColumnUsed = filteredNotes.some(n => n.time === note.time && n.column === note.column);
                if (!isColumnUsed) {
                    filteredNotes.push(note);
                }
            }
        }
    }

    return filteredNotes;
}