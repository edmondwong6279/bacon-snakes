/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
const WebSocket = require('ws');

const setToArray = (lobby) => {
	const result = [];
	for (const [key, value] of Object.entries(lobby)) {
		console.log(`${key}: ${value}`);
		result.push({ name: value.name, status: value.status });
	}
	return result;
};

const broadcastToAll = (message, clients) => {
	// broadcast to all clients
	// TODO speed up with .map by turning it into a list first?
	// https://stackoverflow.com/questions/33234666/how-to-map-reduce-filter-a-set-in-javascript
	console.log(`Broadcasting: ${message.message}`);
	for (const client of clients) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify(message));
		}
	}
};

// TODO add eggcord
const newEggCoord = (allPlayers, maxWidth, maxHeight) => {
	let eggCoord = [Math.floor(Math.random() * maxWidth), Math.floor(Math.random() * maxHeight)];
	// get all queues (all snake positions)
	const currentPos = [];
	for (const [, value] of Object.entries(allPlayers)) {
		currentPos.push(...value.snake.getQueue());
	}
	console.log(currentPos);
	while (true) {
		const res = currentPos.filter(
			(value) => value.x === eggCoord[0] && value.y === eggCoord[1]
		);
		if (res.length === 0) {
			break;
		}
		// new coord
		eggCoord = [Math.floor(Math.random() * maxWidth), Math.floor(Math.random() * maxHeight)];
	}
	return eggCoord;
};

// Collision used in single player ie collision against self or border
const checkSingleCollision = (snakeQueue, maxWidth, maxHeight) => {
	// res checks for collisions with self.
	const res = snakeQueue.filter(
		(value, index, self) => index === self.findIndex((t) => t.x === value.x && t.y === value.y)
	);
	return (
		snakeQueue[0].x + 1 > maxWidth ||
		snakeQueue[0].y + 1 > maxHeight ||
		snakeQueue[0].x < 0 ||
		snakeQueue[0].y < 0 ||
		res.length < snakeQueue.length
	);
};

// Collision against other players (head position into other players)
const checkiMultiCollision = (snakeQueue, playerName, allPlayers) => {
	// check if head off snakeQueue collides with any of the other players.
	const [head] = snakeQueue;

	// go through each player in allPlayers (except for yourself) and check if there are any collisions.
	return Object.values(allPlayers).map((player) => {
		// only check for player who are still alive
		if (playerName !== player.name && !player.snake.gameOver) {
			return player.snake.queue.some((e) => e.x === head.x && e.y === head.y);
		}
		return false;
	});
};

module.exports = {
	setToArray,
	broadcastToAll,
	newEggCoord,
	checkSingleCollision,
	checkiMultiCollision,
};
