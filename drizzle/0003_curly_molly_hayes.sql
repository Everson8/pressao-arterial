CREATE TABLE `email_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reminderNotifications` int NOT NULL DEFAULT 1,
	`weeklyDigest` int NOT NULL DEFAULT 1,
	`alertNotifications` int NOT NULL DEFAULT 1,
	`weeklyDigestDay` int NOT NULL DEFAULT 1,
	`weeklyDigestTime` varchar(5) NOT NULL DEFAULT '09:00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_userId_unique` UNIQUE(`userId`)
);
