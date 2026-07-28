CREATE TABLE "books" (
	"uci" text PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"writer" text,
	"publisher" text,
	CONSTRAINT "books_number_unique" UNIQUE("number"),
	CONSTRAINT "books_slug_unique" UNIQUE("slug"),
	CONSTRAINT "books_uci_check" CHECK ("books"."uci" = 'BF' || "books"."number"),
	CONSTRAINT "books_number_check" CHECK ("books"."number" > 0)
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"uci" text PRIMARY KEY NOT NULL,
	"book_uci" text NOT NULL,
	"page_no" integer NOT NULL,
	"html" text NOT NULL,
	"footnotes" text,
	CONSTRAINT "pages_book_page_unique" UNIQUE("book_uci","page_no"),
	CONSTRAINT "pages_uci_check" CHECK ("pages"."uci" = 'BP' || substring("pages"."book_uci" from 3) || lpad("pages"."page_no"::text, 4, '0')),
	CONSTRAINT "pages_page_no_check" CHECK ("pages"."page_no" BETWEEN 1 AND 9999)
);
--> statement-breakpoint
CREATE TABLE "toc_entries" (
	"uci" text PRIMARY KEY NOT NULL,
	"book_uci" text NOT NULL,
	"number_in_book" integer NOT NULL,
	"level" smallint NOT NULL,
	"parent_uci" text,
	"title" text NOT NULL,
	"page_uci" text NOT NULL,
	CONSTRAINT "toc_entries_book_number_unique" UNIQUE("book_uci","number_in_book"),
	CONSTRAINT "toc_entries_uci_check" CHECK ("toc_entries"."uci" = 'BT' || substring("toc_entries"."book_uci" from 3) || lpad("toc_entries"."number_in_book"::text, 4, '0')),
	CONSTRAINT "toc_entries_number_in_book_check" CHECK ("toc_entries"."number_in_book" BETWEEN 1 AND 9999),
	CONSTRAINT "toc_entries_level_check" CHECK ("toc_entries"."level" IN (1, 2)),
	CONSTRAINT "toc_entries_parent_check" CHECK (("toc_entries"."level" = 1 AND "toc_entries"."parent_uci" IS NULL)
       OR ("toc_entries"."level" = 2 AND "toc_entries"."parent_uci" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_book_uci_books_uci_fk" FOREIGN KEY ("book_uci") REFERENCES "public"."books"("uci") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "toc_entries" ADD CONSTRAINT "toc_entries_book_uci_books_uci_fk" FOREIGN KEY ("book_uci") REFERENCES "public"."books"("uci") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "toc_entries" ADD CONSTRAINT "toc_entries_parent_uci_toc_entries_uci_fk" FOREIGN KEY ("parent_uci") REFERENCES "public"."toc_entries"("uci") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "toc_entries" ADD CONSTRAINT "toc_entries_page_uci_pages_uci_fk" FOREIGN KEY ("page_uci") REFERENCES "public"."pages"("uci") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "toc_entries_page_uci_idx" ON "toc_entries" USING btree ("page_uci");--> statement-breakpoint
CREATE INDEX "toc_entries_parent_uci_idx" ON "toc_entries" USING btree ("parent_uci");