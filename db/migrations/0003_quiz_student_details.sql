ALTER TABLE `quiz_attempts` ADD `participant_mobile` varchar(20);--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD `participant_email` varchar(191);--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD `participant_address` varchar(300);--> statement-breakpoint
CREATE INDEX `quiz_attempts_mobile_idx` ON `quiz_attempts` (`participant_mobile`);