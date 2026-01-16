


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."article_scores" (
    "article_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "score" numeric(5,2) NOT NULL,
    "calculated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."article_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."articles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" character varying(500) NOT NULL,
    "excerpt" "text",
    "content" "text",
    "url" "text" NOT NULL,
    "image_url" "text",
    "source_id" "uuid",
    "category_id" "uuid",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "read_time" integer,
    "author" character varying(200),
    "view_count" integer DEFAULT 0,
    "rss_guid" "text",
    "canonical_url" "text",
    "source_url" "text",
    "is_daily_news" boolean DEFAULT false,
    "daily_news_date" "date",
    "relevance_score" numeric(5,2)
);


ALTER TABLE "public"."articles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."articles"."rss_guid" IS 'GUID from RSS feed, used for deduplication';



COMMENT ON COLUMN "public"."articles"."canonical_url" IS 'Canonical URL of the article, used for deduplication';



COMMENT ON COLUMN "public"."articles"."source_url" IS 'URL of the source website';



CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "slug" character varying(100) NOT NULL,
    "description" "text",
    "color" character varying(7),
    "icon" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."daily_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_news_videos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "date" "date" NOT NULL,
    "title" character varying(500) NOT NULL,
    "script" "text" NOT NULL,
    "article_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "video_url" "text",
    "thumbnail_url" "text",
    "duration" integer,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "d_id_talk_id" character varying(100),
    "d_id_result" "jsonb",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "view_count" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "daily_news_videos_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying])::"text"[])))
);


ALTER TABLE "public"."daily_news_videos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jt_backgrounds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lieu" "text",
    "prompt" "text",
    "image_url" "text",
    "presenter_id" "uuid",
    "numero" integer,
    "presenter_script" "text",
    "is_generated" boolean DEFAULT false,
    "airtable_id" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."jt_backgrounds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."newsletters" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "sent_at" timestamp with time zone,
    "articles" "uuid"[] DEFAULT '{}'::"uuid"[],
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "newsletters_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'sent'::character varying, 'failed'::character varying])::"text"[])))
);


ALTER TABLE "public"."newsletters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."photo_avatar_personnalite" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "numero" integer,
    "nom" "text",
    "genre" "text",
    "status" "text",
    "contribution" "text",
    "image_url" "text",
    "airtable_id" "text",
    "generated" boolean DEFAULT false,
    "is_female" boolean,
    "is_alive" boolean DEFAULT true
);


ALTER TABLE "public"."photo_avatar_personnalite" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."planning_cours" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "google_event_id" "text",
    "title" "text" NOT NULL,
    "description" "text",
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone,
    "location" "text",
    "detected_topic" "text",
    "external_resources" "jsonb",
    "generated_prompt" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "organizer_email" "text"
);


ALTER TABLE "public"."planning_cours" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_articles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "article_id" "uuid",
    "saved_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text"
);


ALTER TABLE "public"."saved_articles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sources" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(200) NOT NULL,
    "url" "text" NOT NULL,
    "rss_url" "text",
    "type" character varying(20) NOT NULL,
    "logo_url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_fetch_date" timestamp with time zone,
    "fetch_status" character varying(20) DEFAULT 'active'::character varying,
    "fetch_error_count" integer DEFAULT 0,
    "last_error_message" "text",
    CONSTRAINT "sources_fetch_status_check" CHECK ((("fetch_status")::"text" = ANY ((ARRAY['active'::character varying, 'paused'::character varying, 'error'::character varying])::"text"[]))),
    CONSTRAINT "sources_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['rss'::character varying, 'api'::character varying, 'scraping'::character varying, 'twitter'::character varying])::"text"[])))
);


ALTER TABLE "public"."sources" OWNER TO "postgres";


COMMENT ON COLUMN "public"."sources"."last_fetch_date" IS 'Last time this RSS feed was successfully fetched';



COMMENT ON COLUMN "public"."sources"."fetch_status" IS 'Current status of RSS feed fetching: active, paused, or error';



COMMENT ON COLUMN "public"."sources"."fetch_error_count" IS 'Number of consecutive fetch errors';



COMMENT ON COLUMN "public"."sources"."last_error_message" IS 'Last error message encountered during fetch';



CREATE TABLE IF NOT EXISTS "public"."system_prompts" (
    "id" "text" NOT NULL,
    "content" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tutorials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "channel_name" "text",
    "url" "text" NOT NULL,
    "software" "text",
    "airtable_id" "text",
    "image_url" "text"
);


