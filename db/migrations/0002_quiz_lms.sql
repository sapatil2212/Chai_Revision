ALTER TABLE `quiz_attempts` MODIFY COLUMN `user_id` varchar(36);--> statement-breakpoint
ALTER TABLE `quiz_attempts` MODIFY COLUMN `score` decimal(7,2) NOT NULL DEFAULT '0';--> statement-breakpoint
ALTER TABLE `quiz_attempts` MODIFY COLUMN `correct_count` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `quiz_attempts` MODIFY COLUMN `wrong_count` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `quiz_attempts` MODIFY COLUMN `time_taken_seconds` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `quiz_attempts` MODIFY COLUMN `completed_at` datetime;--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD `participant_id` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD `participant_name` varchar(80) NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD `status` enum('in_progress','submitted') DEFAULT 'in_progress' NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD `question_order` json NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD `total_marks` decimal(7,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD `percentage` decimal(5,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD `skipped_count` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD `passed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD `is_late` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD `started_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD `image` varchar(512);--> statement-breakpoint
ALTER TABLE `quiz_sets` ADD `slug` varchar(191);--> statement-breakpoint
UPDATE `quiz_sets` SET `slug` = REPLACE(`id`, 'quiz-', '') WHERE `slug` IS NULL;--> statement-breakpoint
ALTER TABLE `quiz_sets` MODIFY COLUMN `slug` varchar(191) NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_sets` ADD `instructions` json;--> statement-breakpoint
ALTER TABLE `quiz_sets` ADD `difficulty` enum('Easy','Medium','Hard','Mixed') DEFAULT 'Mixed' NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_sets` ADD `pass_percentage` int DEFAULT 40 NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_sets` ADD `default_marks` decimal(5,2) DEFAULT '2' NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_sets` ADD `default_negative_marks` decimal(5,2) DEFAULT '0.5' NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_sets` ADD `shuffle_questions` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_sets` ADD `shuffle_options` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_sets` ADD `show_solutions` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_sets` ADD `max_attempts` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_sets` ADD `starts_at` datetime;--> statement-breakpoint
ALTER TABLE `quiz_sets` ADD `ends_at` datetime;--> statement-breakpoint
ALTER TABLE `quiz_sets` ADD `is_featured` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_sets` ADD `sort_order` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `quiz_sets` ADD CONSTRAINT `quiz_sets_slug_uq` UNIQUE(`slug`);--> statement-breakpoint
CREATE INDEX `quiz_attempts_set_status_idx` ON `quiz_attempts` (`quiz_set_id`,`status`);--> statement-breakpoint
DROP INDEX `quiz_attempts_set_idx` ON `quiz_attempts`;--> statement-breakpoint
CREATE INDEX `quiz_attempts_participant_idx` ON `quiz_attempts` (`participant_id`,`quiz_set_id`);--> statement-breakpoint
CREATE INDEX `quiz_sets_sort_idx` ON `quiz_sets` (`sort_order`);
--> statement-breakpoint
UPDATE `quiz_sets` SET `exam` = 'MPSC' WHERE `exam` LIKE 'MPSC%';--> statement-breakpoint
UPDATE `quiz_sets` SET `subject` = 'Maharashtra & World Geography' WHERE `subject` = 'Maharashtra Geography';--> statement-breakpoint
UPDATE `quiz_sets` SET `subject` = 'Maharashtra & Indian History' WHERE `subject` = 'Maharashtra History';--> statement-breakpoint
UPDATE `quiz_sets` SET `is_featured` = true WHERE `id` = 'quiz-mpsc-polity-1';
