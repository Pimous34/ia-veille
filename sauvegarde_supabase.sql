


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






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."delete_old_users"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
DECLARE
  deleted_auth_count INT;
  deleted_students_count INT;
  expired_emails TEXT[];
BEGIN
  -- 1. Identify users created more than 16 months ago (excluding admins)
  SELECT array_agg(email)
  INTO expired_emails
  FROM auth.users
  WHERE created_at < (now() - INTERVAL '16 months')
  AND email NOT IN (SELECT email FROM public.admins);

  -- If no users found, return early
  IF expired_emails IS NULL OR array_length(expired_emails, 1) IS NULL THEN
     RETURN jsonb_build_object(
       'success', true, 
       'message', 'No expired users found.',
       'deleted_auth', 0,
       'deleted_students', 0
     );
  END IF;

  -- 2. Delete from 'students' table first
  WITH del_stu AS (
    DELETE FROM public.students
    WHERE email = ANY(expired_emails)
    RETURNING 1
  )
  SELECT count(*) INTO deleted_students_count FROM del_stu;

  -- 3. Delete from 'auth.users' table
  WITH del_auth AS (
    DELETE FROM auth.users
    WHERE email = ANY(expired_emails)
    RETURNING 1
  )
  SELECT count(*) INTO deleted_auth_count FROM del_auth;

  RETURN jsonb_build_object(
    'success', true,
    'message', format('Deleted %s auth users and %s student profiles.', deleted_auth_count, deleted_students_count),
    'deleted_auth', deleted_auth_count,
    'deleted_students', deleted_students_count
  );
END;
$$;


ALTER FUNCTION "public"."delete_old_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- Use ON CONFLICT to just update timestamp if user already exists
  insert into public.user_profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  
  -- Initialize flashcards for the new user
  insert into public.user_flashcards (user_id, template_id, due, stability, difficulty, elapsed_days, scheduled_days, reps, state, lapses, learning_steps)
  select 
    new.id,
    id,
    now(),
    0, 0, 0, 0, 0, 0, 0, 0
  from public.flashcard_templates;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_threshold" double precision DEFAULT 0.5, "match_count" integer DEFAULT 10, "filter" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("id" bigint, "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
    AS $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  and documents.metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;


ALTER FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."on_reading_history_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- 1. Increment read count in user_profiles
  update public.user_profiles
  set 
    articles_read_count = articles_read_count + 1,
    last_active_at = now()
  where id = new.user_id;

  -- 2. Upsert into article_interactions
  if new.article_id is not null then
    insert into public.article_interactions (user_id, article_id, is_read, last_interacted_at)
    values (new.user_id, new.article_id, true, now())
    on conflict (user_id, article_id) do update
    set 
        is_read = true,
        last_interacted_at = now();
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."on_reading_history_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE FOREIGN DATA WRAPPER "airtable" HANDLER "extensions"."airtable_fdw_handler" VALIDATOR "extensions"."airtable_fdw_validator";




CREATE SERVER "airtable_server" FOREIGN DATA WRAPPER "airtable" OPTIONS (
    "api_key_id" '3ec4ca0d-5af7-43f9-b304-0e9c2c75503e'
);


ALTER SERVER "airtable_server" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Airtable_Knowledge" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "content" "text",
    "embedding" "text",
    "metadata" "text"
);


ALTER TABLE "public"."Airtable_Knowledge" OWNER TO "postgres";


ALTER TABLE "public"."Airtable_Knowledge" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Airtable_Knowledge_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Source_rag" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "site" "text",
    "info" "text"
);


ALTER TABLE "public"."Source_rag" OWNER TO "postgres";


ALTER TABLE "public"."Source_rag" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Source_rag_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."admins" (
    "id" "text" NOT NULL,
    "email" "text",
    "first_name" "text",
    "last_name" "text",
    "updated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "createdTime" "text"
);


