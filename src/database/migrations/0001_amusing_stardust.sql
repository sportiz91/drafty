CREATE TABLE `stripe_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`processed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`stripe_subscription_id` text NOT NULL,
	`stripe_customer_id` text NOT NULL,
	`status` text NOT NULL,
	`current_period_end` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_stripe_subscription_id_unique` ON `subscriptions` (`stripe_subscription_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_user_id_idx` ON `subscriptions` (`user_id`);--> statement-breakpoint
ALTER TABLE `users` ADD `stripe_customer_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `users_stripe_customer_id_unique` ON `users` (`stripe_customer_id`);