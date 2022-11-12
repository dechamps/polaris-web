import { markRaw, Ref, ref, toRaw, watch } from "vue";
import { defineStore, acceptHMRUpdate } from "pinia";
import { flatten, getPlaylist } from "@/api/endpoints";
import { save, load } from "@/disk";
import { Song } from "@/api/dto";
import { useUserStore } from "@/stores/user";

export const usePlaylistStore = defineStore("playlist", () => {
	const name = ref("");
	const songs: Ref<Song[]> = ref(markRaw([]));
	const currentTrack: Ref<Song | null> = ref(null);
	const playbackOrder = ref("default"); // TODO should be an enum, not nullable
	const elapsedSeconds = ref(0);

	reset();

	const userStore = useUserStore();
	watch(
		() => userStore.isLoggedIn,
		() => {
			if (userStore.isLoggedIn) {
				loadFromDisk();
			} else {
				reset();
			}
		},
		{ immediate: true }
	);

	function advance(delta: number): Song | null {
		const order = playbackOrder.value;
		const tracks = songs.value;
		const numTracks = tracks.length;

		let newTrack = null;
		if (numTracks > 0) {
			if (order == "random") {
				const newTrackIndex = Math.floor(Math.random() * numTracks);
				newTrack = tracks[newTrackIndex];
			} else if (order == "repeat-track") {
				newTrack = currentTrack.value;
			} else {
				const rawCurrentTrack = toRaw(currentTrack.value);
				let currentTrackIndex = -1;
				if (rawCurrentTrack) {
					currentTrackIndex = tracks.indexOf(rawCurrentTrack);
				}

				if (currentTrackIndex < 0) {
					newTrack = tracks[0];
				} else {
					const newTrackIndex = currentTrackIndex + delta;
					if (newTrackIndex >= 0 && newTrackIndex < numTracks) {
						newTrack = tracks[newTrackIndex];
					} else if (order == "repeat-all") {
						if (delta > 0) {
							newTrack = tracks[0];
						} else {
							newTrack = tracks[numTracks - 1];
						}
					}
				}
			}
		}

		if (newTrack != null) {
			currentTrack.value = newTrack;
			elapsedSeconds.value = 0;
		}

		return newTrack;
	}

	function clear() {
		songs.value = markRaw([]);
		name.value = "";
		savePlaylist();
	}

	function enqueue(tracks: Song[]) {
		songs.value = markRaw(songs.value.concat(tracks));
		if (!currentTrack.value && songs.value.length > 0) {
			currentTrack.value = songs.value[0];
		}
	}

	function loadFromDisk() {
		playbackOrder.value = load("playbackOrder") || "default";
		songs.value = markRaw(load("playlist") || []);
		currentTrack.value = songs.value[load("currentTrackIndex") || 0] || null;
		elapsedSeconds.value = load("elapsedSeconds") || 0;
		name.value = load("playlistName") || null;
	}

	function next(): Song | null {
		const advancedTo = advance(1);
		savePlaybackState();
		return advancedTo;
	}

	function play(track: Song) {
		if (track != currentTrack.value) {
			currentTrack.value = track;
			elapsedSeconds.value = 0;
		}
		savePlaybackState();
	}

	function previous(): Song | null {
		const advancedTo = advance(-1);
		savePlaybackState();
		return advancedTo;
	}

	async function queueDirectory(path: string) {
		const tracks = await flatten(path);
		enqueue(tracks);
		savePlaylist();
	}

	async function queuePlaylist(playlistName: string) {
		const playlistSongs: Song[] = await getPlaylist(playlistName);
		songs.value = markRaw(playlistSongs);
		name.value = playlistName;
		savePlaylist();
	}

	function queueTracks(tracks: Song[]) {
		enqueue(tracks);
		savePlaylist();
	}

	function removeTrack(track: Song) {
		const trackIndex = songs.value.indexOf(track);
		if (trackIndex >= 0) {
			let newSongs = [...songs.value];
			newSongs.splice(trackIndex, 1);
			songs.value = markRaw(newSongs);
		}
		savePlaylist();
	}

	function reset() {
		name.value = "";
		playbackOrder.value = "default";
		currentTrack.value = null;
		songs.value = markRaw([]);
		elapsedSeconds.value = 0;
	}

	function savePlaybackState() {
		const rawCurrentTrack = toRaw(currentTrack.value);
		let currentTrackIndex = -1;
		if (rawCurrentTrack) {
			currentTrackIndex = songs.value.indexOf(rawCurrentTrack);
		}

		save("currentTrackIndex", currentTrackIndex);
		save("playbackOrder", playbackOrder.value);
		save("elapsedSeconds", elapsedSeconds.value);
	}

	function savePlaylist() {
		if (save("playlist", songs.value)) {
			save("playlistName", name.value);
			savePlaybackState();
		}
	}

	function setElapsedSeconds(seconds: number) {
		elapsedSeconds.value = seconds;
		savePlaybackState();
	}

	function setName(newName: string) {
		name.value = newName;
		savePlaylist();
	}

	function setPlaybackOrder(order: string) {
		playbackOrder.value = order;
		savePlaybackState();
	}

	function shuffle() {
		let shuffled = [...songs.value];
		for (let i = shuffled.length - 1; i > 0; i--) {
			let j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		songs.value = markRaw(shuffled);
		savePlaylist();
	}

	return {
		currentTrack,
		elapsedSeconds,
		name,
		playbackOrder,
		songs,

		clear,
		next,
		play,
		previous,
		queueDirectory,
		queuePlaylist,
		queueTracks,
		removeTrack,
		setElapsedSeconds,
		setPlaybackOrder,
		setName,
		shuffle,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(usePlaylistStore, import.meta.hot));
}