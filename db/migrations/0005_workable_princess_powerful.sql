CREATE TABLE `page_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitor_hash` varchar(64) NOT NULL,
	`path` varchar(512) NOT NULL,
	`referrer` varchar(512),
	`device_type` varchar(16),
	`browser` varchar(64),
	`os` varchar(64),
	`country` varchar(4),
	`viewed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `pv_date_idx` ON `page_views` (`viewed_at`);--> statement-breakpoint
CREATE INDEX `pv_visitor_idx` ON `page_views` (`visitor_hash`);--> statement-breakpoint
CREATE INDEX `pv_path_idx` ON `page_views` (`path`);