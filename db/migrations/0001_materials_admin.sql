ALTER TABLE `materials` ADD `file_name` varchar(255);--> statement-breakpoint
ALTER TABLE `materials` ADD `sort_order` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `materials` ADD `download_count` int DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `materials_sort_idx` ON `materials` (`sort_order`);