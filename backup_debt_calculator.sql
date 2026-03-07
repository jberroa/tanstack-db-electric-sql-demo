--
-- PostgreSQL database dump
--

\restrict kaHHfMqu4kRPVlGaODTs33y0gvcFTnf6LnelNvdszy3IxAElUujsztWzYYzSLOT

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP PUBLICATION IF EXISTS electric_publication_default;
ALTER TABLE IF EXISTS ONLY public.workbooks DROP CONSTRAINT IF EXISTS "workbooks_ownerId_fkey";
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS "sessions_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.debts DROP CONSTRAINT IF EXISTS "debts_workbookId_fkey";
ALTER TABLE IF EXISTS ONLY public.accounts DROP CONSTRAINT IF EXISTS "accounts_userId_fkey";
DROP INDEX IF EXISTS public."workbooks_ownerId_name_idx";
DROP INDEX IF EXISTS public."verifications_identifier_expiresAt_idx";
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public."sessions_userId_expiresAt_idx";
DROP INDEX IF EXISTS public.sessions_token_key;
DROP INDEX IF EXISTS public."debts_workbookId_name_idx";
DROP INDEX IF EXISTS public."accounts_userId_providerId_key";
ALTER TABLE IF EXISTS ONLY public.workbooks DROP CONSTRAINT IF EXISTS workbooks_pkey;
ALTER TABLE IF EXISTS ONLY public.verifications DROP CONSTRAINT IF EXISTS verifications_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.debts DROP CONSTRAINT IF EXISTS debts_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts DROP CONSTRAINT IF EXISTS accounts_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
DROP TABLE IF EXISTS public.workbooks;
DROP TABLE IF EXISTS public.verifications;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.sessions;
DROP TABLE IF EXISTS public.debts;
DROP TABLE IF EXISTS public.accounts;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP EXTENSION IF EXISTS "uuid-ossp";
--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "providerId" text NOT NULL,
    "accountId" text NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    scope text,
    password text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: debts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debts (
    id uuid NOT NULL,
    "workbookId" uuid NOT NULL,
    name character varying(48) NOT NULL,
    type character varying(12) NOT NULL,
    rate numeric(5,3) NOT NULL,
    balance numeric(10,2) NOT NULL,
    "minPayment" numeric(10,2) NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "limit" numeric(10,2),
    "dueDay" integer,
    CONSTRAINT debts_balance_check CHECK ((balance >= (0)::numeric)),
    CONSTRAINT "debts_minPayment_check" CHECK (("minPayment" >= (0)::numeric)),
    CONSTRAINT debts_rate_check CHECK ((rate >= (0)::numeric)),
    CONSTRAINT debts_type_check CHECK (((type)::text = ANY ((ARRAY['auto'::character varying, 'home'::character varying, 'credit'::character varying, 'school'::character varying, 'personal'::character varying, 'other'::character varying])::text[])))
);

