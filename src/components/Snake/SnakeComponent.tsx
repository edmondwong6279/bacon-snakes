/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable react-hooks/exhaustive-deps */
import styles from './SnakeComponent.module.scss';
import { useEffect, useRef, useState } from 'react';
import Snake from './Snake';

const SnakeComponent = ({}) => {
	const canvas = useRef<HTMLCanvasElement | null>(null);
	const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
	const width = 1000;
	const height = 700;
	const [currentScoreState, setCurrentScoreState] = useState(0);
	const currentScoreRef = useRef(0);
	const [highScore, setHighScore] = useState(0);
	const [mouseClick, setMouseClick] = useState(false);

	const [pattern, setPattern] = useState<CanvasPattern>();
	const [patternFace, setPatternFace] = useState<CanvasPattern>();
	const [patternEgg, setPatternEgg] = useState<CanvasPattern>();
	const timeRef = useRef<number>(0);
	const firstRender = useRef(true);
	const raf = useRef<number>(2);
	const fpsInterval = useRef<number>(200); // in ms
	const snake = useRef<Snake>();
	const keyClicked = useRef<number[]>();
	const [gameOverState, setGameOverState] = useState('');
	const gameOverRef = useRef<boolean>(false);
	const eggCoord = useRef<number[]>([0, 0]);

	const maxWidth = 20;
	const maxHeight = 14;
	const [gridWidth, setGridWidth] = useState(width / maxWidth);
	const [gridHeight, setGridHeight] = useState(height / maxHeight);

	const keyListener = (e: KeyboardEvent) => {
		const { key } = e;
		e.preventDefault();
		e.stopPropagation();
		if (key === 'a' || key === 'ArrowLeft') {
			keyClicked.current = [-1, 0];
		}
		if (key === 'w' || key === 'ArrowUp') {
			keyClicked.current = [0, -1];
		}
		if (key === 'd' || key === 'ArrowRight') {
			keyClicked.current = [1, 0];
		}
		if (key === 's' || key === 'ArrowDown') {
			keyClicked.current = [0, 1];
		}
		if (key === ' ') {
			setMouseClick(true);
		}
	};

	const handleMouseDown = () => {
		setMouseClick(true);
	};

	useEffect(() => {
		if (mouseClick) {
			gameOverRef.current = false;
			setGameOverState('');
			snake.current = new Snake(maxWidth, maxHeight, 5);
			eggCoord.current = newEggCoord();
			setCurrentScoreState(0);
			currentScoreRef.current = 0;
			fpsInterval.current = 200;
		}
	}, [mouseClick]);

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

			// (window as any).snake = snake.current;
			// (window as any).eggCoord = eggCoord.current;
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
			setMouseClick(false);
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
			if (mouseClick) raf.current = window.requestAnimationFrame(draw);
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
	}, [ctx, mouseClick]);

	return (
		<div className={styles.container} onKeyDown={keyListener} tabIndex={0}>
			{/* <div className={styles.container} tabIndex={0}> */}
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
				{!mouseClick && firstRender.current && (
					<div className={styles.startScreen}> Click to start </div>
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

				<canvas ref={canvas} className={styles.canvas} onMouseDown={handleMouseDown} />
			</div>
		</div>
	);
};

export default SnakeComponent;
