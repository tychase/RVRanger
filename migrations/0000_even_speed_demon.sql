CREATE TABLE "chassis_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "chassis_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "converters" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"description" text,
	CONSTRAINT "converters_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"rv_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"rv_id" integer NOT NULL,
	"user_id" integer,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"is_read" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "manufacturers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"description" text,
	CONSTRAINT "manufacturers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "rv_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"rv_id" integer NOT NULL,
	"image_url" text NOT NULL,
	"is_primary" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "rv_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"year" integer NOT NULL,
	"price" double precision NOT NULL,
	"manufacturer_id" integer NOT NULL,
	"converter_id" integer,
	"chassis_type_id" integer,
	"type_id" integer NOT NULL,
	"length" double precision,
	"mileage" integer,
	"location" text NOT NULL,
	"fuel_type" text,
	"bed_type" text,
	"slides" integer,
	"featured_image" text NOT NULL,
	"is_featured" boolean DEFAULT false,
	"seller_id" integer NOT NULL,
	"source_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "rv_listings_source_id_unique" UNIQUE("source_id")
);
--> statement-breakpoint
CREATE TABLE "rv_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	CONSTRAINT "rv_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"phone" text,
	"is_admin" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
