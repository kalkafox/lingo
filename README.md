# lingo (on the web)

![lingo](https://i.imgur.com/Q3dN9mC.png)

## Building the database

If you want to build the database using Drizzle, run `npx/yarn/bunx drizzle-kit generate:mysql`.

If you want to use it with the MySQL client directly, (e.g piping the `.sql` file) you will need to replace `--->statement-breakpoint` and add the following before the `ALTER` queries:

```sql
USE `lingo`;
```

Otherwise, here is a sample schema generated directly from `src/db/schema.ts`:

```sql
CREATE DATABASE `lingo`;

CREATE TABLE `lingo`.`account` (
	`userId` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`provider` varchar(255) NOT NULL,
	`providerAccountId` varchar(255) NOT NULL,
	`refresh_token` varchar(255),
	`access_token` varchar(255),
	`expires_at` int,
	`token_type` varchar(255),
	`scope` varchar(255),
	`id_token` varchar(2048),
	`session_state` varchar(255),
	CONSTRAINT `account_provider_providerAccountId_pk` PRIMARY KEY(`provider`,`providerAccountId`)
);

CREATE TABLE `lingo`.`game_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uid` varchar(10),
	`wordId` int NOT NULL,
	`userId` varchar(255),
	`created_at` bigint NOT NULL,
	`finished_at` bigint,
	`history` json,
	`fingerprint` varchar(255),
	`attempts` int NOT NULL,
	CONSTRAINT `game_sessions_id` PRIMARY KEY(`id`)
);

CREATE TABLE `lingo`.`user` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255),
	`email` varchar(255) NOT NULL,
	`emailVerified` timestamp(3) DEFAULT (now()),
	`image` varchar(255),
	CONSTRAINT `user_id` PRIMARY KEY(`id`)
);

CREATE TABLE `lingo`.`words` (
	`id` int AUTO_INCREMENT NOT NULL,
	`word` varchar(255) NOT NULL,
	CONSTRAINT `words_id` PRIMARY KEY(`id`),
	CONSTRAINT `words_word_unique` UNIQUE(`word`)
);

CREATE TABLE `lingo`.`words_v2` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rank` int NOT NULL,
	`word` varchar(255) NOT NULL,
	`length` int NOT NULL,
	`freq` int NOT NULL,
	`numberOfTexts` int NOT NULL,
	`capsPercentage` float NOT NULL,
	CONSTRAINT `words_v2_id` PRIMARY KEY(`id`),
	CONSTRAINT `words_v2_word_unique` UNIQUE(`word`)
);

CREATE TABLE `lingo`.`session` (
	`sessionToken` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `session_sessionToken` PRIMARY KEY(`sessionToken`)
);

CREATE TABLE `lingo`.`verificationToken` (
	`identifier` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `verificationToken_identifier_token_pk` PRIMARY KEY(`identifier`,`token`)
);

USE `lingo`;

ALTER TABLE `account` ADD CONSTRAINT `account_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `game_sessions` ADD CONSTRAINT `game_sessions_wordId_words_v2_id_fk` FOREIGN KEY (`wordId`) REFERENCES `words_v2`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `game_sessions` ADD CONSTRAINT `game_sessions_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `session` ADD CONSTRAINT `session_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;
```

Once the database has been assembled with its columns, you should now be ready to populate it with the data necessary to have the game be processed in the runtime of the web app.

To do so, you will need to run the script located in `run/` named `build-db.ts`. Bun is required as a runtime, because the script calls libraries within Bun that is not part of the Node runtime (and is honestly probably better)

`bun run run/build-db.ts`
