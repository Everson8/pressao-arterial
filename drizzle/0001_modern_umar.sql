CREATE TABLE `blood_pressure_readings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`systolic` int NOT NULL,
	`diastolic` int NOT NULL,
	`heartRate` int,
	`notes` text,
	`measuredAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blood_pressure_readings_id` PRIMARY KEY(`id`)
);
