import styles from './LoadingComponent.module.scss';
import React from 'react';
import { motion } from 'framer-motion';

export type LoadingProps = {
	loading: boolean;
};

const LoadingComponent: React.ComponentType<LoadingProps> = ({ loading }) => (
	<div className={styles.loadingContainer}>
		<motion.div
			className={styles[`loadingCircle-${loading ? 'show' : 'hide'}`]}
			animate={{ rotate: 360, transition: { rotate: { duration: 1, repeat: Infinity } } }}
		/>
	</div>
);
export default LoadingComponent;