ALTER TABLE "public"."admins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_messages" (
    "id" bigint NOT NULL,
    "text" "text" NOT NULL,
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "active" boolean DEFAULT true,
    "promo_id" "uuid",
    "link" "text",
    CONSTRAINT "app_messages_type_check" CHECK (("type" = ANY (ARRAY['info'::"text", 'alert'::"text", 'success'::"text"])))
);


ALTER TABLE "public"."app_messages" OWNER TO "postgres";


ALTER TABLE "public"."app_messages" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."app_messages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."article_interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "article_id" "uuid" NOT NULL,
    "is_read" boolean DEFAULT false,
    "is_liked" boolean DEFAULT false,
    "is_bookmarked" boolean DEFAULT false,
    "last_interacted_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."article_interactions" OWNER TO "postgres";


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
    "author" "text",
    "view_count" integer DEFAULT 0,
    "rss_guid" "text",
    "canonical_url" "text",
    "source_url" "text",
    "is_daily_news" boolean DEFAULT false,
    "daily_news_date" "date",
    "relevance_score" numeric(5,2),
    "resume_ia" "text"
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
    CONSTRAINT "daily_news_videos_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('pending'::character varying)::"text", ('processing'::character varying)::"text", ('completed'::character varying)::"text", ('failed'::character varying)::"text"])))
);


ALTER TABLE "public"."daily_news_videos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" bigint NOT NULL,
    "content" "text",
    "metadata" "jsonb",
    "embedding" "public"."vector"(768)
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."documents_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."documents_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."documents_id_seq" OWNED BY "public"."documents"."id";



CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" bigint NOT NULL,
    "nom" "text" NOT NULL,
    "description" "text",
    "ville" "text",
    "date" "date",
    "url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."events" OWNER TO "postgres";


ALTER TABLE "public"."events" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."feedback_students" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "content" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "subject" "text",
    "message" "text"
);


ALTER TABLE "public"."feedback_students" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."flashcard_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "front" "text" NOT NULL,
    "back" "text" NOT NULL,
    "category" "text",
    "tags" "text"[],
    "source_article_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."flashcard_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."intervenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "nom" "text",
    "prenom" "text",
    "role" "text" DEFAULT 'Intervenant'::"text",
    "specialties" "text"[],
    "bio" "text",
    "avatar_url" "text",
    "linkedin_url" "text",
    "website_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."intervenants" OWNER TO "postgres";


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
    CONSTRAINT "newsletters_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('pending'::character varying)::"text", ('sent'::character varying)::"text", ('failed'::character varying)::"text"])))
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


CREATE TABLE IF NOT EXISTS "public"."promos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "year" integer,
    "start_date" "date",
    "end_date" "date",
    "pedagogical_referent" "text",
    "administrative_referent" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tuto_config" "jsonb" DEFAULT '{}'::"jsonb",
    "video_config" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "promos_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'archived'::"text", 'planned'::"text"])))
);


ALTER TABLE "public"."promos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "article_title" "text",
    "article_category" "text",
    "article_tags" "text"[],
    "read_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reading_duration" integer DEFAULT 0,
    "article_id" "uuid"
);


ALTER TABLE "public"."reading_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ressources_intervenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "prenom" "text",
    "nom" "text",
    "sujet_intervention" "text",
    "infos_apprenants" "text",
    "fichiers" "text"[],
    "linkedin" "text",
    "session_date" "text"
);


ALTER TABLE "public"."ressources_intervenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_articles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "article_id" "uuid",
    "saved_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text",
    "status" "text" DEFAULT 'saved'::"text",
    CONSTRAINT "saved_articles_status_check" CHECK (("status" = ANY (ARRAY['saved'::"text", 'watch_later'::"text"])))
);


ALTER TABLE "public"."saved_articles" OWNER TO "postgres";


CREATE FOREIGN TABLE "public"."source" (
    "nom" "text"
)
SERVER "airtable_server"
OPTIONS (
    "base_id" 'appCP9nGi8chxWJd3',
    "schema" 'public',
    "table_id" 'tblaO2M5nTytJZKIT'
);


