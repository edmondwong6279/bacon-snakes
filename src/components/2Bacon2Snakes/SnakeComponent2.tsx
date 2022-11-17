/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable react-hooks/exhaustive-deps */
import styles from './SnakeComponent2.module.scss';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import Snake from './Snake';
import LobbyScreen from 'components/LobbyScreen';

const SnakeComponent2 = () => {
	// ---- Canvas ----
	const canvas = useRef<HTMLCanvasElement | null>(null);
	const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
	const width = 1000;
	const height = 700;

	// ---- Scores ----
	const [currentScoreState, setCurrentScoreState] = useState(0);
	const currentScoreRef = useRef(0);
	const [highScore, setHighScore] = useState(0);

	// ---- gameSelect ----
	const [mouseClickSingle, setMouseClickSingle] = useState(false);
	const [mouseClickMulti, setMouseClickMulti] = useState(false);
	const [play, setPlay] = useState(false);

	// ---- Patterns for rendering ----
	const [patternFace, setPatternFace] = useState<CanvasPattern>();
	const [pattern, setPattern] = useState<CanvasPattern>();
	const [patternEgg, setPatternEgg] = useState<CanvasPattern>();

	// ---- multiplayer stuff ----
	const [wsInstance, setwsInstance] = useState<WebSocket | null>(null);
	const [lobbyList, setLobbyList] = useState<{ name: string; status: boolean }[]>([]);
	// true when we are sending the readyup flag to the server
	const [readyUp, setReadyUp] = useState(false);
	// live state of the current input string
	const [name, setName] = useState('');
	// true if we have server confirmation of name. ONLY let user ready up if this is true
	const [nameConfirmation, setNameConfirmation] = useState(false);
	// server only allows 4 people right now (TODO scale up to allow for multiple lobbies).
	const [serverFull, setServerFull] = useState(false);
	// true when we wish to send to the server
	const [submitName, setSubmitName] = useState(false);
	const [showNameTaken, setShowNameTaken] = useState(false); // showing the flag thing
	const [showEmptyName, setShowEmptyName] = useState(false); // showing the flag thing
	const [countdown, setCountdown] = useState(4);
	const [scoreboard, setScoreboard] = useState<{ name: string; score: number }[]>([]);

	// ---- Grid set up ----
	const maxWidth = 20;
	const maxHeight = 14;
	const [gridWidth, setGridWidth] = useState(width / maxWidth);
	const [gridHeight, setGridHeight] = useState(height / maxHeight);

	// ---- stuff to sort ----
	const timeRef = useRef<number>(0);
	const firstRender = useRef(true);
	const raf = useRef<number>(2);
	const fpsInterval = useRef<number>(200); // in ms
	const snake = useRef<Snake>();
	const allSnakePos = useRef<
		{
			name: string;
			status: boolean;
			snake: Snake;
		}[]
	>([]);
	const keyClicked = useRef<number[]>();
	const [keyClickedState, setKeyClickedState] = useState([0, 0]);
	const [gameOverState, setGameOverState] = useState('');
	const gameOverRef = useRef<boolean>(false);
	const eggCoord = useRef<number[]>([0, 0]);

	useEffect(() => {
		if (wsInstance !== null) {
			// CLIENT SEND
			console.log('SENDING MOVEMENT');
			wsInstance.send(
				JSON.stringify({
					type: 'movement',
					move: keyClickedState,
					message: 'sending movement from client',
				})
			);
			console.log(wsInstance.readyState);
		}
	}, [keyClickedState]);

	/* CLIENT LISTEN TO INPUTS
		As soon as we receive an input, send this.
		Only listen to keys if play state is true
	*/
	const keyListener = (e: KeyboardEvent) => {
		const { key } = e;
		if (play) {
			console.log('GOT A KEY DOWNED');
			e.preventDefault();
			e.stopPropagation();
			if (key === 'a' || key === 'ArrowLeft') {
				// keyClicked.current = [-1, 0];
				setKeyClickedState([-1, 0]);
			}
			if (key === 'w' || key === 'ArrowUp') {
				// keyClicked.current = [0, -1];
				setKeyClickedState([0, -1]);
			}
			if (key === 'd' || key === 'ArrowRight') {
				// keyClicked.current = [1, 0];
				setKeyClickedState([1, 0]);
			}
			if (key === 's' || key === 'ArrowDown') {
				// keyClicked.current = [0, 1];
				setKeyClickedState([0, 1]);
			}
		} else {
			if (key === ' ') {
				// setMouseClickSingle(true);
			}
		}
	};

	// const handleMouseDownSingle = () => {
	// 	if (!mouseClickSingle && !mouseClickMulti) {
	// 		setMouseClickSingle(true);
	// 	}
	// };

	const handleMouseDownMulti = () => {
		if (!mouseClickSingle && !mouseClickMulti) {
			setMouseClickMulti(true);
		}
	};

	const clear = () => {
		if (ctx !== null) {
			ctx.clearRect(0, 0, width, height);
		}
	};

	const render = () => {
		if (
			ctx !== null &&
			patternFace !== undefined &&
			pattern !== undefined &&
			patternEgg !== undefined
		) {
			ctx.clearRect(0, 0, width, height);
			// loop through all players
			console.log('RENDERING');
			console.log(allSnakePos.current);
			for (let player = 0; player < allSnakePos.current.length; player++) {
				ctx.fillStyle = patternFace;
				ctx.fillRect(
					gridWidth * allSnakePos.current[player].snake.queue[0].x,
					gridHeight * allSnakePos.current[player].snake.queue[0].y,
					gridWidth,
					gridHeight
				);
				for (let idx = 1; idx < allSnakePos.current[player].snake.queue.length; idx++) {
					ctx.fillStyle = pattern;
					ctx.fillRect(
						gridWidth * allSnakePos.current[player].snake.queue[idx].x,
						gridHeight * allSnakePos.current[player].snake.queue[idx].y,
						gridWidth,
						gridHeight
					);
				}
				ctx.font = '20px Silkscreen';
				ctx.fillStyle = '#000000';
				ctx.fillText(
					allSnakePos.current[player].name,
					gridWidth * allSnakePos.current[player].snake.queue[0].x,
					gridHeight * allSnakePos.current[player].snake.queue[0].y + 20
				);
				ctx.fillStyle = patternEgg;
				ctx.fillRect(
					gridWidth * eggCoord.current[0],
					gridHeight * eggCoord.current[1],
					gridWidth,
					gridHeight
				);
			}
		}
	};

	// Initial connection
	useEffect(() => {
		if (wsInstance !== null) {
			console.log(wsInstance);
			console.log('CONNECTED');
			// Message filters
			wsInstance.onmessage = async (event) => {
				console.log('received message');
				console.log(wsInstance.readyState);
				const data = JSON.parse(event.data);
				if (data.type === 'tick') {
					/* ALL data:
						1. player positions
						2. egg positions
					*/
					const players = data.allInfo as {
						number: { name: string; status: boolean; snake: Snake };
					};
					console.log(data.allInfo);
					console.log(players);
					allSnakePos.current = [];
					console.log('got tick message');
					console.log(players);
					for (const value of Object.values(players)) {
						console.log(value.snake.queue);
						// only push players that are alive
						if (!value.snake.gameOver) {
							allSnakePos.current.push(value);
						}
					}
					eggCoord.current = data.egg;
					// trigger re-render
					render();
				} else if (data.type === 'lobbyList') {
					console.log('got lobby list message');
					setLobbyList(data.lobby);
				} else if (data.type === 'readyUp') {
					console.log('got readyup message');
					setLobbyList(data.lobby);
				} else if (data.type === 'name') {
					console.log(`Got name confirmation as: ${data.confirmation}`);
					setNameConfirmation(data.confirmation);
					if (!data.confirmation) {
						setShowNameTaken(true);
						setTimeout(() => {
							setShowNameTaken(false);
						}, 2000);
					}
				} else if (data.type === 'initial') {
					console.log('Receiving initial message');
					console.log(data.lobby);
					console.log(data.joined);
					if (data.joined) {
						setLobbyList(data.lobby);
					} else {
						setServerFull(true);
					}
				} else if (data.type === 'test') {
					console.log(data.message);
				} else if (data.type === 'countdownStart') {
					console.log(data.message);
					console.log(data.count);
					setScoreboard([]);
					setCountdown(data.count);
					if (data.count < 2) {
						const players = data.allInfo as {
							number: { name: string; status: boolean; snake: Snake };
						};
						allSnakePos.current = [];
						for (const value of Object.values(players)) {
							console.log(value.snake.queue);
							// only push players that are alive
							if (!value.snake.gameOver) {
								allSnakePos.current.push(value);
							}
						}
						eggCoord.current = data.egg;
						// trigger re-render
						render();
					}
				} else if (data.type === 'gameOver') {
					console.log('GAMEOVER Rendering scoreboard');
					const scores = Object.values(data.allInfo) as {
						name: string;
						score: number;
					}[];
					console.log(scores);
					clear();
					setReadyUp(false);
					setScoreboard(scores);
				}
			};
		}
	}, [wsInstance?.readyState]);

	useEffect(() => {
		// ONLY try to connect once the multiplayer button has been clicked
		const connectToServer = async () => {
			// get the server address first by fetching
			console.log('ENV VAR');
			console.log(process.env.NEXT_PUBLIC_WEBSOCKET_URL);
			// setwsInstance(new WebSocket('wss://baconsnake.universlabs.io:3002'));
			// setwsInstance(new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL as string));
			setwsInstance(new WebSocket('ws://localhost:3002'));
		};
		if (mouseClickMulti) {
			connectToServer();
		}
	}, [mouseClickMulti]);

	useEffect(() => {
		if (wsInstance !== null && readyUp) {
			// CLIENT SEND
			console.log('SENDING READY UP');
			console.log(wsInstance);
			wsInstance.send(
				JSON.stringify({
					type: 'readyUp',
					message: 'Client is readying up',
					readyUp: readyUp,
				})
			);
		}
	}, [readyUp]);

	useEffect(() => {
		if (wsInstance !== null && wsInstance.readyState === 1 && submitName && name.length > 0) {
			// CLIENT SEND
			console.log(wsInstance);
			wsInstance.send(
				JSON.stringify({
					type: 'name',
					name: name,
					message: 'Client is readying up',
				})
			);
			setSubmitName(false);
		}
	}, [submitName]);

	useEffect(() => {
		if (countdown < 1) {
			setPlay(true);
			// allows the client to listen to inputs again
		}
	}, [countdown]);

	useEffect(() => {
		if (mouseClickSingle) {
			gameOverRef.current = false;
			setGameOverState('');
			snake.current = new Snake(maxWidth, maxHeight, 5, 0, 0, 200);
			eggCoord.current = newEggCoord();
			setCurrentScoreState(0);
			currentScoreRef.current = 0;
			fpsInterval.current = 200;
		}
	}, [mouseClickSingle]);

	// contains logic for rendering AND the game
	const draw = (time: number) => {
		// calc elapsed time since last loop
		const elapsed = time - timeRef.current;

		if (
			elapsed > fpsInterval.current &&
			snake.current !== undefined &&
			ctx !== undefined &&
			ctx !== null &&
			pattern !== undefined &&
			patternEgg !== undefined &&
			patternFace !== undefined &&
			eggCoord.current !== undefined
		) {
			// every fpsInterval.current ms
			/*------ game update ------*/
			timeRef.current = time;
			let gameOver = false;
			if (!firstRender.current) {
				// move the snake
				gameOver = snake.current.draw(keyClicked.current);
				// check for egg
				const currQueue = snake.current.getQueue();
				const res = currQueue.filter(
					(value) => value.x === eggCoord.current[0] && value.y === eggCoord.current[1]
				);
				if (res.length > 0) {
					// eaten egg
					snake.current.lengthen();
					eggCoord.current = newEggCoord();
					currentScoreRef.current += 1;
					setCurrentScoreState(currentScoreRef.current);
					if (currentScoreRef.current % 2 === 0) {
						fpsInterval.current /= 2;
					}
				} else {
					// not eaten egg
					snake.current.shorten();
				}
			} else {
				firstRender.current = false;
			}
			gameOverRef.current = gameOver;

			/*------ render update ------*/
			ctx.clearRect(0, 0, width, height);
			const currentQueue = snake.current.getQueue();
			ctx.fillStyle = patternFace;
			ctx.fillRect(
				gridWidth * currentQueue[0].x,
				gridHeight * currentQueue[0].y,
				gridWidth,
				gridHeight
			);
			for (let idx = 1; idx < currentQueue.length; idx++) {
				ctx.fillStyle = pattern;
				ctx.fillRect(
					gridWidth * currentQueue[idx].x,
					gridHeight * currentQueue[idx].y,
					gridWidth,
					gridHeight
				);
			}
			ctx.fillStyle = patternEgg;
			ctx.fillRect(
				gridWidth * eggCoord.current[0],
				gridHeight * eggCoord.current[1],
				gridWidth,
				gridHeight
			);
		}

		if (gameOverRef.current) {
			if (currentScoreRef.current > highScore) {
				setGameOverState('NEW HIGH SCORE!!!');
				setHighScore(currentScoreRef.current);
			} else {
				setGameOverState('Game over');
			}
			setMouseClickSingle(false);
			cancelAnimationFrame(raf.current);
		} else {
			raf.current = requestAnimationFrame(draw);
		}
	};

	const newEggCoord = () => {
		let eggCoord = [
			Math.floor(Math.random() * maxWidth),
			Math.floor(Math.random() * maxHeight),
		];
		const currQueue = snake.current?.getQueue() as {
			x: number;
			y: number;
		}[];
		while (true) {
			const res = currQueue.filter(
				(value) => value.x === eggCoord[0] && value.y === eggCoord[1]
			);
			if (res.length === 0) {
				break;
			}
			eggCoord = [
				Math.floor(Math.random() * maxWidth),
				Math.floor(Math.random() * maxHeight),
			];
		}
		return eggCoord;
	};

	// initial set up
	useEffect(() => {
		if (canvas.current !== null) {
			canvas.current.width = width;
			canvas.current.height = height;
			setCtx(canvas.current.getContext('2d'));
			setGridWidth(width / maxWidth);
			setGridHeight(height / maxHeight);
		}
	}, []);

	useEffect(() => {
		if (ctx !== null && canvas.current !== null) {
			// start the loop IF the mouse has been clicked
			if (mouseClickSingle) raf.current = window.requestAnimationFrame(draw);
			const imgFace = new Image();
			imgFace.src = 'bacon face.png';
			imgFace.onload = () => {
				const pat = ctx.createPattern(imgFace, 'repeat') as CanvasPattern;
				setPatternFace(pat);
			};
			const img = new Image();
			img.src = 'bacon.png';
			img.onload = () => {
				const pat = ctx.createPattern(img, 'repeat') as CanvasPattern;
				setPattern(pat);
			};
			const imgEgg = new Image();
			imgEgg.src = 'Egg Wong.png';
			imgEgg.onload = () => {
				const pat = ctx.createPattern(imgEgg, 'repeat') as CanvasPattern;
				setPatternEgg(pat);
			};
		}

		return () => {
			window.cancelAnimationFrame(raf.current);
		};
	}, [ctx, mouseClickSingle]);

	return (
		<div className={styles.container} onKeyDown={keyListener} tabIndex={0}>
			<h1 className={styles.header}>B A C O N S N A K E</h1>
			<div className={styles.gameContainer}>
				<div className={styles.scoreOuterContainer}>
					<div className={styles.scoreContainer}>
						<h2 className={styles.scoreText}>Current Score: {currentScoreState}</h2>
					</div>
					<div className={styles.scoreContainer}>
						<h2 className={styles.scoreText}>High Score: {highScore}</h2>
					</div>
				</div>
				{!mouseClickSingle && !mouseClickMulti && !play && firstRender.current && (
					<>
						{/* <div
							className={styles.startScreenSingle}
							onMouseDown={handleMouseDownSingle}
						>
							{' '}
							B A C O N S N A K E{' '}
						</div> */}
						<div className={styles.startScreenMulti} onMouseDown={handleMouseDownMulti}>
							{' '}
							<span className={styles.letter}>2</span>B A C O N{' '}
							<span className={styles.letter}>2</span>S N A K E{' '}
						</div>
					</>
				)}
				{gameOverState !== '' && (
					<>
						<div className={styles.startScreen}>{gameOverState}</div>
						<div className={styles.startScreenSub}>
							{' '}
							Click or press space to try again
						</div>
					</>
				)}
				{scoreboard.length > 0 && (
					<div className={styles.scoreboard}>
						<div className={styles.scoreboardHeader}>ScoreBoard:</div>
						{scoreboard.map((score) => (
							<div className={styles.scoreboardRow}>
								<div className={styles.playerName}>{score.name}</div>
								<div className={styles.playerScore}>{score.score}</div>
							</div>
						))}
						<div
							className={styles[`readyup-${readyUp ? 'yes' : 'no'}`]}
							onClick={() => {
								// only allow ready up if some name has been confirmed by the server
								if (nameConfirmation) {
									setReadyUp(true);
								} else {
									// user has yet to submit a name
									setShowEmptyName(true);
									setTimeout(() => {
										setShowEmptyName(false);
									}, 2000);
								}
							}}
						>
							{readyUp ? "I'M READY" : 'READY UP'}
						</div>
					</div>
				)}
				{mouseClickMulti && countdown > 2 && (
					<LobbyScreen
						lobbyList={lobbyList}
						readyUp={readyUp}
						setReadyUp={setReadyUp}
						name={name}
						setName={setName}
						nameConfirmation={nameConfirmation}
						serverFull={serverFull}
						setSubmitName={setSubmitName}
						showNameTaken={showNameTaken}
						setShowNameTaken={setShowNameTaken}
						showEmptyName={showEmptyName}
						setShowEmptyName={setShowEmptyName}
					/>
				)}
				{countdown <= 3 && countdown > 0 && (
					<div className={styles.countdown}>STARTING IN: {countdown}</div>
				)}
				<canvas ref={canvas} className={styles.canvas} />
			</div>
		</div>
	);
};

export default SnakeComponent2;