ALTER TABLE "public"."tutorials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_activity_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "article_id" "uuid",
    "action" character varying(20) NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_activity_log_action_check" CHECK ((("action")::"text" = ANY ((ARRAY['view'::character varying, 'click'::character varying, 'save'::character varying, 'like'::character varying, 'dislike'::character varying, 'share'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "email" character varying(255) NOT NULL,
    "full_name" character varying(200),
    "avatar_url" "text",
    "preferences" "jsonb" DEFAULT '{"sources": [], "keywords": [], "categories": [], "excluded_keywords": []}'::"jsonb",
    "newsletter_frequency" character varying(20) DEFAULT 'weekly'::character varying,
    "send_day" integer,
    "timezone" character varying(50) DEFAULT 'Europe/Paris'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_type" "text",
    "experience_level" "text",
    "ai_tools" "text"[],
    "interests" "text"[],
    "tools_used" "text"[],
    "wants_newsletter" boolean DEFAULT false,
    "onboarding_completed" boolean DEFAULT false,
    CONSTRAINT "user_profiles_experience_level_check" CHECK (("experience_level" = ANY (ARRAY['debutant'::"text", 'intermediaire'::"text", 'pro'::"text"]))),
    CONSTRAINT "user_profiles_newsletter_frequency_check" CHECK ((("newsletter_frequency")::"text" = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'monthly'::character varying])::"text"[]))),
    CONSTRAINT "user_profiles_send_day_check" CHECK ((("send_day" >= 0) AND ("send_day" <= 6))),
    CONSTRAINT "user_profiles_user_type_check" CHECK (("user_type" = ANY (ARRAY['professionnel'::"text", 'particulier'::"text"])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."article_scores"
    ADD CONSTRAINT "article_scores_pkey" PRIMARY KEY ("article_id", "user_id");



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_canonical_url_key" UNIQUE ("canonical_url");



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_url_key" UNIQUE ("url");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."daily_messages"
    ADD CONSTRAINT "daily_messages_date_key" UNIQUE ("date");



ALTER TABLE ONLY "public"."daily_messages"
    ADD CONSTRAINT "daily_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_news_videos"
    ADD CONSTRAINT "daily_news_videos_date_key" UNIQUE ("date");



ALTER TABLE ONLY "public"."daily_news_videos"
    ADD CONSTRAINT "daily_news_videos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jt_backgrounds"
    ADD CONSTRAINT "jt_backgrounds_airtable_id_key" UNIQUE ("airtable_id");



ALTER TABLE ONLY "public"."jt_backgrounds"
    ADD CONSTRAINT "jt_backgrounds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newsletters"
    ADD CONSTRAINT "newsletters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photo_avatar_personnalite"
    ADD CONSTRAINT "photo_avatar_personnalite_airtable_id_key" UNIQUE ("airtable_id");



ALTER TABLE ONLY "public"."photo_avatar_personnalite"
    ADD CONSTRAINT "photo_avatar_personnalite_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."planning_cours"
    ADD CONSTRAINT "planning_cours_google_event_id_key" UNIQUE ("google_event_id");



ALTER TABLE ONLY "public"."planning_cours"
    ADD CONSTRAINT "planning_cours_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_articles"
    ADD CONSTRAINT "saved_articles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_articles"
    ADD CONSTRAINT "saved_articles_user_id_article_id_key" UNIQUE ("user_id", "article_id");



ALTER TABLE ONLY "public"."sources"
    ADD CONSTRAINT "sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_prompts"
    ADD CONSTRAINT "system_prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tutorials"
    ADD CONSTRAINT "tutorials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tutorials"
    ADD CONSTRAINT "tutorials_url_key" UNIQUE ("url");



ALTER TABLE ONLY "public"."user_activity_log"
    ADD CONSTRAINT "user_activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "articles_content_idx" ON "public"."articles" USING "gin" ("to_tsvector"('"french"'::"regconfig", "content"));



CREATE INDEX "articles_daily_news_idx" ON "public"."articles" USING "btree" ("is_daily_news", "daily_news_date" DESC) WHERE ("is_daily_news" = true);



CREATE INDEX "articles_published_at_idx" ON "public"."articles" USING "btree" ("published_at" DESC);



CREATE INDEX "articles_tags_idx" ON "public"."articles" USING "gin" ("tags");



CREATE INDEX "articles_title_idx" ON "public"."articles" USING "gin" ("to_tsvector"('"french"'::"regconfig", ("title")::"text"));



CREATE INDEX "daily_news_videos_date_idx" ON "public"."daily_news_videos" USING "btree" ("date" DESC);



CREATE INDEX "daily_news_videos_status_idx" ON "public"."daily_news_videos" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_articles_rss_guid" ON "public"."articles" USING "btree" ("rss_guid") WHERE ("rss_guid" IS NOT NULL);



CREATE INDEX "idx_articles_source_url" ON "public"."articles" USING "btree" ("source_url");



CREATE INDEX "idx_sources_last_fetch" ON "public"."sources" USING "btree" ("last_fetch_date");



CREATE INDEX "newsletters_user_idx" ON "public"."newsletters" USING "btree" ("user_id", "sent_at" DESC);



CREATE INDEX "saved_articles_user_idx" ON "public"."saved_articles" USING "btree" ("user_id", "saved_at" DESC);



CREATE INDEX "user_activity_article_idx" ON "public"."user_activity_log" USING "btree" ("article_id");



CREATE INDEX "user_activity_user_idx" ON "public"."user_activity_log" USING "btree" ("user_id", "timestamp" DESC);



CREATE OR REPLACE TRIGGER "update_articles_updated_at" BEFORE UPDATE ON "public"."articles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."article_scores"
    ADD CONSTRAINT "article_scores_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."article_scores"
    ADD CONSTRAINT "article_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jt_backgrounds"
    ADD CONSTRAINT "jt_backgrounds_presenter_id_fkey" FOREIGN KEY ("presenter_id") REFERENCES "public"."photo_avatar_personnalite"("id");



ALTER TABLE ONLY "public"."newsletters"
    ADD CONSTRAINT "newsletters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_articles"
    ADD CONSTRAINT "saved_articles_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_articles"
    ADD CONSTRAINT "saved_articles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_activity_log"
    ADD CONSTRAINT "user_activity_log_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_activity_log"
    ADD CONSTRAINT "user_activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow public read access" ON "public"."daily_messages" FOR SELECT USING (true);



CREATE POLICY "Allow service role full access" ON "public"."daily_messages" USING (true);



CREATE POLICY "Articles are viewable by everyone" ON "public"."articles" FOR SELECT USING (true);



CREATE POLICY "Daily news videos are viewable by everyone" ON "public"."daily_news_videos" FOR SELECT USING (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."jt_backgrounds" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") OR ("auth"."role"() = 'service_role'::"text")));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."sources" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for all users" ON "public"."jt_backgrounds" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."planning_cours" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."sources" FOR SELECT USING (true);



CREATE POLICY "Enable update for authenticated users only" ON "public"."jt_backgrounds" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") OR ("auth"."role"() = 'service_role'::"text")));



CREATE POLICY "Enable update for authenticated users only" ON "public"."sources" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Only admins can insert articles" ON "public"."articles" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can update articles" ON "public"."articles" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only service role can manage daily news videos" ON "public"."daily_news_videos" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Public personalities are viewable by everyone" ON "public"."photo_avatar_personnalite" FOR SELECT USING (true);



CREATE POLICY "Public tutorials are viewable by everyone" ON "public"."tutorials" FOR SELECT USING (true);



CREATE POLICY "Users can insert their own activity" ON "public"."user_activity_log" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can manage their saved articles" ON "public"."saved_articles" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own activity" ON "public"."user_activity_log" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own newsletters" ON "public"."newsletters" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own scores" ON "public"."article_scores" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."article_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."articles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_news_videos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jt_backgrounds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newsletters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photo_avatar_personnalite" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."planning_cours" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_articles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tutorials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_activity_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";
























GRANT ALL ON TABLE "public"."article_scores" TO "anon";
GRANT ALL ON TABLE "public"."article_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."article_scores" TO "service_role";



GRANT ALL ON TABLE "public"."articles" TO "anon";
GRANT ALL ON TABLE "public"."articles" TO "authenticated";
GRANT ALL ON TABLE "public"."articles" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."daily_messages" TO "anon";
GRANT ALL ON TABLE "public"."daily_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_messages" TO "service_role";



GRANT ALL ON TABLE "public"."daily_news_videos" TO "anon";
GRANT ALL ON TABLE "public"."daily_news_videos" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_news_videos" TO "service_role";



GRANT ALL ON TABLE "public"."jt_backgrounds" TO "anon";
GRANT ALL ON TABLE "public"."jt_backgrounds" TO "authenticated";
GRANT ALL ON TABLE "public"."jt_backgrounds" TO "service_role";



GRANT ALL ON TABLE "public"."newsletters" TO "anon";
GRANT ALL ON TABLE "public"."newsletters" TO "authenticated";
GRANT ALL ON TABLE "public"."newsletters" TO "service_role";



GRANT ALL ON TABLE "public"."photo_avatar_personnalite" TO "anon";
GRANT ALL ON TABLE "public"."photo_avatar_personnalite" TO "authenticated";
GRANT ALL ON TABLE "public"."photo_avatar_personnalite" TO "service_role";



GRANT ALL ON TABLE "public"."planning_cours" TO "anon";
GRANT ALL ON TABLE "public"."planning_cours" TO "authenticated";
GRANT ALL ON TABLE "public"."planning_cours" TO "service_role";



GRANT ALL ON TABLE "public"."saved_articles" TO "anon";
GRANT ALL ON TABLE "public"."saved_articles" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_articles" TO "service_role";



GRANT ALL ON TABLE "public"."sources" TO "anon";
GRANT ALL ON TABLE "public"."sources" TO "authenticated";
GRANT ALL ON TABLE "public"."sources" TO "service_role";



GRANT ALL ON TABLE "public"."system_prompts" TO "anon";
GRANT ALL ON TABLE "public"."system_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."system_prompts" TO "service_role";



GRANT ALL ON TABLE "public"."tutorials" TO "anon";
GRANT ALL ON TABLE "public"."tutorials" TO "authenticated";
GRANT ALL ON TABLE "public"."tutorials" TO "service_role";



GRANT ALL ON TABLE "public"."user_activity_log" TO "anon";
GRANT ALL ON TABLE "public"."user_activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