ALTER FOREIGN TABLE "public"."source" OWNER TO "postgres";


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
    CONSTRAINT "sources_fetch_status_check" CHECK ((("fetch_status")::"text" = ANY (ARRAY[('active'::character varying)::"text", ('paused'::character varying)::"text", ('error'::character varying)::"text"]))),
    CONSTRAINT "sources_type_check" CHECK ((("type")::"text" = ANY (ARRAY[('rss'::character varying)::"text", ('api'::character varying)::"text", ('scraping'::character varying)::"text", ('twitter'::character varying)::"text"])))
);


ALTER TABLE "public"."sources" OWNER TO "postgres";


COMMENT ON COLUMN "public"."sources"."last_fetch_date" IS 'Last time this RSS feed was successfully fetched';



COMMENT ON COLUMN "public"."sources"."fetch_status" IS 'Current status of RSS feed fetching: active, paused, or error';



COMMENT ON COLUMN "public"."sources"."fetch_error_count" IS 'Number of consecutive fetch errors';



COMMENT ON COLUMN "public"."sources"."last_error_message" IS 'Last error message encountered during fetch';



CREATE TABLE IF NOT EXISTS "public"."students" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text",
    "promo_id" "uuid",
    "profile_picture_url" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "onboarding_email_sent" boolean DEFAULT false,
    CONSTRAINT "students_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'alumni'::"text", 'dropout'::"text"])))
);


ALTER TABLE "public"."students" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."suggested_flashcards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "front" "text" NOT NULL,
    "back" "text" NOT NULL,
    "category" character varying(100),
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "type" character varying(20) DEFAULT 'new_card'::character varying,
    "template_id" "uuid",
    CONSTRAINT "suggested_flashcards_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[]))),
    CONSTRAINT "suggested_flashcards_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['new_card'::character varying, 'deletion'::character varying])::"text"[])))
);


ALTER TABLE "public"."suggested_flashcards" OWNER TO "postgres";


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
    CONSTRAINT "user_activity_log_action_check" CHECK ((("action")::"text" = ANY (ARRAY[('view'::character varying)::"text", ('click'::character varying)::"text", ('save'::character varying)::"text", ('like'::character varying)::"text", ('dislike'::character varying)::"text", ('share'::character varying)::"text"])))
);