ALTER TABLE ONLY public.debts REPLICA IDENTITY FULL;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    token text NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verifications (
    id uuid NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: workbooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workbooks (
    id uuid NOT NULL,
    name character varying(48) NOT NULL,
    "ownerId" uuid NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "monthlyPayment" numeric(10,2) DEFAULT 0 NOT NULL,
    strategy character varying(12) DEFAULT 'avalanche'::character varying NOT NULL,
    "planStartDate" date
);

ALTER TABLE ONLY public.workbooks REPLICA IDENTITY FULL;


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
cdfd2a54-0fe6-4388-b10a-d84610f1f568	a140e567ccdcabda06423629ab0a38a2da853d61b256a8d06050d9d2d2928f8b	2026-03-05 12:20:02.834064+00	20251115190648_init_db	\N	\N	2026-03-05 12:20:02.814006+00	1
0a3dce6a-068c-4132-a90a-0e01bbc3b106	51461c35b7e0cf2670033b725c429825273c8f3487c95e6a1123ef8b1a7b5111	2026-03-05 12:20:02.83735+00	20251115193828_update_id_strategy	\N	\N	2026-03-05 12:20:02.834661+00	1
cedc5dc1-fc02-495d-916d-2233d6cdcdf5	e0b8dfbb7c0e51769f592ddcf33f9fa28dd330abb036ed2cd717df5e7edaeded	2026-03-05 12:20:02.846297+00	20251115210154_add_workbooks_and_debts	\N	\N	2026-03-05 12:20:02.837854+00	1
1b3b7c8c-79a4-47fd-ada5-c87ce4ab4bc9	ffd267959ef3bd5fd9c96d54c07c8562fa48344e18a930aebad1952e6c251878	2026-03-05 12:20:02.849307+00	20251123185431_add_workbook_settings	\N	\N	2026-03-05 12:20:02.846759+00	1
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts (id, "userId", "providerId", "accountId", "accessToken", "refreshToken", "idToken", scope, password, "accessTokenExpiresAt", "refreshTokenExpiresAt", "createdAt", "updatedAt") FROM stdin;
019cbdf5-ef85-76ca-a4df-127908dcfabe	019cbdf5-ef80-7067-874a-79f0d2520bf0	credential	019cbdf5-ef80-7067-874a-79f0d2520bf0	\N	\N	\N	\N	56a5472cdf4874fb7ed66be8a7c2c476:1845caedb004ba75d5385b0b31ba637399bcddb3a74d7c660d5b1a0306b1009262ff83487b379796534cd13f84200bd689d4355a3eaa7b52e335428895f84529	\N	\N	2026-03-05 12:25:37.412+00	2026-03-05 12:25:37.412+00
\.


--
-- Data for Name: debts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.debts (id, "workbookId", name, type, rate, balance, "minPayment", "createdAt", "updatedAt", "limit", "dueDay") FROM stdin;
019cc09c-df2d-765b-a3c2-d4894951d410	019cbdf6-17ac-7351-9271-b3774a428712	Kays Jewely	other	29.990	4118.00	145.00	2026-03-06 00:47:12.492+00	2026-03-06 00:51:57.067+00	\N	\N
019cc0a1-b9f4-7408-8641-6bb3964337c7	019cbdf6-17ac-7351-9271-b3774a428712	Water Purifier	other	9.900	4020.00	65.00	2026-03-06 00:52:30.719+00	2026-03-06 00:53:09.078+00	\N	\N
019cc0a2-801e-74df-969d-22828f86c78a	019cbdf6-17ac-7351-9271-b3774a428712	Brenda Citi	credit	28.240	6725.00	182.00	2026-03-06 00:53:21.318+00	2026-03-06 00:53:48.421+00	\N	\N
019cc0a3-1019-76cc-a564-d8361711bf36	019cbdf6-17ac-7351-9271-b3774a428712	Brenda Capital One	credit	28.490	3508.00	142.00	2026-03-06 00:53:58.151+00	2026-03-06 00:54:27.399+00	\N	\N
019cc0a3-ffb1-716e-988c-226d7783b646	019cbdf6-17ac-7351-9271-b3774a428712	Brenda Chase	credit	27.240	6706.00	231.00	2026-03-06 00:54:59.432+00	2026-03-06 00:55:31.468+00	\N	\N
019cc0a4-bb0f-72bf-9967-a5b8fd229ea2	019cbdf6-17ac-7351-9271-b3774a428712	Brenda Saphire	credit	27.240	12590.00	407.00	2026-03-06 00:55:47.469+00	2026-03-06 00:56:08.93+00	\N	\N
019cc0a5-325e-7650-8677-eed5aec06ea7	019cbdf6-17ac-7351-9271-b3774a428712	Brenda Discover	credit	23.990	19872.00	408.00	2026-03-06 00:56:18.003+00	2026-03-06 00:56:45.678+00	\N	\N
019cc0a5-afed-73a1-a352-e4a772d197a1	019cbdf6-17ac-7351-9271-b3774a428712	Brenda Upstart	personal	14.400	5625.00	282.00	2026-03-06 00:56:50.14+00	2026-03-06 01:29:42.892+00	\N	\N
019cc098-ee0e-73bc-9d6e-ecf50893c366	019cbdf6-17ac-7351-9271-b3774a428712	Jorge Upstart	personal	15.240	8618.00	597.92	2026-03-06 00:42:54.138+00	2026-03-06 00:44:18.194+00	\N	5
019cbdf6-7494-77ba-9089-980b130a2c55	019cbdf6-17ac-7351-9271-b3774a428712	Jorge Chase 	credit	27.240	16984.00	555.00	2026-03-05 12:26:11.564+00	2026-03-06 00:45:02.185+00	19000.00	16
019cc097-3587-7572-b25c-c19d6dcb558f	019cbdf6-17ac-7351-9271-b3774a428712	Jorge Capital One	credit	27.150	9226.00	320.00	2026-03-06 00:41:01.214+00	2026-03-06 00:45:07.532+00	10500.00	11
019cbdf7-21ed-7563-ab59-b6f77274ddab	019cbdf6-17ac-7351-9271-b3774a428712	Apple Card	credit	25.490	3924.00	135.00	2026-03-05 12:26:55.964+00	2026-03-06 00:45:40.743+00	4500.00	5
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, "userId", token, "ipAddress", "userAgent", "expiresAt", "createdAt", "updatedAt") FROM stdin;
019cbdf5-ef8e-7306-b70d-178e77229de6	019cbdf5-ef80-7067-874a-79f0d2520bf0	XgW263LrcbUlB5PIOvok9r8eIPRynCYi	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/2.6.11 Chrome/142.0.7444.265 Electron/39.6.0 Safari/537.36	2026-03-12 12:25:37.422+00	2026-03-05 12:25:37.422+00	2026-03-05 12:25:37.422+00
019cc07d-c29f-723d-bcc1-9fd7a32b3abd	019cbdf5-ef80-7067-874a-79f0d2520bf0	3WBgQduQIWivEMSOBPeYnj6asGqUh2lj	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-13 00:13:13.234+00	2026-03-06 00:13:13.234+00	2026-03-06 00:13:13.234+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, "emailVerified", image, "createdAt", "updatedAt") FROM stdin;
019cbdf5-ef80-7067-874a-79f0d2520bf0	jorge	jorgeb174@gmail.com	f	\N	2026-03-05 12:25:37.407+00	2026-03-05 12:25:37.407+00
\.


