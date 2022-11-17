/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable react-hooks/exhaustive-deps */
import styles from './LobbyScreen.module.scss';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

export type LobbyScreenProps = {
	lobbyList: { name: string; status: boolean }[];
	readyUp: boolean;
	setReadyUp: Dispatch<SetStateAction<boolean>>;
	name: string;
	setName: Dispatch<SetStateAction<string>>;
	nameConfirmation: boolean;
	serverFull: boolean;
	setSubmitName: Dispatch<SetStateAction<boolean>>;
	showNameTaken: boolean;
	setShowNameTaken: Dispatch<SetStateAction<boolean>>;
	showEmptyName: boolean;
	setShowEmptyName: Dispatch<SetStateAction<boolean>>;
};

const LobbyScreen: React.ComponentType<LobbyScreenProps> = ({
	lobbyList,
	readyUp,
	setReadyUp,
	name,
	setName,
	nameConfirmation,
	serverFull,
	setSubmitName,
	showNameTaken,
	setShowNameTaken,
	showEmptyName,
	setShowEmptyName,
}) => {
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (nameConfirmation) {
			setShowNameTaken(false);
			setShowEmptyName(false);
		}
	}, [nameConfirmation]);

	useEffect(() => {
		// when the list changes, make sure load is set to false
		if (lobbyList.length > 0) {
			setLoading(false);
		}
	}, [lobbyList]);

	return (
		<div className={styles.container}>
			{loading && !serverFull && (
				<div className={styles.loadingText}>Connecting to Server...</div>
			)}
			{loading && serverFull && (
				<div className={styles.loadingText}>SERVER FULL. Please try again later</div>
			)}
			{!loading && (
				<>
					<div className={styles.lobbyContainer}>
						{lobbyList.map((player, idx) => (
							<div className={styles.playerRow} key={idx}>
								<div className={styles.playerNameLeft}>{`Player ${idx + 1}:`}</div>
								<div className={styles.playerNameRight}>{player.name}</div>
								<div
									className={
										styles[`playerNameReady-${player.status ? 'yes' : 'no'}`]
									}
								/>
							</div>
						))}
					</div>
					<input
						type={'text'}
						onKeyDown={(e) => {
							setName(e.currentTarget.value);
							if (e.key === 'Enter') {
								// submit here
								console.log(name);
								if (name !== undefined && name.trim().length !== 0) {
									setSubmitName(true);
								} else {
									// trying to submit when name is just spaces or invalid.
									setShowEmptyName(true);
								}
							}
						}}
						disabled={readyUp}
						maxLength={20}
					></input>
					<div className={styles[`nameConfirmation-${showNameTaken ? 'show' : 'hide'}`]}>
						Name Taken
					</div>
					<div className={styles[`nameConfirmation-${showEmptyName ? 'show' : 'hide'}`]}>
						Please submit a name
					</div>
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
					{/* <div className={styles.descr}>
						<div className={styles.rule}>
							1. Collect the most eggs to 
						</div>
					</div> */}
				</>
			)}
		</div>
	);
};

export default LobbyScreen;
