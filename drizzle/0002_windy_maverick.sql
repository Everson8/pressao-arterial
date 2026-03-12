CREATE TABLE `reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`time` varchar(5) NOT NULL,
	`daysOfWeek` varchar(20) NOT NULL DEFAULT '0,1,2,3,4,5,6',
	`enabled` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shared_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`doctorName` varchar(255),
	`doctorEmail` varchar(320),
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shared_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `shared_links_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `user_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetSystolic` int NOT NULL DEFAULT 130,
	`targetDiastolic` int NOT NULL DEFAULT 80,
	`alertThresholdSystolic` int NOT NULL DEFAULT 140,
	`alertThresholdDiastolic` int NOT NULL DEFAULT 90,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_goals_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_goals_userId_unique` UNIQUE(`userId`)
);
