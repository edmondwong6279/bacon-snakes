module.exports = class Snake {
	constructor(maxWidth, maxHeight, length, time, playerIdx, speed) {
		// construct queue by choosing a point in the available grid, then weave randomly for some length
		this.length = length;
		[this.queue, this.direction] = this.makeQueue(maxWidth, maxHeight, playerIdx);
		this.maxHeight = maxHeight;
		this.maxWidth = maxWidth;
		this.speed = speed; // how often should we update the movement (in ms and must be a multiple of the tick rate).
		this.currentTime = time;
		this.gameOver = false;
	}

	makeQueue(maxWidth, maxHeight, idx) {
		const result = [];
		const dirArray = [];
		// TODO tidy this up
		if (idx === 0) {
			dirArray.push(1, 0);
			result.push({ x: 5, y: 0 });
			result.push({ x: 4, y: 0 });
			result.push({ x: 3, y: 0 });
			result.push({ x: 2, y: 0 });
			result.push({ x: 1, y: 0 });
		} else if (idx === 1) {
			dirArray.push(0, 1);
			result.push({ x: maxWidth - 1, y: 5 });
			result.push({ x: maxWidth - 1, y: 4 });
			result.push({ x: maxWidth - 1, y: 3 });
			result.push({ x: maxWidth - 1, y: 2 });
			result.push({ x: maxWidth - 1, y: 1 });
		} else if (idx === 2) {
			dirArray.push(-1, 0);
			result.push({ x: maxWidth - 5, y: maxHeight - 1 });
			result.push({ x: maxWidth - 4, y: maxHeight - 1 });
			result.push({ x: maxWidth - 3, y: maxHeight - 1 });
			result.push({ x: maxWidth - 2, y: maxHeight - 1 });
			result.push({ x: maxWidth - 1, y: maxHeight - 1 });
		} else if (idx === 3) {
			dirArray.push(0, -1);
			result.push({ x: 1, y: maxHeight - 5 });
			result.push({ x: 1, y: maxHeight - 4 });
			result.push({ x: 1, y: maxHeight - 3 });
			result.push({ x: 1, y: maxHeight - 2 });
			result.push({ x: 1, y: maxHeight - 1 });
		} else {
			throw Error(`invalid player index: ${idx}`);
		}
		return [result, dirArray];
	}

	getQueue() {
		return this.queue;
	}

	checkGameOver() {
		const res = this.queue.filter(
			(value, index, self) =>
				index === self.findIndex((t) => t.x === value.x && t.y === value.y)
		);
		return (
			this.queue[0].x + 1 > this.maxWidth ||
			this.queue[0].y + 1 > this.maxHeight ||
			this.queue[0].x < 0 ||
			this.queue[0].y < 0 ||
			res.length < this.queue.length
		);
	}

	shorten() {
		this.queue.pop();
	}

	lengthen() {
		this.length += 1;
		// increase speed every 2 scores
		if (this.length % 2 === 1) {
			this.speed /= 2;
		}
	}

	// time is global time from the server ie Date.now().
	draw(time, currentDirection) {
		// update this on every call
		if (currentDirection !== undefined) {
			console.log('GOT DIRECTION:');
			console.log(currentDirection);
			// don't allow the snake to turn around
			if (
				currentDirection[1] !== -this.direction[1] &&
				currentDirection[0] !== -this.direction[0]
			) {
				this.direction = currentDirection;
			}
		}

		// update movement every now and then (speed)
		if (time - this.currentTime >= this.speed) {
			if (!this.gameOver) {
				// undefined happens when no key has been pressed yet
				console.log('MOVING SNAKE');
				console.log(this.queue);
				console.log(this.queue[0]);
				console.log(this.queue[0].x + this.direction[0]);

				this.queue.unshift({
					x: this.queue[0].x + this.direction[0],
					y: this.queue[0].y + this.direction[1],
				});

				this.currentTime = time;
				return true; // true if snake has moved
			}
		}
		return false; //false if snake has not moved
	}
};
