/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express');
const next = require('next');
const { WebSocketServer } = require('ws');
const {
	setToArray,
	broadcastToAll,
	newEggCoord,
	checkSingleCollision,
	checkiMultiCollision,
} = require('./utils.js');
const Snake = require('./snake.js');

const dev = true;
const hostname = 'localhost';
const port = 3000;
const app = next({ dev, hostname, port });
const nextHandler = app.getRequestHandler();
let allPlayers = {};
let eggCoord = [10, 10];

const serverHertz = 100;
const serverTickRate = 1000 / serverHertz; // in ms
let previous = 0;
const maxClients = 4;
let serverReady = false;
let time = 0;

// websocket server
const wss = new WebSocketServer({ port: 3002 });

// NEW CONNECTION WITH SOME CLIENT
wss.on('connection', (ws) => {
	console.log('INITIAL CONNECTION WITH A CLIENT');
	// Save the information directly into the wss.clients object
	if (wss.clients.size <= maxClients && !serverReady) {
		ws.id = String(Date.now() + String(Math.random()).slice(3));
		allPlayers[ws.id] = { name: '', status: false, snake: null, score: 0 };
		ws.send(
			JSON.stringify({
				type: 'initial',
				playerId: ws.id,
				lobby: setToArray(allPlayers),
				joined: true,
				message: 'SENDING BACK MESSAGE',
			})
		);
		console.log('New connection');
		console.log(allPlayers);
		broadcastToAll(
			{ type: 'lobbyList', message: 'sending lobbylist', lobby: setToArray(allPlayers) },
			wss.clients
		);
	} else {
		// send server full and close?
		console.log('Server full, rejecting client');
		ws.send(
			JSON.stringify({
				type: 'initial',
				joined: false,
				message: 'FULL SOZ',
			})
		);
		ws.close();
	}

	// RECEIVE MESSAGES
	ws.on('message', (data) => {
		console.log('RECEIVED A MESSAGE FROM THE CLIENT');
		const parsed = JSON.parse(data);
		if (parsed.type === 'movement') {
			console.log('got movement message');
			// parsed.move is an array of movement e.g. [0,1]
			// just need to call draw with this new move value as it
			// will update the instance variable.
			allPlayers[ws.id].snake.draw(time, parsed.move);
		} else if (parsed.type === 'readyUp') {
			console.log('got readyup message');
			allPlayers[ws.id].status = true;
			broadcastToAll(
				{
					type: 'readyUp',
					message: 'a player readied up',
					lobby: setToArray(allPlayers),
				},
				wss.clients
			);
			// Check if all players are ready, if so DO NOT allow any more players to join.
			serverReady = true;
			let currentCount = 0;
			for (const [key, value] of Object.entries(allPlayers)) {
				currentCount++;
				if (!value.status) {
					serverReady = false;
					break;
				}
			}
			if (serverReady) {
				console.log('server ready');
				if (currentCount > 1) {
					console.log('sending countdown');
					// all players ready, start countdown
					sendCountDown(allPlayers, wss.clients);
				} else {
					console.log('ready but not enough players');
					// only 1 player that's ready, don't start countdown
					serverReady = false;
				}
			}
		} else if (parsed.type === 'name') {
			// we get the player name that they have entered
			// check it doesn't exist, if it doesn't then add it, otherwise send back rejection
			console.log('player name message, checking if it exists');
			let checkFlag = true;
			for (const [key, value] of Object.entries(allPlayers)) {
				if (value.name === parsed.name) {
					// REJECTION
					ws.send(
						JSON.stringify({
							type: 'name',
							confirmation: false,
							message: 'Name taken',
						})
					);
					checkFlag = false;
					break;
				}
			}
			if (checkFlag) {
				allPlayers[ws.id].name = parsed.name;
				ws.send(
					JSON.stringify({
						type: 'name',
						confirmation: true,
						message: 'Name confirmed',
					})
				);
			}
			console.log('Total list of players:', allPlayers);
			broadcastToAll(
				{
					type: 'lobbyList',
					message: 'player entered a name',
					lobby: setToArray(allPlayers),
				},
				wss.clients
			);
		} else if (parsed.type === 'ping') {
			console.log('got ping message, extending lifespan of player');
		} else {
			console.log('GOT MESSAGE OF UNKNOWN TYPE');
			console.log(parsed);
		}
	});

	const heartbeat = () => {
		setInterval(() => {
			console.log('HEARTBEAT');
			console.log(`Clients set size: ${wss.clients.size}`);
			const newPlayers = {};
			console.log(allPlayers);
			// checking who's still connected and updating allplayers
			for (const client of wss.clients) {
				// reset the value of the array to be whatever is currently in wss.clients
				newPlayers[client.id] = {
					name: allPlayers[client.id].name,
					status: allPlayers[client.id].status,
					snake: allPlayers[client.id].snake,
					score: allPlayers[client.id].score,
				};
			}
			// remove all players that are no longer connected
			allPlayers = newPlayers;
			console.log(allPlayers);
			broadcastToAll(
				{
					type: 'lobbyList',
					message: 'sending heartbeat',
					lobby: setToArray(allPlayers),
				},
				wss.clients
			);
			console.log('---------');
		}, 4000);
	};

	heartbeat();

	// Run at a high tick rate, and send information back constantly FIRST.
	// ISSUE this start loop is BLOCKING all other io from getting in.
	const startLoop = async () => {
		previous = Date.now();
		const loopInt = setInterval(() => {
			// while (true) { // old while loop blocked input
			const now = Date.now();
			time = now; // for passing info to snake
			const elapsed = now - previous;
			if (elapsed >= serverTickRate) {
				previous = now;
				console.log(`TICK ELAPSED: ${elapsed}`);
				// 0. TODO CHECK IF PLAYERS REMAINING IS LESS THAN 2.
				const playersAlive = Object.values(allPlayers).filter(
					(player) => !player.snake.gameOver
				).length;

				console.log('PLAYERS ALIVE');
				console.log(playersAlive);

				if (playersAlive < 2) {
					console.log('GAME OVER- ONLY 1 PLAYER REMAINS');
					clearInterval(loopInt);
					//  Reset all readyup statuses to false
					Object.values(allPlayers).map((player) => {
						player.status = false;
						player.score = 0;
					});
					broadcastToAll(
						{
							type: 'gameOver',
							allInfo: allPlayers,
							message: 'GAME OVER',
						},
						wss.clients
					);
					serverReady = false;
				}

				const playersMoved = Object.values(allPlayers).map((player) => {
					console.log(player);
					console.log(allPlayers);
					// perform moves of each snake
					// the snake object takes care of it it actually moves or not
					const playerMoved = player.snake.draw(time);
					if (playerMoved) {
						// 1. Check for collisions (self or wall)
						// TODO pass this over to the clients and have it as a fixed variable defined here
						const gameOverSingle = checkSingleCollision(
							player.snake.getQueue(),
							20,
							14
						);
						console.log('checking for player collision with self or border');
						console.log(gameOverSingle);

						// 1.5 Check for collisions (other players)
						const gameOverMulti = checkiMultiCollision(
							player.snake.getQueue(),
							player.name,
							allPlayers
						);

						console.log('checking for player collision with other players');
						console.log(gameOverMulti);

						const gameOverAll = gameOverSingle || gameOverMulti.includes(true);
						if (gameOverAll) {
							player.score -= 4;
						}
						player.snake.gameOver = gameOverAll;

						console.log(allPlayers);
						const currQueue = player.snake.getQueue();
						// 2. check for egg collisions, shorten all other snakes
						const res = currQueue.filter(
							(coord) => coord.x === eggCoord[0] && coord.y === eggCoord[1]
						);
						console.log(allPlayers);

						if (res.length > 0) {
							console.log('PLAYER EATEN EGG');
							// eaten egg
							player.snake.lengthen();
							player.score += 1;
							// need to give it current players positions too
							console.log(eggCoord);
							console.log(allPlayers);
							eggCoord = newEggCoord(allPlayers, 20, 14);
							console.log(eggCoord);
						} else {
							// not eaten egg
							player.snake.shorten();
						}
					}
				});

				// on each tick, send all the information (or just anything that's different?).
				broadcastToAll(
					{
						type: 'tick',
						allInfo: allPlayers,
						egg: eggCoord,
						message: 'sending tick',
					},
					wss.clients
				);
			}
		}, serverTickRate);
	};

	// send countdown to players
	const sendCountDown = (allPlayers, clients) => {
		let tick = 3;
		const now = Date.now();
		// add the snake to the value dictionary in allPlayers

		Object.entries(allPlayers).forEach(([, value], index) => {
			value.snake = new Snake(20, 14, 5, now, index, 200);
		});

		eggCoord = newEggCoord(allPlayers, 20, 14);

		const int = setInterval(() => {
			broadcastToAll(
				{
					type: 'countdownStart',
					count: tick,
					allInfo: allPlayers,
					egg: eggCoord,
					message: 'players are ready, countdown started',
				},
				clients
			);
			if (tick < 1) {
				// START LOOP
				startLoop();
				clearInterval(int);
			}
			tick--;
		}, 1000);
	};
});

app.prepare().then(() => {
	// express for handling http requests
	const expressApp = express();

	// To handle Next.js routing
	expressApp.all('*', (req, res) => nextHandler(req, res));

	// Start the server!
	expressApp.listen(port, (err) => {
		if (err) throw err;
		console.log(`Ready on http://127.0.0.1:${port}`);
	});
});
