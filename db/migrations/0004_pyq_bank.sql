-- PYQ question bank: align option ids with quiz questions (A-D) and add
-- paper source, question number, publish flag and ordering.
--
-- Existing rows store options as [{id:1..4}] with an integer correct_option.
-- The data is converted in place before/after the column type changes so no
-- previous-year question is lost.

-- 1. Option ids 1,2,3,4 -> A,B,C,D (only rows that still use the old shape)
UPDATE `pyqs`
   SET `options` = JSON_SET(`options`, '$[0].id', 'A', '$[1].id', 'B', '$[2].id', 'C', '$[3].id', 'D')
 WHERE JSON_EXTRACT(`options`, '$[*].id') = CAST('[1, 2, 3, 4]' AS JSON);--> statement-breakpoint

-- 2. correct_option int -> varchar(1); values become '1'..'4' at this point
ALTER TABLE `pyqs` MODIFY COLUMN `correct_option` varchar(1) NOT NULL;--> statement-breakpoint

-- 3. '1'..'4' -> 'A'..'D' (anything already lettered is left alone)
UPDATE `pyqs`
   SET `correct_option` = CASE `correct_option`
         WHEN '1' THEN 'A'
         WHEN '2' THEN 'B'
         WHEN '3' THEN 'C'
         WHEN '4' THEN 'D'
         ELSE `correct_option`
       END;--> statement-breakpoint

-- 4. New columns (additive)
ALTER TABLE `pyqs` ADD `source` varchar(191);--> statement-breakpoint
ALTER TABLE `pyqs` ADD `question_number` int;--> statement-breakpoint
ALTER TABLE `pyqs` ADD `is_published` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `pyqs` ADD `sort_order` int DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `pyqs_published_idx` ON `pyqs` (`is_published`,`year`);
