class Snake {
	queue: { x: number; y: number }[];
	direction: number[];
	length: number;
	maxHeight: number;
	maxWidth: number;

	constructor(maxWidth: number, maxHeight: number, length: number) {
		// construct queue by choosing a point in the available grid, then weave randomly for some length
		this.length = length;
		[this.queue, this.direction] = this.makeQueue(maxWidth, maxHeight, length);
		this.maxHeight = maxHeight;
		this.maxWidth = maxWidth;
	}

	makeQueue(
		maxWidth: number,
		maxHeight: number,
		length: number
	): [{ x: number; y: number }[], number[]] {
		const startX = Math.floor(Math.random() * (maxWidth - 2 * length - 3)) + 3 + length;
		// const startY = 0;
		const startY = Math.floor(Math.random() * (maxHeight - 2 * length - 3)) + 3 + length;
		const result = [{ x: startX, y: startY }];
		const dir = Math.floor(Math.random() * 4);
		// const dir = 3;
		const dirArray = [];
		if (dir === 0) {
			dirArray.push(1, 0);
		} else if (dir === 1) {
			dirArray.push(0, -1);
		} else if (dir === 2) {
			dirArray.push(-1, 0);
		} else if (dir === 3) {
			dirArray.push(0, 1);
		}
		for (let idx = 1; idx < length; idx++) {
			result.unshift({ x: startX + dirArray[0] * idx, y: startY + dirArray[1] * idx });
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
	}

	draw(currentDirection: number[] | undefined): boolean {
		// undefined happens when no key has been pressed yet
		if (currentDirection !== undefined) {
			if (
				currentDirection[1] !== -this.direction[1] &&
				currentDirection[0] !== -this.direction[0]
			) {
				this.direction = currentDirection;
			}
		}

		this.queue.unshift({
			x: this.queue[0].x + this.direction[0],
			y: this.queue[0].y + this.direction[1],
		});

		return this.checkGameOver();
	}
}

export default Snake;