ALTER TABLE "public"."user_activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_flashcards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "front" "text",
    "back" "text",
    "due" timestamp with time zone DEFAULT "now"() NOT NULL,
    "stability" double precision DEFAULT 0 NOT NULL,
    "difficulty" double precision DEFAULT 0 NOT NULL,
    "elapsed_days" double precision DEFAULT 0 NOT NULL,
    "scheduled_days" double precision DEFAULT 0 NOT NULL,
    "reps" integer DEFAULT 0 NOT NULL,
    "state" integer DEFAULT 0 NOT NULL,
    "last_review" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "template_id" "uuid",
    "lapses" integer DEFAULT 0 NOT NULL,
    "learning_steps" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."user_flashcards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_message_actions" (
    "user_id" "uuid" NOT NULL,
    "message_id" bigint NOT NULL,
    "is_archived" boolean DEFAULT true,
    "archived_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_message_actions" OWNER TO "postgres";


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
    "articles_read_count" integer DEFAULT 0,
    "articles_liked_count" integer DEFAULT 0,
    "flashcards_mastered_count" integer DEFAULT 0,
    "xp_points" integer DEFAULT 0,
    "current_streak" integer DEFAULT 0,
    "last_active_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_profiles_experience_level_check" CHECK (("experience_level" = ANY (ARRAY['debutant'::"text", 'intermediaire'::"text", 'pro'::"text"]))),
    CONSTRAINT "user_profiles_newsletter_frequency_check" CHECK ((("newsletter_frequency")::"text" = ANY (ARRAY[('daily'::character varying)::"text", ('weekly'::character varying)::"text", ('monthly'::character varying)::"text"]))),
    CONSTRAINT "user_profiles_send_day_check" CHECK ((("send_day" >= 0) AND ("send_day" <= 6))),
    CONSTRAINT "user_profiles_user_type_check" CHECK (("user_type" = ANY (ARRAY['professionnel'::"text", 'particulier'::"text"])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."documents" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."documents_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Airtable_Knowledge"
    ADD CONSTRAINT "Airtable_Knowledge_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Source_rag"
    ADD CONSTRAINT "Source_rag_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_messages"
    ADD CONSTRAINT "app_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."article_interactions"
    ADD CONSTRAINT "article_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."article_interactions"
    ADD CONSTRAINT "article_interactions_user_id_article_id_key" UNIQUE ("user_id", "article_id");



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



ALTER TABLE ONLY "public"."feedback_students"
    ADD CONSTRAINT "daily_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_news_videos"
    ADD CONSTRAINT "daily_news_videos_date_key" UNIQUE ("date");



ALTER TABLE ONLY "public"."daily_news_videos"
    ADD CONSTRAINT "daily_news_videos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."flashcard_templates"
    ADD CONSTRAINT "flashcard_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."intervenants"
    ADD CONSTRAINT "intervenants_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."intervenants"
    ADD CONSTRAINT "intervenants_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."promos"
    ADD CONSTRAINT "promos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reading_history"
    ADD CONSTRAINT "reading_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ressources_intervenants"
    ADD CONSTRAINT "ressources_intervenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_articles"
    ADD CONSTRAINT "saved_articles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_articles"
    ADD CONSTRAINT "saved_articles_user_id_article_id_key" UNIQUE ("user_id", "article_id");



ALTER TABLE ONLY "public"."sources"
    ADD CONSTRAINT "sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suggested_flashcards"
    ADD CONSTRAINT "suggested_flashcards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_prompts"
    ADD CONSTRAINT "system_prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tutorials"
    ADD CONSTRAINT "tutorials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tutorials"
    ADD CONSTRAINT "tutorials_url_key" UNIQUE ("url");



ALTER TABLE ONLY "public"."user_activity_log"
    ADD CONSTRAINT "user_activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_flashcards"
    ADD CONSTRAINT "user_flashcards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_message_actions"
    ADD CONSTRAINT "user_message_actions_pkey" PRIMARY KEY ("user_id", "message_id");



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



CREATE INDEX "idx_promos_year" ON "public"."promos" USING "btree" ("year");



CREATE INDEX "idx_sources_last_fetch" ON "public"."sources" USING "btree" ("last_fetch_date");



CREATE INDEX "idx_students_email" ON "public"."students" USING "btree" ("email");



CREATE INDEX "idx_students_promo_id" ON "public"."students" USING "btree" ("promo_id");



CREATE INDEX "newsletters_user_idx" ON "public"."newsletters" USING "btree" ("user_id", "sent_at" DESC);



CREATE INDEX "saved_articles_user_idx" ON "public"."saved_articles" USING "btree" ("user_id", "saved_at" DESC);



CREATE INDEX "user_activity_article_idx" ON "public"."user_activity_log" USING "btree" ("article_id");



CREATE INDEX "user_activity_user_idx" ON "public"."user_activity_log" USING "btree" ("user_id", "timestamp" DESC);



CREATE OR REPLACE TRIGGER "trigger_on_reading_history_insert" AFTER INSERT ON "public"."reading_history" FOR EACH ROW EXECUTE FUNCTION "public"."on_reading_history_insert"();



CREATE OR REPLACE TRIGGER "update_articles_updated_at" BEFORE UPDATE ON "public"."articles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_promos_updated_at" BEFORE UPDATE ON "public"."promos" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_students_updated_at" BEFORE UPDATE ON "public"."students" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."app_messages"
    ADD CONSTRAINT "app_messages_promo_id_fkey" FOREIGN KEY ("promo_id") REFERENCES "public"."promos"("id");



ALTER TABLE ONLY "public"."article_interactions"
    ADD CONSTRAINT "article_interactions_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."article_interactions"
    ADD CONSTRAINT "article_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."article_scores"
    ADD CONSTRAINT "article_scores_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."article_scores"
    ADD CONSTRAINT "article_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."flashcard_templates"
    ADD CONSTRAINT "flashcard_templates_source_article_id_fkey" FOREIGN KEY ("source_article_id") REFERENCES "public"."articles"("id");



ALTER TABLE ONLY "public"."jt_backgrounds"
    ADD CONSTRAINT "jt_backgrounds_presenter_id_fkey" FOREIGN KEY ("presenter_id") REFERENCES "public"."photo_avatar_personnalite"("id");



ALTER TABLE ONLY "public"."newsletters"
    ADD CONSTRAINT "newsletters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reading_history"
    ADD CONSTRAINT "reading_history_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reading_history"
    ADD CONSTRAINT "reading_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_articles"
    ADD CONSTRAINT "saved_articles_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_articles"
    ADD CONSTRAINT "saved_articles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_promo_id_fkey" FOREIGN KEY ("promo_id") REFERENCES "public"."promos"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."suggested_flashcards"
    ADD CONSTRAINT "suggested_flashcards_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."flashcard_templates"("id");



ALTER TABLE ONLY "public"."suggested_flashcards"
    ADD CONSTRAINT "suggested_flashcards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_activity_log"
    ADD CONSTRAINT "user_activity_log_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_activity_log"
    ADD CONSTRAINT "user_activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_flashcards"
    ADD CONSTRAINT "user_flashcards_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."flashcard_templates"("id");



ALTER TABLE ONLY "public"."user_flashcards"
    ADD CONSTRAINT "user_flashcards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_message_actions"
    ADD CONSTRAINT "user_message_actions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."app_messages"("id");



ALTER TABLE ONLY "public"."user_message_actions"
    ADD CONSTRAINT "user_message_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete promos" ON "public"."promos" FOR DELETE USING (((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text") OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Admins can delete students" ON "public"."students" FOR DELETE USING (((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE (("admins"."email" = ("auth"."jwt"() ->> 'email'::"text")) OR ("admins"."email" ~~ (('%'::"text" || ("auth"."jwt"() ->> 'email'::"text")) || '%'::"text"))))) OR (("auth"."jwt"() ->> 'email'::"text") = 'benjamin.rigouste@gmail.com'::"text")));



CREATE POLICY "Admins can insert promos" ON "public"."promos" FOR INSERT WITH CHECK (((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text") OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Admins can insert students" ON "public"."students" FOR INSERT WITH CHECK (((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE (("admins"."email" = ("auth"."jwt"() ->> 'email'::"text")) OR ("admins"."email" ~~ (('%'::"text" || ("auth"."jwt"() ->> 'email'::"text")) || '%'::"text"))))) OR (("auth"."jwt"() ->> 'email'::"text") = 'benjamin.rigouste@gmail.com'::"text")));



CREATE POLICY "Admins can manage flashcard templates" ON "public"."flashcard_templates" USING (((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE (("admins"."email" = ("auth"."jwt"() ->> 'email'::"text")) OR ("admins"."email" ~~ (('%'::"text" || ("auth"."jwt"() ->> 'email'::"text")) || '%'::"text"))))) OR (("auth"."jwt"() ->> 'email'::"text") = 'benjamin.rigouste@gmail.com'::"text")));



CREATE POLICY "Admins can update" ON "public"."suggested_flashcards" FOR UPDATE USING (true);



CREATE POLICY "Admins can update promos" ON "public"."promos" FOR UPDATE USING (((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text") OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Admins can update students" ON "public"."students" FOR UPDATE USING (((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE (("admins"."email" = ("auth"."jwt"() ->> 'email'::"text")) OR ("admins"."email" ~~ (('%'::"text" || ("auth"."jwt"() ->> 'email'::"text")) || '%'::"text"))))) OR (("auth"."jwt"() ->> 'email'::"text") = 'benjamin.rigouste@gmail.com'::"text")));



CREATE POLICY "Allow internal access only" ON "public"."documents" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow public inserts" ON "public"."feedback_students" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public read access" ON "public"."admins" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."feedback_students" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."intervenants" FOR SELECT USING (true);



CREATE POLICY "Allow service role full access" ON "public"."feedback_students" USING (true);



CREATE POLICY "Allow service role full access" ON "public"."intervenants" USING (true) WITH CHECK (true);



CREATE POLICY "Anyone can read" ON "public"."suggested_flashcards" FOR SELECT USING (true);



CREATE POLICY "Articles are viewable by everyone" ON "public"."articles" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can read templates" ON "public"."flashcard_templates" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Daily news videos are viewable by everyone" ON "public"."daily_news_videos" FOR SELECT USING (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."jt_backgrounds" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") OR ("auth"."role"() = 'service_role'::"text")));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."sources" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for all users" ON "public"."app_messages" FOR SELECT USING (("active" = true));



CREATE POLICY "Enable read access for all users" ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."jt_backgrounds" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."planning_cours" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."sources" FOR SELECT USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."system_prompts" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users only" ON "public"."jt_backgrounds" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") OR ("auth"."role"() = 'service_role'::"text")));



CREATE POLICY "Enable update for authenticated users only" ON "public"."sources" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Events are viewable by everyone" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Lecture publique" ON "public"."ressources_intervenants" FOR SELECT USING (true);



CREATE POLICY "Modification publique" ON "public"."ressources_intervenants" FOR UPDATE USING (true);



CREATE POLICY "Only admins can insert articles" ON "public"."articles" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only admins can manage events" ON "public"."events" USING (((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text") OR (("auth"."jwt"() ->> 'email'::"text") IN ( SELECT "admins"."email"
   FROM "public"."admins"))));



CREATE POLICY "Only admins can update articles" ON "public"."articles" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Only service role can manage daily news videos" ON "public"."daily_news_videos" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Promos are viewable by everyone" ON "public"."promos" FOR SELECT USING (true);



CREATE POLICY "Public personalities are viewable by everyone" ON "public"."photo_avatar_personnalite" FOR SELECT USING (true);



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."user_profiles" FOR SELECT USING (true);



CREATE POLICY "Public tutorials are viewable by everyone" ON "public"."tutorials" FOR SELECT USING (true);



CREATE POLICY "Students are viewable by everyone" ON "public"."students" FOR SELECT USING (true);



CREATE POLICY "Suppression publique" ON "public"."ressources_intervenants" FOR DELETE USING (true);



CREATE POLICY "Users can delete their own flashcards" ON "public"."user_flashcards" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own activity" ON "public"."user_activity_log" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own flashcards" ON "public"."user_flashcards" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own reading history" ON "public"."reading_history" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own message actions" ON "public"."user_message_actions" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their saved articles" ON "public"."saved_articles" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can see their own flashcards" ON "public"."user_flashcards" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can suggest flashcards" ON "public"."suggested_flashcards" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own flashcards" ON "public"."user_flashcards" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view and edit their own interactions" ON "public"."article_interactions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own activity" ON "public"."user_activity_log" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own newsletters" ON "public"."newsletters" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own reading history" ON "public"."reading_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own scores" ON "public"."article_scores" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."article_interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback_students" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."intervenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ressources_intervenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Écriture publique" ON "public"."ressources_intervenants" FOR INSERT WITH CHECK (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";












GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";















GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "service_role";






























































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_old_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_old_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_old_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."on_reading_history_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."on_reading_history_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."on_reading_history_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "service_role";












GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "service_role";


















GRANT ALL ON TABLE "public"."Airtable_Knowledge" TO "anon";
GRANT ALL ON TABLE "public"."Airtable_Knowledge" TO "authenticated";
GRANT ALL ON TABLE "public"."Airtable_Knowledge" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Airtable_Knowledge_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Airtable_Knowledge_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Airtable_Knowledge_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Source_rag" TO "anon";
GRANT ALL ON TABLE "public"."Source_rag" TO "authenticated";
GRANT ALL ON TABLE "public"."Source_rag" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Source_rag_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Source_rag_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Source_rag_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."admins" TO "anon";
GRANT ALL ON TABLE "public"."admins" TO "authenticated";
GRANT ALL ON TABLE "public"."admins" TO "service_role";



GRANT ALL ON TABLE "public"."app_messages" TO "anon";
GRANT ALL ON TABLE "public"."app_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."app_messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."app_messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."app_messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."app_messages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."article_interactions" TO "anon";
GRANT ALL ON TABLE "public"."article_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."article_interactions" TO "service_role";



GRANT ALL ON TABLE "public"."article_scores" TO "anon";
GRANT ALL ON TABLE "public"."article_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."article_scores" TO "service_role";



GRANT ALL ON TABLE "public"."articles" TO "anon";
GRANT ALL ON TABLE "public"."articles" TO "authenticated";
GRANT ALL ON TABLE "public"."articles" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."daily_news_videos" TO "anon";
GRANT ALL ON TABLE "public"."daily_news_videos" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_news_videos" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."feedback_students" TO "anon";
GRANT ALL ON TABLE "public"."feedback_students" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback_students" TO "service_role";



GRANT ALL ON TABLE "public"."flashcard_templates" TO "anon";
GRANT ALL ON TABLE "public"."flashcard_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."flashcard_templates" TO "service_role";



GRANT ALL ON TABLE "public"."intervenants" TO "anon";
GRANT ALL ON TABLE "public"."intervenants" TO "authenticated";
GRANT ALL ON TABLE "public"."intervenants" TO "service_role";



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



GRANT ALL ON TABLE "public"."promos" TO "anon";
GRANT ALL ON TABLE "public"."promos" TO "authenticated";
GRANT ALL ON TABLE "public"."promos" TO "service_role";



GRANT ALL ON TABLE "public"."reading_history" TO "anon";
GRANT ALL ON TABLE "public"."reading_history" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_history" TO "service_role";



GRANT ALL ON TABLE "public"."ressources_intervenants" TO "anon";
GRANT ALL ON TABLE "public"."ressources_intervenants" TO "authenticated";
GRANT ALL ON TABLE "public"."ressources_intervenants" TO "service_role";



GRANT ALL ON TABLE "public"."saved_articles" TO "anon";
GRANT ALL ON TABLE "public"."saved_articles" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_articles" TO "service_role";



GRANT ALL ON TABLE "public"."source" TO "service_role";



GRANT ALL ON TABLE "public"."sources" TO "anon";
GRANT ALL ON TABLE "public"."sources" TO "authenticated";
GRANT ALL ON TABLE "public"."sources" TO "service_role";



GRANT ALL ON TABLE "public"."students" TO "anon";
GRANT ALL ON TABLE "public"."students" TO "authenticated";
GRANT ALL ON TABLE "public"."students" TO "service_role";



GRANT ALL ON TABLE "public"."suggested_flashcards" TO "anon";
GRANT ALL ON TABLE "public"."suggested_flashcards" TO "authenticated";
GRANT ALL ON TABLE "public"."suggested_flashcards" TO "service_role";



GRANT ALL ON TABLE "public"."system_prompts" TO "anon";
GRANT ALL ON TABLE "public"."system_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."system_prompts" TO "service_role";



GRANT ALL ON TABLE "public"."tutorials" TO "anon";
GRANT ALL ON TABLE "public"."tutorials" TO "authenticated";
GRANT ALL ON TABLE "public"."tutorials" TO "service_role";



GRANT ALL ON TABLE "public"."user_activity_log" TO "anon";
GRANT ALL ON TABLE "public"."user_activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."user_flashcards" TO "anon";
GRANT ALL ON TABLE "public"."user_flashcards" TO "authenticated";
GRANT ALL ON TABLE "public"."user_flashcards" TO "service_role";



GRANT ALL ON TABLE "public"."user_message_actions" TO "anon";
GRANT ALL ON TABLE "public"."user_message_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_message_actions" TO "service_role";



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































