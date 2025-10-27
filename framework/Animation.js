import Easings from "./Easings";

export default class Animation {
	constructor({ onStart, onUpdate, onComplete, keepAlive = false, paused = false, easing = Easings.linear } = {}){

		Object.assign(this, {
			tweens: new Array(),
			direction: +1,
			duration: 0,
			elapsed: 0,
			speed: 1,
			onStart,
			onUpdate,
			onComplete,
			started: false,
			running: !paused,
			paused,
			keepAlive,
			complete: false,
			defaultEasing: easing
		});

		return this;

	}
	play(){

		if( this.paused ){

			this.paused = false;
			this.update(0);

		}

		return this;

	}
	replay( delay = 0 ){

		this.elapsed = -delay;
		this.complete = false;
		this.started = false;

		for( const tween of this.tweens ) tween.complete = false;

		this.play();

	}
	pause(){

		this.paused = true;

		return this;

	}
	stop(){

		this.pause();
		this.elapsed = 0;

		return this;

	}
	finish(){

		this.stop();
		this.elapsed = this.duration;

		return this;

	}
	to( target, to, begin = null ){

		const properties = new Array();
		for( const key in to ){

			if( ["duration", "easing"].includes(key) ) continue;

			if( target[key] !== undefined ){

				properties.push({
					key,
					from: target[key],
					to: to[key]
				});

			}

		}

		const tween = Animation.generateTween(this, target, to, properties, begin);
		this.tweens.push(tween);

		this.duration = Math.max(0, this.duration, tween.duration + tween.begin);

		return this;

	}
	fromTo( target, from, to, begin ){

		const properties = new Array();

		for( const key in to ){

			if( ["duration", "easing"].includes(key) ) continue;

			if( from[key] !== undefined || target[key] !== undefined ){

				properties.push({
					key,
					from: from[key] ?? target[key],
					to: to[key]
				});

			}

		}

		const tween = Animation.generateTween(this, target, to, properties, begin);
		this.tweens.push(tween);

		this.duration = Math.max(0, this.duration, tween.duration + tween.begin);

		return this;

	}
	set( target, to, begin ){

		to.duration = 1;

		const properties = new Array();
		for( const key in to ){

			if( target[key] !== undefined ){

				properties.push({
					key,
					from: target[key],
					to: to[key]
				});

			}

		}

		const tween = Animation.generateTween(this, target, to, properties, begin);
		this.tweens.push(tween);

		this.duration = Math.max(this.duration, tween.begin + 1);

		return this;

	}
	do( action, begin ){

		const tween = Animation.generateTween(this, null, { duration: 1, onComplete: action }, [], begin);
		this.tweens.push(tween);

		this.duration = Math.max(this.duration, tween.begin + 1);

		return this;

	}
	reset(){

		this.tweens.length = 0;
		this.elapsed = 0;
		this.duration = 0;
		this.complete = false;

		return this;

	}
	reverse( direction = null ){

		if( direction === null ) direction = -this.direction;

		this.direction = direction ? +1 : -1;

		return this;

	}
	setSpeed( speed = 1 ){

		this.speed = speed;

	}
	update( deltaTime ){

		if( this.paused || (this.complete && !this.keepAlive) ){

			return false;

		}
		else if( !this.running ){

			this.running = true;

		}

		if( !this.started ){

			this.started = true;
			this.onStart?.();

		}

		this.elapsed = Math.min(this.duration, this.elapsed + ((deltaTime * this.speed) * this.direction));

		for( const tween of this.tweens ){

			// ignore if not yet reached or if complete (except if keepAlive)
			if( this.elapsed < tween.begin || tween.complete && !this.keepAlive ) continue;

			if( !tween.started ){

				tween.started = true;
				tween.onStart?.();

			}

			const progress = Math.max(0, Math.min(1, (this.elapsed - tween.begin) / tween.duration));

			if( progress == 1 ){
			
				tween.complete = true;
				tween.onComplete?.();

			}

			Animation.updateTween(tween, progress);

		}

		this.onUpdate?.(this.elapsed / this.duration);

		if( !this.complete && this.elapsed === this.duration ){

			this.complete = true;
			if( !this.keepAlive ) this.running = false;

			this.onComplete?.();

		}

	}
	static generateTween( instance, target, to, properties, begin ){

		return {
			begin: begin ?? instance.duration,
			started: false,
			complete: false,
			target,
			duration: to.duration ?? 1000,
			properties,
			easing: to.easing ?? instance.defaultEasing,
			onStart: to.onStart,
			onUpdate: to.onUpdate,
			onComplete: to.onComplete
		};

	}
	static updateTween( tween, progress = 1 ){

		for( const { key, from, to } of tween.properties ){
			
			tween.target[key] = from + (to - from) * tween.easing(progress);

		}

		tween.onUpdate?.(tween.target);

	}
}