--
-- Data for Name: verifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.verifications (id, identifier, value, "expiresAt", "createdAt", "updatedAt") FROM stdin;
019cbdf3-4904-753b-813e-70dbaf6c20d0	9HumOQg-UFqAIOeJg1FpzjU35-XzVU-P	{"callbackURL":"/dashboard","codeVerifier":"FxkObd7R3prJHoXf4oTCc7rr0TMERwIJDGpM3sOpO8k5X8n6YX3vburXCn8jF0kuRYsdPLBMEhLrJdom_f0IPMp12YRMnOqhc4NkbjFJKMu2t2JYZVUurU0cohM8_D_O","expiresAt":1772713963605}	2026-03-05 12:32:43.609+00	2026-03-05 12:22:43.609+00	2026-03-05 12:22:43.609+00
\.


--
-- Data for Name: workbooks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.workbooks (id, name, "ownerId", "createdAt", "updatedAt", "monthlyPayment", strategy, "planStartDate") FROM stdin;
019cbdf6-17ac-7351-9271-b3774a428712	My Workbook	019cbdf5-ef80-7067-874a-79f0d2520bf0	2026-03-05 12:25:49.075+00	2026-03-06 01:37:02.911+00	3669.92	avalanche	2026-03-01
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: debts debts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts
    ADD CONSTRAINT debts_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verifications verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verifications
    ADD CONSTRAINT verifications_pkey PRIMARY KEY (id);


--
-- Name: workbooks workbooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workbooks
    ADD CONSTRAINT workbooks_pkey PRIMARY KEY (id);


--
-- Name: accounts_userId_providerId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "accounts_userId_providerId_key" ON public.accounts USING btree ("userId", "providerId");


--
-- Name: debts_workbookId_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "debts_workbookId_name_idx" ON public.debts USING btree ("workbookId", name);


--
-- Name: sessions_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX sessions_token_key ON public.sessions USING btree (token);


--
-- Name: sessions_userId_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sessions_userId_expiresAt_idx" ON public.sessions USING btree ("userId", "expiresAt" DESC);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: verifications_identifier_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "verifications_identifier_expiresAt_idx" ON public.verifications USING btree (identifier, "expiresAt" DESC);


--
-- Name: workbooks_ownerId_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "workbooks_ownerId_name_idx" ON public.workbooks USING btree ("ownerId", name);


--
-- Name: accounts accounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: debts debts_workbookId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts
    ADD CONSTRAINT "debts_workbookId_fkey" FOREIGN KEY ("workbookId") REFERENCES public.workbooks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: workbooks workbooks_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workbooks
    ADD CONSTRAINT "workbooks_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: electric_publication_default; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION electric_publication_default WITH (publish = 'insert, update, delete, truncate', publish_generated_columns = stored);


--
-- Name: electric_publication_default debts; Type: PUBLICATION TABLE; Schema: public; Owner: -
--

ALTER PUBLICATION electric_publication_default ADD TABLE ONLY public.debts;


--
-- Name: electric_publication_default workbooks; Type: PUBLICATION TABLE; Schema: public; Owner: -
--

ALTER PUBLICATION electric_publication_default ADD TABLE ONLY public.workbooks;


--
-- PostgreSQL database dump complete
--

\unrestrict kaHHfMqu4kRPVlGaODTs33y0gvcFTnf6LnelNvdszy3IxAElUujsztWzYYzSLOT

