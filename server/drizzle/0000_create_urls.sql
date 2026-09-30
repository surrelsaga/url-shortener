-- IF NOT EXISTS: my database already has this table from schema.sql (M9), keep its data
CREATE TABLE IF NOT EXISTS "urls" (
	"code" text PRIMARY KEY NOT NULL,
	"original_url" text NOT NULL
);
