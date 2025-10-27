import { Assets, Audio, Mapping, Randomness } from "#framework";
import { PositionalAudio, Euler } from "three";

export default class AudioEmitter {
	constructor( listener, target, { rolloff = 1, refDistance = 1, maxDistance = 10, filter = undefined } = {} ){

		Object.assign(this, {
			instance: new PositionalAudio(listener),
			listener,
			target,
			startedAt: 0,
			pausedAt: 0,
			isActive: false,
			isPaused: false,
			rolloff,
			refDistance,
			maxDistance,
			filter
		});

		return this;

	}
	get isPlaying(){

		return !this.isPaused;

	}
	get duration(){

		return this.instance?.duration ?? 0;

	}
	get elapsed(){

		const currentTime = this.isPaused ? this.pausedAt : (this.instance?.context.currentTime ?? 0);

		const currentTimeElapsed = currentTime - this.startedAt;

		return currentTimeElapsed > 0 ? currentTimeElapsed : this.instance?.offset ?? 0;

	}
	get remaining(){

		const { elapsed, duration } = this;

		return Math.max(0, (duration - elapsed)) ?? 0;

	}
	get progress(){

		const { elapsed, duration } = this;

		return (Mapping.clamp(elapsed / duration, 0, 1)) || 0;

	}
	setTarget( target ){

		this.target = target;

		if( this.instance ) this.target.add(this.instance);

	}
	async play( source, { name = null, paused = false, seek = 0, duration = undefined, volume = 1, repeat = false, onEnded = null } = {} ){

		// Resume
		if( !source && this.isPaused ){

			this.startedAt = this.instance.context.currentTime - this.elapsed;
			this.isPaused = false;
			this.instance.play();

			return this;

		}

		this.stop();

		if( source ) this.source = await Assets.loadSound(source, name);

		const { metadata, audioBuffer } = this.source;

		if( metadata?.[name] ){

			const random = Randomness.randomArrayValue(metadata[name]);
			seek = random.start - 0.01;
			duration = random.end - random.start;

		}
		else if( !duration ){

			duration = audioBuffer.duration;

		}

		if( !this.instance ){

			this.instance = new PositionalAudio(this.listener);
			this.target.add(this.instance);

		}

		this.instance.offset = seek;
		this.instance.duration = duration;

		this.isActive = true;
		this.isPaused = paused;
		if( onEnded ) this.onEnded = onEnded;

		this.instance.setBuffer(audioBuffer);
		this.instance.setLoop(repeat);
		this.setVolume(volume);
		this.instance.setRolloffFactor(this.rolloff);
		this.instance.setRefDistance(this.refDistance);
		this.instance.setMaxDistance(this.maxDistance);
		this.instance.setFilter(this.filter);
		if( !paused ) this.instance.play();

		const { currentTime } = this.instance.context;
		this.startedAt = currentTime - seek;

		if( this.instance.source ){

			this.instance.source.onended = () => {
				this.stop();
				this.onEnded?.();
			};

		}

	}
	pause(){

		this.isPaused = true;
		this.pausedAt = this.instance?.context.currentTime ?? 0;
		this.instance?.pause();

	}
	seek( time ){

		if( !this.instance ) return false;

		const { buffer } = this.instance;

		if( !Number.isInteger(time) && time < 1 ) time *= buffer.duration;

		this.stop();
		this.play(null, { seek: time });

	}
	stop(){

		this.isActive = false;
		this.isPaused = false;

		if( this.instance ){

			this.instance.removeFromParent();
			this.instance.stop();
			this.instance.disconnect();
			
			if( this.instance.source ){
				this.instance.source.onended = null;
				this.instance.source?.disconnect();
				this.instance.source = null;
			}

			this.instance = null;

		}

	}
	setVolume( volume, delay = 0 ){

		this.volume = Math.max(0.0001, volume);

		const { currentTime } = this.instance.context;

		this.instance.gain.gain.setValueAtTime(this.volume, currentTime + delay);

	}
	rampVolume( volume, duration = 1, delay = 0 ){

		this.volume = Math.max(0.0001, volume);

		const { currentTime } = this.instance.context;

		console.log("ramp to ", currentTime + duration + delay)
		this.instance.gain.gain.exponentialRampToValueAtTime(this.volume, currentTime + duration + delay);

	}
	setFilter( filter ){

		this.filter = filter;
		this.instance?.setFilter(this.filter);

	}
}