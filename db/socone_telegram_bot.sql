--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2 (Debian 17.2-1.pgdg120+1)
-- Dumped by pg_dump version 17.2

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

--
-- Name: employment_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.employment_type AS ENUM (
    'fulltime',
    'parttime'
);


ALTER TYPE public.employment_type OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name character varying NOT NULL,
    address character varying,
    district character varying,
    province character varying,
    country character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.branches OWNER TO postgres;

--
-- Name: checkins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.checkins (
    id integer NOT NULL,
    staff_id uuid NOT NULL,
    shift_id uuid NOT NULL,
    time_checkin timestamp with time zone NOT NULL,
    duration_hour smallint NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.checkins OWNER TO postgres;

--
-- Name: checkins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.checkins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.checkins_id_seq OWNER TO postgres;

--
-- Name: checkins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.checkins_id_seq OWNED BY public.checkins.id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    province character varying,
    country character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    branch_id uuid NOT NULL,
    name character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ip_address inet,
    mac_address character(17) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.devices OWNER TO postgres;

--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    staff_id uuid NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: shifts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shifts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    type character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.shifts OWNER TO postgres;

--
-- Name: staff_devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_devices (
    id integer NOT NULL,
    staff_id uuid NOT NULL,
    device_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.staff_devices OWNER TO postgres;

--
-- Name: staff_devices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.staff_devices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staff_devices_id_seq OWNER TO postgres;

--
-- Name: staff_devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.staff_devices_id_seq OWNED BY public.staff_devices.id;


--
-- Name: staffs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staffs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    department_id uuid NOT NULL,
    type_report character varying,
    tele_id character varying NOT NULL,
    full_name character varying NOT NULL,
    company_email character varying NOT NULL,
    "position" character varying(50),
    status character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    type_staff public.employment_type DEFAULT 'fulltime'::public.employment_type
);


ALTER TABLE public.staffs OWNER TO postgres;

--
-- Name: tele_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tele_accounts (
    id character varying NOT NULL,
    username character varying NOT NULL,
    phone character varying NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tele_accounts OWNER TO postgres;

--
-- Name: work_off_days; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_off_days (
    id integer NOT NULL,
    staff_id uuid NOT NULL,
    start_time timestamp with time zone NOT NULL,
    duration_hour smallint NOT NULL,
    status character varying NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.work_off_days OWNER TO postgres;

--
-- Name: work_off_days_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.work_off_days_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.work_off_days_id_seq OWNER TO postgres;

--
-- Name: work_off_days_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.work_off_days_id_seq OWNED BY public.work_off_days.id;


--
-- Name: checkins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkins ALTER COLUMN id SET DEFAULT nextval('public.checkins_id_seq'::regclass);


--
-- Name: staff_devices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_devices ALTER COLUMN id SET DEFAULT nextval('public.staff_devices_id_seq'::regclass);


--
-- Name: work_off_days id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_off_days ALTER COLUMN id SET DEFAULT nextval('public.work_off_days_id_seq'::regclass);


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branches (id, company_id, name, address, district, province, country, created_at, updated_at) FROM stdin;
904a4567-a6cc-4c24-87e8-62de852d0830	4a11722f-3605-4596-86ac-b566e6da4034	SoC.one (Hanoi)	\N	\N	Hà Nội	Vietnam	2025-01-20 12:04:40.609448+00	2025-01-20 12:04:40.609448+00
f1808384-2f21-4a50-bb8b-4956d7889f0d	4a11722f-3605-4596-86ac-b566e6da4034	SoC.one (Danang)	66 Võ Văn Tần	Thanh Khê	Đà Nẵng	Vietnam	2025-01-20 12:04:11.666667+00	2025-01-20 12:04:11.666667+00
\.


--
-- Data for Name: checkins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.checkins (id, staff_id, shift_id, time_checkin, duration_hour, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (id, name, province, country, created_at, updated_at) FROM stdin;
4a11722f-3605-4596-86ac-b566e6da4034	SoC	California	America	2025-01-20 12:03:13.475046+00	2025-01-20 12:03:13.475046+00
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, branch_id, name, created_at, updated_at) FROM stdin;
6bb6a98c-168e-4faa-94c4-2ebafffe0553	f1808384-2f21-4a50-bb8b-4956d7889f0d	IT	2025-01-20 12:05:07.529911+00	2025-01-20 12:05:07.529911+00
62b4756f-ecb9-4c4f-afeb-5dd9b97f72de	f1808384-2f21-4a50-bb8b-4956d7889f0d	Electronic	2025-01-20 12:05:26.015624+00	2025-01-20 12:05:26.015624+00
8ae3f307-891c-45a3-b7b8-e94ac26fa604	f1808384-2f21-4a50-bb8b-4956d7889f0d	FPGA	2025-01-21 03:37:57.177173+00	2025-01-21 03:37:57.177173+00
51f55904-04d1-4903-a5d5-ea1441dba333	904a4567-a6cc-4c24-87e8-62de852d0830	IT	2025-01-21 03:55:59.345292+00	2025-01-21 03:55:59.345292+00
14b70e52-52aa-498d-b2f1-e59cafeb16db	904a4567-a6cc-4c24-87e8-62de852d0830	Electronic	2025-01-21 03:56:23.209402+00	2025-01-21 03:56:23.209402+00
01bdeac4-de67-4c04-9a3e-fa6afb5fee7a	904a4567-a6cc-4c24-87e8-62de852d0830	FPGA	2025-01-21 03:56:39.735428+00	2025-01-21 03:56:39.735428+00
c39c5e68-96e3-42bb-ab10-f2d51cdba6d5	904a4567-a6cc-4c24-87e8-62de852d0830	BO	2025-01-22 02:29:07.237502+00	2025-01-22 02:29:07.237502+00
ad111fa2-05e8-41b6-8ada-e4f2bd3a6b91	f1808384-2f21-4a50-bb8b-4956d7889f0d	BO	2025-01-22 02:29:25.183269+00	2025-01-22 02:29:25.183269+00
\.


--
-- Data for Name: devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.devices (id, ip_address, mac_address, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, staff_id, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shifts (id, name, type, created_at, updated_at) FROM stdin;
ceaabace-bada-43fa-8891-cbe243437d6d	ot	special	2025-01-20 12:09:22.578843+00	2025-01-20 12:09:22.578843+00
0e85e707-1cf4-4381-ae3c-39a6f7ad9ef1	main	main	2025-01-20 12:09:34.575675+00	2025-01-20 12:09:34.575675+00
7fc2fa6d-8436-42c9-89d4-8116833a1aac	main	special	2025-01-20 12:09:55.111236+00	2025-01-20 12:09:55.111236+00
0a2cc79e-5d3d-400d-9ef4-2bc052829131	time in lieu	special	2025-01-20 12:09:46.655376+00	2025-01-20 12:09:46.655376+00
\.


--
-- Data for Name: staff_devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff_devices (id, staff_id, device_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: staffs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staffs (id, department_id, type_report, tele_id, full_name, company_email, "position", status, created_at, updated_at, type_staff) FROM stdin;
\.


--
-- Data for Name: tele_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tele_accounts (id, username, phone, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: work_off_days; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.work_off_days (id, staff_id, start_time, duration_hour, status, reason, created_at, updated_at) FROM stdin;
\.


--
-- Name: checkins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.checkins_id_seq', 34, true);


--
-- Name: staff_devices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.staff_devices_id_seq', 47, true);


--
-- Name: work_off_days_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.work_off_days_id_seq', 51, true);


--
-- Name: branches branch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branch_pkey PRIMARY KEY (id);


--
-- Name: checkins checkins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT checkins_pkey PRIMARY KEY (id);


--
-- Name: companies company_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT company_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (id);


--
-- Name: staff_devices staff_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_devices
    ADD CONSTRAINT staff_devices_pkey PRIMARY KEY (id);


--
-- Name: staffs staffs_company_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staffs
    ADD CONSTRAINT staffs_company_email_key UNIQUE (company_email);


--
-- Name: staffs staffs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staffs
    ADD CONSTRAINT staffs_pkey PRIMARY KEY (id);


--
-- Name: staffs staffs_tele_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staffs
    ADD CONSTRAINT staffs_tele_id_key UNIQUE (tele_id);


--
-- Name: tele_accounts tele_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tele_accounts
    ADD CONSTRAINT tele_accounts_pkey PRIMARY KEY (id);


--
-- Name: work_off_days work_off_days_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_off_days
    ADD CONSTRAINT work_off_days_pkey PRIMARY KEY (id);


--
-- Name: branches fk_branch_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT fk_branch_company FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: checkins fk_checkins_shift; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT fk_checkins_shift FOREIGN KEY (shift_id) REFERENCES public.shifts(id);


--
-- Name: checkins fk_checkins_staff; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT fk_checkins_staff FOREIGN KEY (staff_id) REFERENCES public.staffs(id);


--
-- Name: departments fk_departments_branch; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT fk_departments_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: reports fk_reports_staff; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT fk_reports_staff FOREIGN KEY (staff_id) REFERENCES public.staffs(id);


--
-- Name: staff_devices fk_staff_devices_device; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_devices
    ADD CONSTRAINT fk_staff_devices_device FOREIGN KEY (device_id) REFERENCES public.devices(id);


--
-- Name: staff_devices fk_staff_devices_staff; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_devices
    ADD CONSTRAINT fk_staff_devices_staff FOREIGN KEY (staff_id) REFERENCES public.staffs(id);


--
-- Name: staffs fk_staffs_departments; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staffs
    ADD CONSTRAINT fk_staffs_departments FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: staffs fk_staffs_tele; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staffs
    ADD CONSTRAINT fk_staffs_tele FOREIGN KEY (tele_id) REFERENCES public.tele_accounts(id);


--
-- Name: work_off_days fk_work_off_days_staff; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_off_days
    ADD CONSTRAINT fk_work_off_days_staff FOREIGN KEY (staff_id) REFERENCES public.staffs(id);


--
-- PostgreSQL database dump complete
--

