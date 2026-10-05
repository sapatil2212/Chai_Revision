CREATE TABLE `blog_posts` (
	`id` varchar(64) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`title` json NOT NULL,
	`excerpt` json NOT NULL,
	`content` json NOT NULL,
	`category` varchar(64) NOT NULL,
	`author_name` varchar(128) NOT NULL,
	`author_role` varchar(128),
	`author_avatar` varchar(512),
	`published_label` varchar(64) NOT NULL,
	`reading_time` varchar(64),
	`cover_image` varchar(512) NOT NULL,
	`table_of_contents` json NOT NULL,
	`is_published` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blog_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_posts_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`user_id` varchar(36) NOT NULL,
	`item_type` enum('material','pyq','blog','quiz') NOT NULL,
	`item_id` varchar(64) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookmarks_user_id_item_type_item_id_pk` PRIMARY KEY(`user_id`,`item_type`,`item_id`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`code` varchar(32) NOT NULL,
	`discount_percent` int NOT NULL,
	`max_uses` int,
	`used_count` int NOT NULL DEFAULT 0,
	`expires_at` datetime,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coupons_code` PRIMARY KEY(`code`)
);
--> statement-breakpoint
CREATE TABLE `exam_categories` (
	`id` varchar(64) NOT NULL,
	`name` json NOT NULL,
	`description` json NOT NULL,
	`resources_count` int NOT NULL DEFAULT 0,
	`icon_name` varchar(64) NOT NULL,
	`badge` varchar(32),
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exam_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exam_updates` (
	`id` varchar(64) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`title` json NOT NULL,
	`exam` varchar(64) NOT NULL,
	`category` varchar(64) NOT NULL,
	`badge` enum('NEW','IMPORTANT','LAST DATE','ADMIT CARD','RESULT') NOT NULL,
	`published_label` varchar(64) NOT NULL,
	`last_date_label` varchar(64),
	`exam_date_label` varchar(128),
	`short_summary` json NOT NULL,
	`full_content` json NOT NULL,
	`official_link` varchar(512) NOT NULL,
	`syllabus_link` varchar(512),
	`is_published` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exam_updates_id` PRIMARY KEY(`id`),
	CONSTRAINT `exam_updates_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `important_dates` (
	`id` varchar(64) NOT NULL,
	`exam` varchar(64) NOT NULL,
	`event` json NOT NULL,
	`start_date_label` varchar(64) NOT NULL,
	`last_date_label` varchar(64) NOT NULL,
	`status` enum('Upcoming','Active','Closing Soon','Completed') NOT NULL,
	`category` enum('Form','Admit Card','Exam','Result') NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `important_dates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` varchar(64) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`title` json NOT NULL,
	`subtitle` json,
	`description` json NOT NULL,
	`exam` varchar(64) NOT NULL,
	`subject` varchar(64) NOT NULL,
	`language` enum('Marathi','English','Bilingual','Hindi') NOT NULL,
	`material_type` varchar(64) NOT NULL,
	`cover_image` varchar(512) NOT NULL,
	`sample_pages` json NOT NULL,
	`pages` int NOT NULL,
	`original_price` int NOT NULL,
	`discounted_price` int NOT NULL,
	`rating` decimal(2,1) NOT NULL DEFAULT '0.0',
	`reviews_count` int NOT NULL DEFAULT 0,
	`last_updated_label` varchar(64),
	`featured` boolean NOT NULL DEFAULT false,
	`bestseller` boolean NOT NULL DEFAULT false,
	`is_free` boolean NOT NULL DEFAULT false,
	`file_size` varchar(32),
	`file_url` varchar(512),
	`table_of_contents` json NOT NULL,
	`what_is_included` json NOT NULL,
	`tags` json NOT NULL,
	`is_published` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `materials_id` PRIMARY KEY(`id`),
	CONSTRAINT `materials_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36),
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` enum('material','exam','system','discount') NOT NULL,
	`link` varchar(255),
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` varchar(32) NOT NULL,
	`material_id` varchar(64) NOT NULL,
	`price_at_purchase` int NOT NULL,
	`download_token` varchar(64),
	`token_expires_at` datetime,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `order_items_order_material_uq` UNIQUE(`order_id`,`material_id`),
	CONSTRAINT `order_items_token_uq` UNIQUE(`download_token`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` varchar(32) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`subtotal` int NOT NULL,
	`discount` int NOT NULL DEFAULT 0,
	`total_amount` int NOT NULL,
	`coupon_code` varchar(32),
	`status` enum('Pending','Processing','Completed','Failed','Refunded') NOT NULL DEFAULT 'Pending',
	`payment_provider` varchar(32) NOT NULL DEFAULT 'razorpay',
	`payment_order_id` varchar(64),
	`payment_id` varchar(64),
	`payment_method` varchar(64),
	`paid_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_payment_id_uq` UNIQUE(`payment_id`)
);
--> statement-breakpoint
CREATE TABLE `pyqs` (
	`id` varchar(64) NOT NULL,
	`exam` varchar(64) NOT NULL,
	`year` int NOT NULL,
	`subject` varchar(64) NOT NULL,
	`topic` varchar(191) NOT NULL,
	`question` json NOT NULL,
	`options` json NOT NULL,
	`correct_option` int NOT NULL,
	`explanation` json NOT NULL,
	`difficulty` enum('Easy','Medium','Hard') NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pyqs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`quiz_set_id` varchar(64) NOT NULL,
	`answers` json NOT NULL,
	`score` decimal(6,2) NOT NULL,
	`correct_count` int NOT NULL,
	`wrong_count` int NOT NULL,
	`time_taken_seconds` int NOT NULL,
	`completed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quiz_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_questions` (
	`id` varchar(64) NOT NULL,
	`quiz_set_id` varchar(64) NOT NULL,
	`position` int NOT NULL,
	`category` varchar(64) NOT NULL,
	`subject` varchar(64) NOT NULL,
	`exam` varchar(64) NOT NULL,
	`question` json NOT NULL,
	`options` json NOT NULL,
	`correct_option` enum('A','B','C','D') NOT NULL,
	`explanation` json NOT NULL,
	`marks` decimal(5,2) NOT NULL,
	`negative_marks` decimal(5,2) NOT NULL DEFAULT '0',
	`difficulty` enum('Easy','Medium','Hard') NOT NULL,
	CONSTRAINT `quiz_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_sets` (
	`id` varchar(64) NOT NULL,
	`title` json NOT NULL,
	`description` json NOT NULL,
	`exam` varchar(64) NOT NULL,
	`subject` varchar(64) NOT NULL,
	`duration_minutes` int NOT NULL,
	`total_marks` decimal(6,2) NOT NULL,
	`negative_marking` boolean NOT NULL DEFAULT false,
	`negative_ratio` varchar(64),
	`badge` varchar(64),
	`is_published` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quiz_sets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(191) NOT NULL,
	`email` varchar(191) NOT NULL,
	`mobile` varchar(20),
	`password_hash` varchar(255),
	`role` enum('student','admin','superadmin') NOT NULL DEFAULT 'student',
	`preferred_language` enum('mr','en','hi') NOT NULL DEFAULT 'mr',
	`target_exams` json NOT NULL,
	`avatar` varchar(512),
	`last_login_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_uq` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_material_id_materials_id_fk` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_coupon_code_coupons_code_fk` FOREIGN KEY (`coupon_code`) REFERENCES `coupons`(`code`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD CONSTRAINT `quiz_attempts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quiz_attempts` ADD CONSTRAINT `quiz_attempts_quiz_set_id_quiz_sets_id_fk` FOREIGN KEY (`quiz_set_id`) REFERENCES `quiz_sets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quiz_questions` ADD CONSTRAINT `quiz_questions_quiz_set_id_quiz_sets_id_fk` FOREIGN KEY (`quiz_set_id`) REFERENCES `quiz_sets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `exam_updates_exam_idx` ON `exam_updates` (`exam`);--> statement-breakpoint
CREATE INDEX `materials_exam_idx` ON `materials` (`exam`);--> statement-breakpoint
CREATE INDEX `materials_subject_idx` ON `materials` (`subject`);--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`user_id`,`is_read`);--> statement-breakpoint
CREATE INDEX `orders_user_idx` ON `orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `pyqs_exam_year_idx` ON `pyqs` (`exam`,`year`);--> statement-breakpoint
CREATE INDEX `pyqs_subject_idx` ON `pyqs` (`subject`);--> statement-breakpoint
CREATE INDEX `quiz_attempts_user_idx` ON `quiz_attempts` (`user_id`);--> statement-breakpoint
CREATE INDEX `quiz_attempts_set_idx` ON `quiz_attempts` (`quiz_set_id`);--> statement-breakpoint
CREATE INDEX `quiz_questions_set_idx` ON `quiz_questions` (`quiz_set_id`,`position`);--> statement-breakpoint
CREATE INDEX `users_mobile_idx` ON `users` (`mobile`);