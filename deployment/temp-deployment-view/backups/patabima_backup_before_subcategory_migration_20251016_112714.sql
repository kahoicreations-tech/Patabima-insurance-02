--
-- PostgreSQL database dump
--

\restrict SF2Gzf5U8m3uCaP065hChbpiJQKX3UlosDRSaqk0KgAHlOx2K4VaIotTeazsqF8

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_additionalfieldpricing; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_additionalfieldpricing (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    field_code character varying(50) NOT NULL,
    pricing_data jsonb NOT NULL,
    effective_from date NOT NULL,
    effective_to date,
    subcategory_id uuid NOT NULL
);


ALTER TABLE public.app_additionalfieldpricing OWNER TO patabima_user;

--
-- Name: app_agentcommission; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_agentcommission (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    premium_amount numeric(12,2) NOT NULL,
    commission_rate numeric(5,2) NOT NULL,
    commission_amount numeric(12,2) NOT NULL,
    payment_status character varying(20) NOT NULL,
    payment_date date,
    payment_reference character varying(100) NOT NULL,
    notes text NOT NULL,
    agent_id uuid NOT NULL,
    policy_id uuid
);


ALTER TABLE public.app_agentcommission OWNER TO patabima_user;

--
-- Name: app_agentperformance; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_agentperformance (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    period character varying(20) NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    target_policies integer NOT NULL,
    target_premium numeric(12,2) NOT NULL,
    achieved_policies integer NOT NULL,
    achieved_premium numeric(12,2) NOT NULL,
    achievement_percentage numeric(5,2) NOT NULL,
    agent_id uuid NOT NULL
);


ALTER TABLE public.app_agentperformance OWNER TO patabima_user;

--
-- Name: app_campaign; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_campaign (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    name character varying(200) NOT NULL,
    description text NOT NULL,
    campaign_type character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    target_roles character varying(20) NOT NULL,
    target_regions jsonb NOT NULL,
    target_age_min integer,
    target_age_max integer,
    title character varying(150) NOT NULL,
    message text NOT NULL,
    image_url character varying(200) NOT NULL,
    call_to_action character varying(100) NOT NULL,
    action_url character varying(200) NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    budget numeric(12,2),
    target_impressions integer,
    target_clicks integer,
    target_conversions integer,
    total_impressions integer NOT NULL,
    total_clicks integer NOT NULL,
    total_conversions integer NOT NULL,
    total_spent numeric(12,2) NOT NULL,
    created_by_id uuid NOT NULL,
    banner_image character varying(100)
);


ALTER TABLE public.app_campaign OWNER TO patabima_user;

--
-- Name: app_campaigninteraction; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_campaigninteraction (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    interaction_type character varying(20) NOT NULL,
    ip_address inet,
    user_agent text NOT NULL,
    referrer character varying(200) NOT NULL,
    campaign_id uuid NOT NULL,
    user_id uuid NOT NULL
);


ALTER TABLE public.app_campaigninteraction OWNER TO patabima_user;

--
-- Name: app_campaignschedule; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_campaignschedule (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    frequency character varying(20) NOT NULL,
    days_of_week jsonb NOT NULL,
    day_of_month integer,
    time_of_day time without time zone NOT NULL,
    timezone character varying(50) NOT NULL,
    is_active boolean NOT NULL,
    last_sent timestamp with time zone,
    next_send timestamp with time zone,
    campaign_id uuid NOT NULL
);


ALTER TABLE public.app_campaignschedule OWNER TO patabima_user;

--
-- Name: app_claim; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_claim (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    policy_number character varying(64) NOT NULL,
    product character varying(32) NOT NULL,
    loss_date timestamp with time zone NOT NULL,
    loss_location character varying(255) NOT NULL,
    loss_description text NOT NULL,
    status character varying(20) NOT NULL,
    user_id uuid NOT NULL
);


ALTER TABLE public.app_claim OWNER TO patabima_user;

--
-- Name: app_claimdocument; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_claimdocument (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    doc_type character varying(64) NOT NULL,
    s3_key character varying(512) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_size integer NOT NULL,
    content_type character varying(128),
    claim_id uuid NOT NULL,
    CONSTRAINT app_claimdocument_file_size_check CHECK ((file_size >= 0))
);


ALTER TABLE public.app_claimdocument OWNER TO patabima_user;

--
-- Name: app_commercialtonnagepricing; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_commercialtonnagepricing (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    tonnage_from numeric(5,1) NOT NULL,
    tonnage_to numeric(5,1),
    tonnage_description character varying(100) NOT NULL,
    base_premium numeric(12,2) NOT NULL,
    fleet_discount_percentage numeric(6,2) NOT NULL,
    is_over_limit boolean NOT NULL,
    is_prime_mover boolean NOT NULL,
    effective_from date NOT NULL,
    effective_to date,
    subcategory_id uuid NOT NULL,
    underwriter_id uuid NOT NULL
);


ALTER TABLE public.app_commercialtonnagepricing OWNER TO patabima_user;

--
-- Name: app_commissionrule; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_commissionrule (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    name character varying(100) NOT NULL,
    rate numeric(5,2) NOT NULL,
    priority integer NOT NULL,
    line_key character varying(50),
    effective_start date,
    effective_end date,
    subcategory_id uuid,
    underwriter_id uuid
);


ALTER TABLE public.app_commissionrule OWNER TO patabima_user;

--
-- Name: app_commissionsettings; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_commissionsettings (
    id bigint NOT NULL,
    default_commission_rate numeric(5,2) NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.app_commissionsettings OWNER TO patabima_user;

--
-- Name: app_commissionsettings_id_seq; Type: SEQUENCE; Schema: public; Owner: patabima_user
--

ALTER TABLE public.app_commissionsettings ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.app_commissionsettings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: app_documentupload; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_documentupload (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    document_type character varying(50) NOT NULL,
    file_path character varying(500) NOT NULL,
    original_filename character varying(255) NOT NULL,
    extracted_data jsonb,
    extraction_confidence double precision,
    processing_status character varying(20) NOT NULL,
    quotation_id uuid NOT NULL,
    document_id character varying(100),
    agent_id character varying(100),
    policy_id character varying(100),
    file_size bigint,
    mime_type character varying(100),
    upload_method character varying(20),
    environment character varying(20),
    metadata jsonb
);


ALTER TABLE public.app_documentupload OWNER TO patabima_user;

--
-- Name: app_extendiblepricing; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_extendiblepricing (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    initial_period_days integer NOT NULL,
    initial_amount numeric(10,2) NOT NULL,
    balance_amount numeric(10,2) NOT NULL,
    total_annual_premium numeric(10,2) NOT NULL,
    extension_deadline_days integer NOT NULL,
    grace_period_days integer NOT NULL,
    cover_note_template text NOT NULL,
    full_certificate_template text NOT NULL,
    extension_reminder_template text NOT NULL,
    auto_reminder_schedule jsonb NOT NULL,
    penalty_for_late_extension numeric(5,2) NOT NULL,
    allow_partial_extension boolean NOT NULL,
    subcategory_id uuid NOT NULL,
    underwriter_id uuid NOT NULL,
    CONSTRAINT app_extendiblepricing_extension_deadline_days_check CHECK ((extension_deadline_days >= 0)),
    CONSTRAINT app_extendiblepricing_grace_period_days_check CHECK ((grace_period_days >= 0)),
    CONSTRAINT app_extendiblepricing_initial_period_days_check CHECK ((initial_period_days >= 0))
);


ALTER TABLE public.app_extendiblepricing OWNER TO patabima_user;

--
-- Name: app_extensionreminder; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_extensionreminder (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    reminder_type character varying(20) NOT NULL,
    scheduled_date timestamp with time zone NOT NULL,
    sent_date timestamp with time zone,
    status character varying(20) NOT NULL,
    message_template text NOT NULL,
    personalized_message text NOT NULL,
    delivery_channel character varying(100) NOT NULL,
    delivery_status character varying(100) NOT NULL,
    customer_response text NOT NULL,
    customer_response_date timestamp with time zone,
    follow_up_required boolean NOT NULL,
    policy_extension_id uuid NOT NULL
);


ALTER TABLE public.app_extensionreminder OWNER TO patabima_user;

--
-- Name: app_insuranceprovider; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_insuranceprovider (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50) NOT NULL,
    contact_email character varying(254),
    contact_phone character varying(30),
    address character varying(255),
    supported_categories jsonb NOT NULL,
    supported_payment_methods jsonb NOT NULL,
    features jsonb NOT NULL,
    display_mode character varying(10) NOT NULL
);


ALTER TABLE public.app_insuranceprovider OWNER TO patabima_user;

--
-- Name: app_insurancequotation; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_insurancequotation (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    insurance_type character varying(20) NOT NULL,
    quotation_number character varying(50) NOT NULL,
    status character varying(20) NOT NULL,
    form_data jsonb NOT NULL,
    base_premium numeric(10,2),
    training_levy numeric(10,2),
    stamp_duty numeric(10,2),
    total_premium numeric(10,2),
    dmvic_data jsonb,
    textract_data jsonb,
    selected_underwriter character varying(100),
    agent_id uuid NOT NULL
);


ALTER TABLE public.app_insurancequotation OWNER TO patabima_user;

--
-- Name: app_manualquote; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_manualquote (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    reference character varying(40) NOT NULL,
    line_key character varying(40) NOT NULL,
    payload jsonb NOT NULL,
    preferred_underwriters jsonb NOT NULL,
    status character varying(30) NOT NULL,
    computed_premium numeric(12,2),
    levies_breakdown jsonb,
    admin_notes text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    agent_id uuid NOT NULL
);


ALTER TABLE public.app_manualquote OWNER TO patabima_user;

--
-- Name: app_messagesmodels; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_messagesmodels (
    id integer NOT NULL,
    message_for character varying(100) NOT NULL,
    message text NOT NULL,
    variables jsonb NOT NULL,
    is_active boolean NOT NULL
);


ALTER TABLE public.app_messagesmodels OWNER TO patabima_user;

--
-- Name: app_messagesmodels_id_seq; Type: SEQUENCE; Schema: public; Owner: patabima_user
--

ALTER TABLE public.app_messagesmodels ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.app_messagesmodels_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: app_monthlyagentbonus; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_monthlyagentbonus (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date_created timestamp with time zone DEFAULT now() NOT NULL,
    date_updated timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    period character varying(20) NOT NULL,
    total_policies integer DEFAULT 0 NOT NULL,
    total_premium numeric(12,2) DEFAULT 0 NOT NULL,
    bonus_rate numeric(5,2) DEFAULT 0.30 NOT NULL,
    bonus_amount numeric(12,2) DEFAULT 0 NOT NULL,
    payment_status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    payment_date date,
    payment_reference character varying(100) DEFAULT ''::character varying NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    agent_id uuid NOT NULL
);


ALTER TABLE public.app_monthlyagentbonus OWNER TO patabima_user;

--
-- Name: app_motorcategory; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_motorcategory (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    icon character varying(10),
    pricing_type character varying(50) NOT NULL,
    sort_order integer NOT NULL,
    requires_tonnage boolean NOT NULL,
    requires_engine_capacity boolean NOT NULL,
    requires_passenger_count boolean NOT NULL,
    requires_passenger_type boolean NOT NULL,
    requires_carrying_capacity boolean NOT NULL,
    supports_time_period_variants boolean NOT NULL,
    min_vehicle_age integer NOT NULL,
    max_vehicle_age integer
);


ALTER TABLE public.app_motorcategory OWNER TO patabima_user;

--
-- Name: app_motorinsurancedetails; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_motorinsurancedetails (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    vehicle_make character varying(50) NOT NULL,
    vehicle_model character varying(50) NOT NULL,
    vehicle_year integer NOT NULL,
    vehicle_registration character varying(20) NOT NULL,
    chassis_number character varying(50),
    engine_number character varying(50),
    owner_name character varying(100) NOT NULL,
    owner_id_number character varying(15) NOT NULL,
    owner_kra_pin character varying(15),
    owner_phone character varying(15) NOT NULL,
    owner_email character varying(254),
    cover_start_date date NOT NULL,
    cover_end_date date NOT NULL,
    vehicle_usage character varying(50),
    vehicle_color character varying(30),
    seating_capacity integer,
    quotation_id uuid NOT NULL
);


ALTER TABLE public.app_motorinsurancedetails OWNER TO patabima_user;

--
-- Name: app_motorpolicy; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_motorpolicy (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    policy_number character varying(50) NOT NULL,
    quote_id character varying(100),
    client_details jsonb NOT NULL,
    vehicle_details jsonb NOT NULL,
    product_details jsonb NOT NULL,
    underwriter_details jsonb,
    premium_breakdown jsonb NOT NULL,
    payment_details jsonb NOT NULL,
    addons jsonb NOT NULL,
    documents jsonb NOT NULL,
    status character varying(20) NOT NULL,
    cover_start_date date,
    cover_end_date date,
    policy_document_url character varying(500),
    receipt_url character varying(500),
    certificate_url character varying(500),
    submitted_at timestamp with time zone NOT NULL,
    approved_at timestamp with time zone,
    notes text NOT NULL,
    agent_code character varying(50),
    approved_by_id uuid,
    user_id uuid,
    extension_count integer NOT NULL,
    is_renewal boolean NOT NULL,
    last_extension_date timestamp with time zone,
    original_policy_id uuid,
    renewal_count integer NOT NULL,
    renewed_at timestamp with time zone,
    total_extensions_amount numeric(10,2) NOT NULL
);


ALTER TABLE public.app_motorpolicy OWNER TO patabima_user;

--
-- Name: app_motorpricing; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_motorpricing (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    base_premium numeric(12,2) NOT NULL,
    minimum_premium numeric(12,2),
    pricing_factors jsonb NOT NULL,
    effective_from date NOT NULL,
    effective_to date,
    subcategory_id uuid NOT NULL,
    underwriter_id uuid NOT NULL,
    maximum_premium numeric(10,2),
    bracket_pricing jsonb
);


ALTER TABLE public.app_motorpricing OWNER TO patabima_user;

--
-- Name: app_motorsubcategory; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_motorsubcategory (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    subcategory_code character varying(80) NOT NULL,
    subcategory_name character varying(150) NOT NULL,
    product_type character varying(50) NOT NULL,
    description text,
    additional_fields jsonb NOT NULL,
    field_validations jsonb DEFAULT '{}'::jsonb NOT NULL,
    pricing_requirements jsonb NOT NULL,
    category_id uuid NOT NULL,
    extendible_variant_id uuid,
    is_extendible boolean DEFAULT false NOT NULL,
    pricing_model character varying(20) NOT NULL,
    is_complex boolean NOT NULL,
    cover_type_ref_id uuid,
    show_in_public boolean NOT NULL,
    public_sort_order integer NOT NULL,
    public_label character varying(120)
);


ALTER TABLE public.app_motorsubcategory OWNER TO patabima_user;

--
-- Name: app_otpmodel; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_otpmodel (
    id bigint NOT NULL,
    otp_for character varying(50) NOT NULL,
    code character varying(10) NOT NULL,
    expiry_time timestamp with time zone,
    "user" character varying(50) NOT NULL,
    date_created timestamp with time zone NOT NULL,
    is_verified boolean NOT NULL,
    date_updated timestamp with time zone NOT NULL
);


ALTER TABLE public.app_otpmodel OWNER TO patabima_user;

--
-- Name: app_otpmodel_id_seq; Type: SEQUENCE; Schema: public; Owner: patabima_user
--

ALTER TABLE public.app_otpmodel ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.app_otpmodel_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: app_policyextension; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_policyextension (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    policy_number character varying(50) NOT NULL,
    customer_name character varying(200) NOT NULL,
    customer_phone character varying(20) NOT NULL,
    customer_email character varying(254) NOT NULL,
    product_name character varying(200) NOT NULL,
    initial_premium_paid numeric(10,2) NOT NULL,
    initial_start_date date NOT NULL,
    initial_expiry_date date NOT NULL,
    balance_amount numeric(10,2) NOT NULL,
    extension_status character varying(20) NOT NULL,
    reminder_count integer NOT NULL,
    last_reminder_sent timestamp with time zone,
    extension_payment_date timestamp with time zone,
    extension_amount_paid numeric(10,2),
    full_certificate_issued boolean NOT NULL,
    final_expiry_date date,
    auto_reminder_enabled boolean NOT NULL,
    underwriter_id uuid NOT NULL,
    CONSTRAINT app_policyextension_reminder_count_check CHECK ((reminder_count >= 0))
);


ALTER TABLE public.app_policyextension OWNER TO patabima_user;

--
-- Name: app_psvpllprice; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_psvpllprice (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    vehicle_type character varying(100) NOT NULL,
    pll_rate_per_person numeric(12,2) NOT NULL,
    effective_from date NOT NULL,
    effective_to date,
    underwriter_id uuid NOT NULL
);


ALTER TABLE public.app_psvpllprice OWNER TO patabima_user;

--
-- Name: app_psvpllpricing; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_psvpllpricing (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    pll_amount numeric(10,2) NOT NULL,
    rate_per_person numeric(10,2) NOT NULL,
    is_commercial_institutional boolean NOT NULL,
    effective_from date NOT NULL,
    effective_to date,
    subcategory_id uuid NOT NULL,
    underwriter_id uuid NOT NULL
);


ALTER TABLE public.app_psvpllpricing OWNER TO patabima_user;

--
-- Name: app_publicuserprofile; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_publicuserprofile (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    idnum character varying(15),
    full_names character varying(50),
    dob date,
    physical_address character varying(100),
    gender character varying(10),
    is_email_verified boolean NOT NULL,
    is_phone_verified boolean NOT NULL,
    registration_number character varying(20) NOT NULL,
    user_id uuid
);


ALTER TABLE public.app_publicuserprofile OWNER TO patabima_user;

--
-- Name: app_serviceprocessinglog; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_serviceprocessinglog (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    service_type character varying(50) NOT NULL,
    request_data jsonb NOT NULL,
    response_data jsonb,
    processing_time integer,
    success boolean NOT NULL,
    error_message text,
    quotation_id uuid NOT NULL
);


ALTER TABLE public.app_serviceprocessinglog OWNER TO patabima_user;

--
-- Name: app_staffuserprofile; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_staffuserprofile (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    idnum character varying(15),
    full_names character varying(50),
    dob date,
    physical_address character varying(100),
    gender character varying(10),
    is_email_verified boolean NOT NULL,
    is_phone_verified boolean NOT NULL,
    agent_code integer NOT NULL,
    agent_prefix character varying(5) NOT NULL,
    user_id uuid
);


ALTER TABLE public.app_staffuserprofile OWNER TO patabima_user;

--
-- Name: app_user; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_user (
    password character varying(128) NOT NULL,
    last_login timestamp with time zone,
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    email character varying(255),
    phonenumber character varying(9) NOT NULL,
    role character varying(20) NOT NULL,
    nationality character varying(100) NOT NULL,
    country_code character varying(10) NOT NULL,
    is_admin boolean NOT NULL,
    is_staff boolean NOT NULL,
    created_by character varying(100) NOT NULL,
    is_default_password boolean NOT NULL
);


ALTER TABLE public.app_user OWNER TO patabima_user;

--
-- Name: app_vehicleadjustmentfactor; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.app_vehicleadjustmentfactor (
    id uuid NOT NULL,
    date_created timestamp with time zone,
    date_updated timestamp with time zone,
    is_active boolean NOT NULL,
    description character varying(200) NOT NULL,
    factor_type character varying(50) NOT NULL,
    factor_key character varying(50) NOT NULL,
    factor_value numeric(5,4) NOT NULL
);


ALTER TABLE public.app_vehicleadjustmentfactor OWNER TO patabima_user;

--
-- Name: auth_group; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.auth_group (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);


ALTER TABLE public.auth_group OWNER TO patabima_user;

--
-- Name: auth_group_id_seq; Type: SEQUENCE; Schema: public; Owner: patabima_user
--

ALTER TABLE public.auth_group ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_group_permissions; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.auth_group_permissions (
    id bigint NOT NULL,
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_group_permissions OWNER TO patabima_user;

--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: patabima_user
--

ALTER TABLE public.auth_group_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_permission; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.auth_permission (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id integer NOT NULL,
    codename character varying(100) NOT NULL
);


ALTER TABLE public.auth_permission OWNER TO patabima_user;

--
-- Name: auth_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: patabima_user
--

ALTER TABLE public.auth_permission ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_admin_log; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.django_admin_log (
    id integer NOT NULL,
    action_time timestamp with time zone NOT NULL,
    object_id text,
    object_repr character varying(200) NOT NULL,
    action_flag smallint NOT NULL,
    change_message text NOT NULL,
    content_type_id integer,
    user_id uuid NOT NULL,
    CONSTRAINT django_admin_log_action_flag_check CHECK ((action_flag >= 0))
);


ALTER TABLE public.django_admin_log OWNER TO patabima_user;

--
-- Name: django_admin_log_id_seq; Type: SEQUENCE; Schema: public; Owner: patabima_user
--

ALTER TABLE public.django_admin_log ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_admin_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_content_type; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.django_content_type (
    id integer NOT NULL,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);


ALTER TABLE public.django_content_type OWNER TO patabima_user;

--
-- Name: django_content_type_id_seq; Type: SEQUENCE; Schema: public; Owner: patabima_user
--

ALTER TABLE public.django_content_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_content_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_migrations; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.django_migrations (
    id bigint NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);


ALTER TABLE public.django_migrations OWNER TO patabima_user;

--
-- Name: django_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: patabima_user
--

ALTER TABLE public.django_migrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_session; Type: TABLE; Schema: public; Owner: patabima_user
--

CREATE TABLE public.django_session (
    session_key character varying(40) NOT NULL,
    session_data text NOT NULL,
    expire_date timestamp with time zone NOT NULL
);


ALTER TABLE public.django_session OWNER TO patabima_user;

--
-- Data for Name: app_additionalfieldpricing; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_additionalfieldpricing (id, date_created, date_updated, is_active, field_code, pricing_data, effective_from, effective_to, subcategory_id) FROM stdin;
a1055305-f6d5-4483-a9a3-50cc291c118b	2025-09-23 17:54:14.793639+03	2025-09-23 19:22:13.9272+03	t	passenger_capacity	{"max": 50, "min": 26, "type": "fixed", "adjustment": "5000"}	2024-01-01	\N	8a6b2335-aa56-4658-a15d-9c0db0062b2c
89c707df-d5e6-4260-b71c-ecde8e11b206	2025-09-23 18:10:46.305115+03	2025-09-23 19:22:13.936736+03	t	passenger_capacity	{"max": 50, "min": 26, "type": "fixed", "adjustment": "5000"}	2024-01-01	\N	accb806c-d4ba-4aa0-9ff0-bb7505fd78d2
1dda52e4-a7c0-469b-97d5-e90d410e0f0c	2025-09-23 18:10:46.314778+03	2025-09-23 19:22:13.944647+03	t	passenger_capacity	{"max": 50, "min": 26, "type": "fixed", "adjustment": "5000"}	2024-01-01	\N	55ec10f8-901f-4684-9601-d01944a85987
f583f370-35af-4c0e-bb13-b403667e8c64	2025-09-23 17:54:14.785207+03	2025-09-28 13:42:54.124516+03	t	tonnage	{"max": 31, "min": 16, "type": "fixed", "adjustment": "7000"}	2024-01-01	\N	5d6abafb-0ab9-418e-b37e-99d2447c137f
\.


--
-- Data for Name: app_agentcommission; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_agentcommission (id, date_created, date_updated, is_active, premium_amount, commission_rate, commission_amount, payment_status, payment_date, payment_reference, notes, agent_id, policy_id) FROM stdin;
5b757fca-2964-4cb1-95ff-3c48fffaaa38	2025-10-10 23:16:47.300629+03	2025-10-11 01:57:19.941283+03	t	3029.88	1.00	30.30	PENDING	\N		Auto-generated from policy POL-2025-208149	95069092-9673-4c6b-a137-19a3f6131272	4c9f1e6f-4150-414d-9050-c641a4cd5769
59a9f6e4-f960-4341-a170-6093567dc6c2	2025-10-10 23:16:47.308776+03	2025-10-16 00:01:07.053014+03	t	643.00	20.00	128.60	PENDING	\N		Auto-generated from policy POL-2025-433825	95069092-9673-4c6b-a137-19a3f6131272	89cc0106-7b71-4972-8e23-59e5cdde834b
\.


--
-- Data for Name: app_agentperformance; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_agentperformance (id, date_created, date_updated, is_active, period, period_start, period_end, target_policies, target_premium, achieved_policies, achieved_premium, achievement_percentage, agent_id) FROM stdin;
\.


--
-- Data for Name: app_campaign; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_campaign (id, date_created, date_updated, is_active, name, description, campaign_type, status, target_roles, target_regions, target_age_min, target_age_max, title, message, image_url, call_to_action, action_url, start_date, end_date, budget, target_impressions, target_clicks, target_conversions, total_impressions, total_clicks, total_conversions, total_spent, created_by_id, banner_image) FROM stdin;
f466680c-3af2-468a-baa6-6e030643c626	2025-10-15 23:43:52.41421+03	2025-10-15 23:53:02.441597+03	t	Professional campaign		PROMOTIONAL	ACTIVE	ALL	[]	\N	\N						2025-10-15 23:41:34+03	2025-10-22 23:41:38+03	\N	\N	\N	\N	7	0	0	0.00	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698	campaign_banners/2148410809_1.jpg
3ac76fd0-dfb8-4263-a7ee-959362bd0cdf	2025-10-15 23:31:17.390025+03	2025-10-15 23:31:17.390034+03	t	Tour promo		PROMOTIONAL	ACTIVE	ALL	[]	\N	\N						2025-10-15 23:30:36+03	2025-10-22 23:30:39+03	\N	\N	\N	\N	4	0	0	0.00	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698	campaign_banners/travel-promo-vector-banner-8.jpg
feca13b7-1ea2-4db2-a8e6-73d11283aed9	2025-10-15 23:22:11.787354+03	2025-10-15 23:34:31.405381+03	t	vehicle promo		PROMOTIONAL	ACTIVE	ALL	[]	\N	\N						2025-10-15 23:18:00+03	2025-10-29 09:00:00+03	\N	\N	\N	\N	4	0	0	0.00	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698	campaign_banners/2147919110_1.jpg
bdf9b379-c1c6-40a1-baf9-5df6441902ac	2025-10-15 22:10:59.312945+03	2025-10-15 23:45:54.345836+03	t	Medical Campaign		PROMOTIONAL	ACTIVE	ALL	[]	\N	\N						2025-10-15 22:10:33+03	2025-10-17 22:10:52+03	\N	\N	\N	\N	9	1	0	0.00	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698	campaign_banners/7.webp
\.


--
-- Data for Name: app_campaigninteraction; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_campaigninteraction (id, date_created, date_updated, is_active, interaction_type, ip_address, user_agent, referrer, campaign_id, user_id) FROM stdin;
5f2579ac-6cd5-4f3d-8581-d9b5614586cd	2025-10-15 22:12:00.32089+03	2025-10-15 22:12:00.320899+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		bdf9b379-c1c6-40a1-baf9-5df6441902ac	95069092-9673-4c6b-a137-19a3f6131272
4a71ad0f-ab6a-449b-9ccf-f7d54b92a61e	2025-10-15 22:18:36.946052+03	2025-10-15 22:18:36.94606+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		bdf9b379-c1c6-40a1-baf9-5df6441902ac	95069092-9673-4c6b-a137-19a3f6131272
bd4c9df4-0b90-4156-8e83-3a7b6aaf66fc	2025-10-15 22:40:52.939552+03	2025-10-15 22:40:52.93957+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		bdf9b379-c1c6-40a1-baf9-5df6441902ac	95069092-9673-4c6b-a137-19a3f6131272
ee4a9f9a-1673-4c0a-bb8f-f530e276d822	2025-10-15 22:44:27.462199+03	2025-10-15 22:44:27.462214+03	t	CLICK	127.0.0.1	okhttp/4.12.0		bdf9b379-c1c6-40a1-baf9-5df6441902ac	95069092-9673-4c6b-a137-19a3f6131272
8594ffc6-2666-4a69-8b8d-64f2cbc00272	2025-10-15 23:07:59.900335+03	2025-10-15 23:07:59.900344+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		bdf9b379-c1c6-40a1-baf9-5df6441902ac	95069092-9673-4c6b-a137-19a3f6131272
dbef218a-0dbb-4b2b-aa4c-c847bd727010	2025-10-15 23:13:45.42703+03	2025-10-15 23:13:45.427042+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		bdf9b379-c1c6-40a1-baf9-5df6441902ac	95069092-9673-4c6b-a137-19a3f6131272
63a6e348-179c-47e2-8c9c-dbf3bac97ed9	2025-10-15 23:14:38.363571+03	2025-10-15 23:14:38.363581+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		bdf9b379-c1c6-40a1-baf9-5df6441902ac	95069092-9673-4c6b-a137-19a3f6131272
1b3a305d-d249-4f51-9dfc-bfe244b62b7e	2025-10-15 23:25:42.037133+03	2025-10-15 23:25:42.037141+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		feca13b7-1ea2-4db2-a8e6-73d11283aed9	95069092-9673-4c6b-a137-19a3f6131272
056c6752-cfb1-4947-bdad-2e2d982e28dc	2025-10-15 23:31:30.227266+03	2025-10-15 23:31:30.227277+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		3ac76fd0-dfb8-4263-a7ee-959362bd0cdf	95069092-9673-4c6b-a137-19a3f6131272
cf51a1a6-64a3-4040-9aef-30db7850c87e	2025-10-15 23:44:44.36276+03	2025-10-15 23:44:44.362768+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		f466680c-3af2-468a-baa6-6e030643c626	95069092-9673-4c6b-a137-19a3f6131272
ef441c86-c46a-4c83-94bf-3c75f1a2b983	2025-10-15 23:46:35.383849+03	2025-10-15 23:46:35.38386+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		f466680c-3af2-468a-baa6-6e030643c626	95069092-9673-4c6b-a137-19a3f6131272
ec0a2dc2-ee01-4aa4-8817-e697dd022969	2025-10-15 23:47:30.043179+03	2025-10-15 23:47:30.043189+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		f466680c-3af2-468a-baa6-6e030643c626	95069092-9673-4c6b-a137-19a3f6131272
ef348839-5410-4415-a155-db7cc1702a31	2025-10-15 23:50:30.567039+03	2025-10-15 23:50:30.567052+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		f466680c-3af2-468a-baa6-6e030643c626	95069092-9673-4c6b-a137-19a3f6131272
2cf54ec4-d012-422a-ab8c-7146053902cb	2025-10-15 23:51:35.151702+03	2025-10-15 23:51:35.151719+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		f466680c-3af2-468a-baa6-6e030643c626	95069092-9673-4c6b-a137-19a3f6131272
76fe848e-5fa1-4796-82ae-eafb14c670a7	2025-10-15 23:52:54.674776+03	2025-10-15 23:52:54.674788+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		bdf9b379-c1c6-40a1-baf9-5df6441902ac	95069092-9673-4c6b-a137-19a3f6131272
3c063007-3f33-4e58-acfb-48dbfcae71e4	2025-10-15 23:53:04.661999+03	2025-10-15 23:53:04.662007+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		3ac76fd0-dfb8-4263-a7ee-959362bd0cdf	95069092-9673-4c6b-a137-19a3f6131272
4b0ed8f8-c4b4-4413-97c3-62a322f31efd	2025-10-15 23:53:09.681303+03	2025-10-15 23:53:09.681312+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		feca13b7-1ea2-4db2-a8e6-73d11283aed9	95069092-9673-4c6b-a137-19a3f6131272
3fa65de9-5508-4e2a-81ec-c60d42995892	2025-10-16 00:04:38.439469+03	2025-10-16 00:04:38.439484+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		f466680c-3af2-468a-baa6-6e030643c626	95069092-9673-4c6b-a137-19a3f6131272
6e5e3955-c71d-46e5-abea-0bdd2658cd88	2025-10-16 00:04:42.89633+03	2025-10-16 00:04:42.896337+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		3ac76fd0-dfb8-4263-a7ee-959362bd0cdf	95069092-9673-4c6b-a137-19a3f6131272
f87b3d45-5990-44ac-b25c-f5de7efb4ad0	2025-10-16 00:04:47.979035+03	2025-10-16 00:04:47.979044+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		feca13b7-1ea2-4db2-a8e6-73d11283aed9	95069092-9673-4c6b-a137-19a3f6131272
ec871dd4-9bb0-461b-9737-17645fbc3895	2025-10-16 00:04:52.896791+03	2025-10-16 00:04:52.896799+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		bdf9b379-c1c6-40a1-baf9-5df6441902ac	95069092-9673-4c6b-a137-19a3f6131272
3a9461f5-ee8a-4239-8e10-103acfc7b6ef	2025-10-16 00:42:34.519966+03	2025-10-16 00:42:34.519991+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		f466680c-3af2-468a-baa6-6e030643c626	95069092-9673-4c6b-a137-19a3f6131272
422ad552-caa9-4a5c-9062-ac8081892f79	2025-10-16 00:42:39.479078+03	2025-10-16 00:42:39.479088+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		3ac76fd0-dfb8-4263-a7ee-959362bd0cdf	95069092-9673-4c6b-a137-19a3f6131272
248ef4e3-34a8-4ce8-9059-cd93ed984e0f	2025-10-16 00:42:44.557783+03	2025-10-16 00:42:44.557791+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		feca13b7-1ea2-4db2-a8e6-73d11283aed9	95069092-9673-4c6b-a137-19a3f6131272
e1f58991-5e12-4d94-a403-fa9aaa487e8a	2025-10-16 00:42:49.495944+03	2025-10-16 00:42:49.495957+03	t	IMPRESSION	127.0.0.1	okhttp/4.12.0		bdf9b379-c1c6-40a1-baf9-5df6441902ac	95069092-9673-4c6b-a137-19a3f6131272
\.


--
-- Data for Name: app_campaignschedule; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_campaignschedule (id, date_created, date_updated, frequency, days_of_week, day_of_month, time_of_day, timezone, is_active, last_sent, next_send, campaign_id) FROM stdin;
\.


--
-- Data for Name: app_claim; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_claim (id, date_created, date_updated, is_active, policy_number, product, loss_date, loss_location, loss_description, status, user_id) FROM stdin;
\.


--
-- Data for Name: app_claimdocument; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_claimdocument (id, date_created, date_updated, is_active, doc_type, s3_key, file_name, file_size, content_type, claim_id) FROM stdin;
\.


--
-- Data for Name: app_commercialtonnagepricing; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_commercialtonnagepricing (id, date_created, date_updated, is_active, tonnage_from, tonnage_to, tonnage_description, base_premium, fleet_discount_percentage, is_over_limit, is_prime_mover, effective_from, effective_to, subcategory_id, underwriter_id) FROM stdin;
61bb73eb-f1fa-4db8-923b-caabe8bf9518	2025-09-23 17:54:14.741808+03	2025-09-23 19:22:13.840084+03	t	0.0	3.0	Upto 3 Tons	4500.00	0.00	f	f	2025-09-23	\N	47363ab5-bb14-4a5d-bec4-37f5cd8159b3	acff5e40-a95b-4dd1-bc06-8e210e1e95bc
92a53549-eefd-424b-b3ec-75399274e4b3	2025-09-23 18:22:44.782134+03	2025-09-23 19:22:13.852339+03	t	0.0	3.0	Upto 3 Tons	4700.00	0.00	f	f	2025-09-23	\N	47363ab5-bb14-4a5d-bec4-37f5cd8159b3	14900c1c-4327-4366-a1e9-585699b1a495
8c59ae89-085c-4969-b1f6-4eec84cda378	2025-09-23 17:54:14.744911+03	2025-09-23 19:22:13.842291+03	t	3.5	8.0	3.5 to 8 Tons	5500.00	0.00	f	f	2025-09-23	\N	47363ab5-bb14-4a5d-bec4-37f5cd8159b3	acff5e40-a95b-4dd1-bc06-8e210e1e95bc
4bd654ef-4904-4e0e-bcb8-3b796273e61d	2025-09-23 18:22:44.789813+03	2025-09-23 19:22:13.854167+03	t	3.5	8.0	3.5 to 8 Tons	5700.00	0.00	f	f	2025-09-23	\N	47363ab5-bb14-4a5d-bec4-37f5cd8159b3	14900c1c-4327-4366-a1e9-585699b1a495
ce4301c8-c2c2-4b3a-8419-8671daeb8725	2025-09-23 17:54:14.746904+03	2025-09-23 19:22:13.844066+03	t	8.5	12.0	8.5 to 12 Tons	6500.00	0.00	f	f	2025-09-23	\N	47363ab5-bb14-4a5d-bec4-37f5cd8159b3	acff5e40-a95b-4dd1-bc06-8e210e1e95bc
d7e11e7d-131f-456b-91ee-e2f6320daa2d	2025-09-23 18:22:44.792796+03	2025-09-23 19:22:13.856248+03	t	8.5	12.0	8.5 to 12 Tons	6700.00	0.00	f	f	2025-09-23	\N	47363ab5-bb14-4a5d-bec4-37f5cd8159b3	14900c1c-4327-4366-a1e9-585699b1a495
11518abd-a8c8-4456-8a94-29c9ebe1593b	2025-09-23 17:54:14.748772+03	2025-09-23 19:22:13.845973+03	t	12.5	15.0	12.5 to 15 Tons	7500.00	0.00	f	f	2025-09-23	\N	47363ab5-bb14-4a5d-bec4-37f5cd8159b3	acff5e40-a95b-4dd1-bc06-8e210e1e95bc
409c04a9-22b7-442d-9744-79f320eeb374	2025-09-23 18:22:44.796643+03	2025-09-23 19:22:13.858174+03	t	12.5	15.0	12.5 to 15 Tons	7700.00	0.00	f	f	2025-09-23	\N	47363ab5-bb14-4a5d-bec4-37f5cd8159b3	14900c1c-4327-4366-a1e9-585699b1a495
0b76918e-ed18-4204-ad92-7d6e9fde24ed	2025-09-23 17:54:14.750624+03	2025-09-23 19:22:13.847964+03	t	15.5	20.0	15.5 to 20 Tons	10000.00	0.00	f	f	2025-09-23	\N	47363ab5-bb14-4a5d-bec4-37f5cd8159b3	acff5e40-a95b-4dd1-bc06-8e210e1e95bc
ff171d30-5d7f-4780-9f45-e2a07419d8a1	2025-09-23 18:22:44.800935+03	2025-09-23 19:22:13.859971+03	t	15.5	20.0	15.5 to 20 Tons	10200.00	0.00	f	f	2025-09-23	\N	47363ab5-bb14-4a5d-bec4-37f5cd8159b3	14900c1c-4327-4366-a1e9-585699b1a495
9ed1085c-ed86-4d60-a006-8993ef16728e	2025-09-23 17:54:14.752598+03	2025-09-23 19:22:13.849934+03	t	20.5	\N	Over 20 Tons	15000.00	0.00	f	f	2025-09-23	\N	47363ab5-bb14-4a5d-bec4-37f5cd8159b3	acff5e40-a95b-4dd1-bc06-8e210e1e95bc
dc458a20-2882-4c81-b84f-4046d0fc4855	2025-09-23 18:22:44.804948+03	2025-09-23 19:22:13.861852+03	t	20.5	\N	Over 20 Tons	15500.00	0.00	f	f	2025-09-23	\N	47363ab5-bb14-4a5d-bec4-37f5cd8159b3	14900c1c-4327-4366-a1e9-585699b1a495
\.


--
-- Data for Name: app_commissionrule; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_commissionrule (id, date_created, date_updated, is_active, name, rate, priority, line_key, effective_start, effective_end, subcategory_id, underwriter_id) FROM stdin;
\.


--
-- Data for Name: app_commissionsettings; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_commissionsettings (id, default_commission_rate, updated_at) FROM stdin;
1	0.50	2025-10-10 23:34:06.403285+03
2	4.00	2025-10-10 23:54:57.602725+03
\.


--
-- Data for Name: app_documentupload; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_documentupload (id, date_created, date_updated, is_active, document_type, file_path, original_filename, extracted_data, extraction_confidence, processing_status, quotation_id, document_id, agent_id, policy_id, file_size, mime_type, upload_method, environment, metadata) FROM stdin;
78421aa5-7be2-455d-8b46-7f4929b9b10d	2025-09-30 16:55:24.529704+03	2025-09-30 16:55:24.538081+03	t	national_id	dev/2e85b1cf-3231-46a8-9678-4a103673e5da/2025/09/272edfc5-53e4-4d19-bdd3-3f31f1f367c0/idjpg	idjpg	{"name": "John Doe", "id_number": "12345678"}	0.98	DONE	3926a767-a4f5-428f-b053-2ece81e6ebde	\N	\N	\N	\N	\N	Django	development	\N
ee192dac-83d9-4528-a683-ace73f76b7ed	2025-09-30 17:13:33.709922+03	2025-09-30 17:13:33.715371+03	t	national_id	uploads/dev/2e85b1cf-3231-46a8-9678-4a103673e5da/2025/09/98a631b6-1d2c-4eb4-989a-17cdbd30a34b/idjpg	idjpg	{"name": "John Doe", "id_number": "12345678"}	0.98	DONE	3acf1f03-7de5-4154-90a5-e2735c3fab09	\N	\N	\N	\N	\N	Django	development	\N
4a0bd69a-cb77-4299-8e07-e84f6e4ba9ea	2025-09-30 17:19:22.257512+03	2025-09-30 17:19:22.263376+03	t	national_id	uploads/dev/2e85b1cf-3231-46a8-9678-4a103673e5da/2025/09/9b536990-f83c-4d4d-b786-98f01d20bdb0/idjpg	idjpg	{"name": "John Doe", "id_number": "12345678"}	0.98	DONE	f03e81fa-b5ff-4b53-88ee-fe83dbef392a	\N	\N	\N	\N	\N	Django	development	\N
d8e10938-44a1-4830-ad25-01e6959fb683	2025-09-30 17:20:07.047047+03	2025-09-30 17:20:07.053724+03	t	national_id	uploads/dev/2e85b1cf-3231-46a8-9678-4a103673e5da/2025/09/fa87b6d6-4053-4618-8db6-9789b9228ba3/idjpg	idjpg	{"name": "John Doe", "id_number": "12345678"}	0.98	DONE	9437f29c-55d0-48fe-9883-a288539f52ee	\N	\N	\N	\N	\N	Django	development	\N
885886c6-272e-41a6-8579-3bbc09be4c14	2025-09-30 18:04:42.704364+03	2025-09-30 18:04:42.704373+03	t	logbook	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/09/1133913e-496d-47ba-b32b-b2bc58b132cf/images-1jpg	images-1jpg	\N	\N	PROCESSING	bed7e4a2-4ccf-4bab-8634-080621c7cd04	\N	\N	\N	\N	\N	Django	development	\N
d70d0de0-6854-4df5-9e6f-30256a89a6c4	2025-09-30 18:10:45.456584+03	2025-09-30 18:10:45.456591+03	t	logbook	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/09/4af6fc57-b863-4d4c-8b6a-e53bf183ab7c/images-1jpg	images-1jpg	{"objectKey": "uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/09/4af6fc57-b863-4d4c-8b6a-e53bf183ab7c/images-1jpg", "extractedAt": "2025-09-30T15:10:45.460639Z", "documentType": "logbook"}	0.82	DONE	371910ae-8145-4282-8d68-e6b326eaa57d	\N	\N	\N	\N	\N	Django	development	\N
b16590a3-b19e-4bd9-9b68-ad3ea163cba4	2025-09-30 18:56:47.863003+03	2025-09-30 18:56:47.863013+03	t	logbook	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/09/93621585-dc3f-4b7a-8af5-bf58bc889086/images-1jpg	images-1jpg	\N	\N	PROCESSING	c02fa29b-c4a0-4a67-a3d2-7f5e0487f453	\N	\N	\N	\N	\N	Django	development	\N
f2ad9b1e-ebda-459c-ae53-2064ee5f9a53	2025-09-30 19:01:44.390344+03	2025-09-30 19:01:44.390351+03	t	logbook	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/09/9aec1992-d6ac-4291-b3e0-f90ff3ff3917/images-1jpg	images-1jpg	\N	\N	PROCESSING	f56c5d6d-5585-48be-b463-b57efdfd48e5	\N	\N	\N	\N	\N	Django	development	\N
b3974b95-9ac0-4196-8d43-f6ae354903e7	2025-09-30 19:10:07.444543+03	2025-09-30 19:10:07.444552+03	t	logbook	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/09/7595b67f-0cca-47b3-b490-d8aeb3627617/images-1jpg	images-1jpg	\N	\N	PROCESSING	a0bcd341-b52b-46f8-9d95-83c603f7e72c	\N	\N	\N	\N	\N	Django	development	\N
4998416c-80cb-47f4-b7e4-8418772ab7c5	2025-09-30 19:32:07.508028+03	2025-09-30 19:32:13.732418+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/09/b42e67de-d1f8-48f4-b447-d264da491297/images-1jpg	images-1jpg	{"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "canonicalFields": {"id_type": "pass_citizencard", "id_number": "5843 2166 1964 2184", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}	\N	DONE	bb749322-867d-4554-894c-76d3addbc178	\N	\N	\N	\N	\N	Django	development	\N
3d2c4521-8675-4587-8074-bbb804afd82d	2025-09-30 19:25:12.086712+03	2025-09-30 19:34:37.674782+03	t	logbook	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/09/1b1e060c-c4d1-4f28-bb16-5e6340b45a8a/images-1jpg	images-1jpg	{"fields": {}, "canonicalFields": {"owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}	\N	DONE	324b075b-eafa-42d3-8d2a-4348ac2b9ced	\N	\N	\N	\N	\N	Django	development	\N
a7507708-ae1e-49d7-ab31-886d00607d12	2025-09-30 19:42:06.446288+03	2025-09-30 19:42:12.610462+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/09/95d8214b-cd2e-4976-b95f-e2775e588258/images-1jpg	images-1jpg	{"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "canonicalFields": {"id_type": "pass_citizencard", "id_number": "5843 2166 1964 2184", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}	\N	DONE	390c7cdc-ef50-4801-bf72-b982485c2c70	\N	\N	\N	\N	\N	Django	development	\N
755b839a-0135-4da6-82f2-97b0b0192ae0	2025-09-30 19:42:40.186593+03	2025-09-30 19:42:46.358391+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/09/825d57b0-eb61-4a8a-b590-0a5dde986b7a/images-1jpg	images-1jpg	{"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "canonicalFields": {"id_type": "pass_citizencard", "id_number": "5843 2166 1964 2184", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}	\N	DONE	a6379ef8-7651-4b5d-9c4b-73292d61e26b	\N	\N	\N	\N	\N	Django	development	\N
9859fd10-909e-4a52-94b6-1243539f7cb7	2025-09-30 19:49:57.487813+03	2025-09-30 19:50:03.57281+03	t	logbook	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/09/cd4f180c-5a79-40ad-b74e-a0a98181c89b/images-1jpg	images-1jpg	{"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "canonicalFields": {"id_type": "pass_citizencard", "id_number": "5843 2166 1964 2184", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}	\N	DONE	ac61fae5-601d-4e18-9390-c7bcc3a3dff7	\N	\N	\N	\N	\N	Django	development	\N
4b7844f0-6f1d-434a-b58a-e563c43508c3	2025-09-30 19:53:23.62791+03	2025-09-30 19:53:30.374234+03	t	logbook	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/09/6cad0ad0-c6f8-42e6-b080-dfc4b35b6e7f/images-1jpg	images-1jpg	{"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "canonicalFields": {"id_type": "pass_citizencard", "id_number": "5843 2166 1964 2184", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}	\N	DONE	dbfcd66a-3e49-49cf-b726-6fce7a733477	\N	\N	\N	\N	\N	Django	development	\N
9840e693-c718-48a7-b80d-0a729089463a	2025-09-30 19:54:48.353756+03	2025-09-30 19:54:56.908448+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/09/1353ba23-b8b7-4af1-b120-57eea90a5b85/images-1jpg	images-1jpg	{"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "canonicalFields": {"id_type": "pass_citizencard", "id_number": "5843 2166 1964 2184", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}	\N	DONE	a0600459-4879-4714-aec4-1652d7d80a62	\N	\N	\N	\N	\N	Django	development	\N
fa4b845d-9aad-49bc-9cf1-0ca0a0d93fa8	2025-09-30 20:11:40.90979+03	2025-09-30 20:11:48.292778+03	t	logbook	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/09/8d1c243d-edc6-463c-ae98-ecdd2167aed4/images-1jpg	images-1jpg	{"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "canonicalFields": {"id_type": "pass_citizencard", "id_number": "5843 2166 1964 2184", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}	\N	DONE	ac6bf4ad-a6c6-479d-af26-0ec990102b37	\N	\N	\N	\N	\N	Django	development	\N
3a2ce4ce-4c76-4143-a0c3-29a6269c3cbd	2025-09-30 20:12:59.918123+03	2025-09-30 20:12:59.918129+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/09/c76cf890-7406-488e-a4cc-dc3ba24767c5/motor_vehicle_pricing_logicpdf	motor_vehicle_pricing_logicpdf	\N	\N	PROCESSING	d8dc5cd2-665b-4ce5-96a1-d80c3b5c7ee6	\N	\N	\N	\N	\N	Django	development	\N
fab55b95-dbfd-42f5-a38f-937081480a2e	2025-09-30 20:13:33.815691+03	2025-09-30 20:13:40.92925+03	t	kra_pin	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/09/554f4aaa-f0bb-49e2-93bb-ffdb8b3a5b7f/to-usejpg	to-usejpg	{"fields": {"-": ""}, "canonicalFields": {}}	\N	DONE	be838dc9-d2ac-4fef-97fb-ac7b8577ac80	\N	\N	\N	\N	\N	Django	development	\N
e7a5a949-595a-4475-8a6e-e72195cc1bef	2025-10-01 11:45:18.65032+03	2025-10-01 11:45:18.650326+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/20726704-6001-4e1e-a94c-1708ac1dd945/images-1jpg	images-1jpg	\N	\N	PROCESSING	1ce536be-9109-47a9-b400-1a5a3d7003a5	\N	\N	\N	\N	\N	Django	development	\N
394679f1-cd90-4b2e-9782-3c5eef1df1cc	2025-10-01 11:52:48.87617+03	2025-10-01 11:52:48.876181+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/65c5a51b-9cc0-4171-8f78-71826fac7396/images-1jpg	images-1jpg	\N	\N	PROCESSING	cf9331b0-2c4d-4692-956a-d1be2e295049	\N	\N	\N	\N	\N	Django	development	\N
ddef2ef8-42e5-4b29-89c2-e1d787fc2ea4	2025-10-01 11:57:55.243622+03	2025-10-01 11:57:55.243629+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/ed58ad85-7317-4937-928f-3ca7734de4d4/images-1jpg	images-1jpg	\N	\N	PROCESSING	b5640214-caae-4f53-b8c9-a01cd4f77fbe	\N	\N	\N	\N	\N	Django	development	\N
47dbacbe-bada-462f-a58a-55c2328aa4aa	2025-10-01 12:29:23.919279+03	2025-10-01 12:29:23.919287+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/28603a8e-d357-4771-94cf-003dd300a338/images-1jpg	images-1jpg	\N	\N	PROCESSING	f83f7caf-64cd-4d31-8da5-094cdaa0270b	\N	\N	\N	\N	\N	Django	development	\N
dcc53b66-8f4f-4aff-b46c-61f5ef615a11	2025-09-30 20:19:34.165218+03	2025-09-30 20:19:40.665747+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/09/862b9112-e967-459e-8a1a-8bd41d377474/images-1jpg	images-1jpg	{"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "diagnostics": {"clarity": "fair", "lineCount": 15, "typeMatch": true, "wordCount": 34, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 88.34}, "canonicalFields": {"id_type": "pass_citizencard", "id_number": "5843 2166 1964 2184", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}	\N	DONE	958e24c5-0964-44b3-bee3-c6e31b23adc6	\N	\N	\N	\N	\N	Django	development	\N
13b7d936-330a-4d0c-950c-474b123e0aa1	2025-09-30 20:20:38.030646+03	2025-09-30 20:20:44.576042+03	t	kra_pin	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/09/6c76b041-00c0-4eaa-8028-6ca7b49f9e0b/to-usejpg	to-usejpg	{"fields": {"-": ""}, "diagnostics": {"clarity": "good", "lineCount": 11, "typeMatch": false, "wordCount": 30, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 95.15}, "canonicalFields": {}}	\N	DONE	f4fe3612-b100-4ed5-9363-4bf7c6adb2cf	\N	\N	\N	\N	\N	Django	development	\N
7ade79fc-c429-4880-a7b3-0427b18aca8f	2025-09-30 20:26:39.321638+03	2025-09-30 20:26:45.316663+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/09/83ef8262-2451-4c14-8a2e-6ca7e7efd0e6/images-1jpg	images-1jpg	{"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "diagnostics": {"clarity": "fair", "lineCount": 15, "typeMatch": true, "wordCount": 34, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 88.34}, "canonicalFields": {"id_type": "pass_citizencard", "id_number": "5843 2166 1964 2184", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}	\N	DONE	191dba77-6cab-4c5d-a03d-29f5e72483cf	\N	\N	\N	\N	\N	Django	development	\N
cb9e4923-20e0-4525-9675-2e1b45b81271	2025-10-01 09:19:57.427033+03	2025-10-01 09:19:57.427047+03	t	logbook	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/103f59a2-80ff-4b47-8820-597f8ad3305a/images-1jpg	images-1jpg	{"objectKey": "uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/103f59a2-80ff-4b47-8820-597f8ad3305a/images-1jpg", "extractedAt": "2025-10-01T06:19:57.435430Z", "documentType": "logbook"}	0.82	DONE	07f1024c-fb16-452b-b7e7-0440606ec7a0	\N	\N	\N	\N	\N	Django	development	\N
5a68baa7-26c7-424a-bc39-1baf20740a77	2025-10-01 09:20:16.710236+03	2025-10-01 09:20:16.710244+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/3d780aa1-32cd-41a7-9fa2-5c586e320a5e/images-1jpg	images-1jpg	{"objectKey": "uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/3d780aa1-32cd-41a7-9fa2-5c586e320a5e/images-1jpg", "extractedAt": "2025-10-01T06:20:16.711931Z", "documentType": "national_id"}	0.82	DONE	466632ed-5346-46dd-b1cd-4edcbc6326d3	\N	\N	\N	\N	\N	Django	development	\N
89004eff-9c3d-4620-b7cb-ee8109418610	2025-10-01 09:20:28.042356+03	2025-10-01 09:20:28.042362+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/40cfe4d9-acbf-43ff-8b62-bf3835db4448/images-1jpg	images-1jpg	{"objectKey": "uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/40cfe4d9-acbf-43ff-8b62-bf3835db4448/images-1jpg", "extractedAt": "2025-10-01T06:20:28.044111Z", "documentType": "national_id"}	0.82	DONE	9f8d23ab-015d-4050-bf23-82f17c0e39c5	\N	\N	\N	\N	\N	Django	development	\N
8709128e-4a94-4f0d-9c75-d42d2ced2149	2025-10-01 09:29:33.369655+03	2025-10-01 09:29:33.369663+03	t	logbook	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/5193f9e9-2368-4271-8ab2-69c912472658/images-1jpg	images-1jpg	{"fields": {"mode": "MOCK", "objectKey": "uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/5193f9e9-2368-4271-8ab2-69c912472658/images-1jpg", "extractedAt": "2025-10-01T06:29:33.374729Z", "documentType": "logbook"}, "diagnostics": {"clarity": "good", "lineCount": null, "typeMatch": true, "wordCount": null, "guessedType": "logbook", "expectedType": "logbook", "missingKeywords": [], "presentKeywords": [], "avgWordConfidence": null}, "canonicalFields": {"id_type": "logbook", "owner_name": "Jane Doe", "chassis_number": "ABC1234567890", "registration_number": "KAA123A"}}	0.82	DONE	de6058ef-e013-403d-ad7b-616bf2f64df3	\N	\N	\N	\N	\N	Django	development	\N
9fa5aae2-7479-4a2b-adbb-fb033b0254cf	2025-10-01 10:43:39.035661+03	2025-10-01 10:43:39.035668+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/b71e6aa4-356d-467f-bbbe-c1de66b4415c/images-1jpg	images-1jpg	{"fields": {"mode": "MOCK", "objectKey": "uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/b71e6aa4-356d-467f-bbbe-c1de66b4415c/images-1jpg", "extractedAt": "2025-10-01T07:43:39.039540Z", "documentType": "national_id"}, "diagnostics": {"clarity": "good", "lineCount": null, "typeMatch": true, "wordCount": null, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": [], "presentKeywords": [], "avgWordConfidence": null}, "canonicalFields": {"id_type": "national_id", "id_number": "12345678", "owner_name": "John Doe", "date_of_birth": "1990-01-01", "id_expiry_date": "2030-12-31"}}	0.82	DONE	eb6e1a2e-1dbc-4184-b223-185c17efbe05	\N	\N	\N	\N	\N	Django	development	\N
77119b91-437a-4391-8aff-7279e4d79bdc	2025-10-01 10:53:13.310434+03	2025-10-01 10:53:13.310444+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/d94f5180-6155-4a47-8cd8-5da4faf220ad/images-1jpg	images-1jpg	{"fields": {"mode": "MOCK", "objectKey": "uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/d94f5180-6155-4a47-8cd8-5da4faf220ad/images-1jpg", "extractedAt": "2025-10-01T07:53:13.312869Z", "documentType": "national_id"}, "diagnostics": {"clarity": "good", "lineCount": null, "typeMatch": true, "wordCount": null, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": [], "presentKeywords": [], "avgWordConfidence": null}, "canonicalFields": {"id_type": "national_id", "id_number": "12345678", "owner_name": "John Doe", "date_of_birth": "1990-01-01", "id_expiry_date": "2030-12-31"}}	0.82	DONE	05574b68-538e-43d4-93f9-e21d1ab5a0f8	\N	\N	\N	\N	\N	Django	development	\N
dfc87f2b-eaf8-4945-852c-a3ab82de547d	2025-10-01 10:54:05.646247+03	2025-10-01 10:54:05.646257+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/690a0c64-d582-4b81-ab4e-776caa3f122b/images-1jpg	images-1jpg	{"fields": {"mode": "MOCK", "objectKey": "uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/690a0c64-d582-4b81-ab4e-776caa3f122b/images-1jpg", "extractedAt": "2025-10-01T07:54:05.652338Z", "documentType": "national_id"}, "diagnostics": {"clarity": "good", "lineCount": null, "typeMatch": true, "wordCount": null, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": [], "presentKeywords": [], "avgWordConfidence": null}, "canonicalFields": {"id_type": "national_id", "id_number": "12345678", "owner_name": "John Doe", "date_of_birth": "1990-01-01", "id_expiry_date": "2030-12-31"}}	0.82	DONE	1f373deb-7400-42c0-a74f-bf87fe101b11	\N	\N	\N	\N	\N	Django	development	\N
ef815139-75ed-4a90-bec5-84aef5ff82f9	2025-10-01 11:07:07.497189+03	2025-10-01 11:07:07.497196+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/9f129be4-45ce-426c-a88e-70a2346c558b/images-1jpg	images-1jpg	\N	\N	PROCESSING	4ab42a09-be08-488e-93d8-cdd912c6ed9d	\N	\N	\N	\N	\N	Django	development	\N
fad44a6d-dee3-47ba-bcf5-45b44fd61b86	2025-10-01 11:14:08.312727+03	2025-10-01 11:14:08.312734+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/7089c783-a1d0-4b06-9a83-3a23c3748999/images-1jpg	images-1jpg	\N	\N	PROCESSING	cbbd9243-167a-487d-8b0f-1050fd10c89d	\N	\N	\N	\N	\N	Django	development	\N
9b26b27a-bbff-4c57-ac52-bdd00b80268d	2025-10-01 11:44:02.939583+03	2025-10-01 11:44:02.939593+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/16017b64-6f5e-4b3c-b991-e2e8e601e938/images-1jpg	images-1jpg	\N	\N	PROCESSING	821069e9-35e7-40e6-8e02-f69648787b3b	\N	\N	\N	\N	\N	Django	development	\N
503655c8-34db-4efc-8864-48e52d747072	2025-10-01 14:13:02.212732+03	2025-10-01 14:13:02.21274+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/198fcfae-3006-44f3-b8d3-d76b9a11d2b3/images-1jpg	images-1jpg	\N	\N	PROCESSING	e936301d-2e85-4c85-96fd-c6ef663ff354	\N	\N	\N	\N	\N	Django	development	\N
eed557d7-b9e6-473c-8840-f235e6b06677	2025-10-01 22:46:52.618858+03	2025-10-01 22:46:52.618865+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/6817bc3e-4f46-40b9-8989-4f77c5d3682f/images-1jpg	images-1jpg	\N	\N	PROCESSING	a02bfd8d-6b62-4d0b-aa4d-58773640aab2	\N	\N	\N	\N	\N	Django	development	\N
7302c5ed-f9fa-4d24-8b96-218af2072da9	2025-10-01 23:05:17.633866+03	2025-10-01 23:05:33.074874+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/9b28bc77-1fa5-41ac-96b8-9600a122b776/images-1jpg	images-1jpg	{"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 15, "typeMatch": true, "wordCount": 34, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 88.34}, "canonicalFields": {"id_type": "pass_citizencard", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}	\N	DONE	fc2003b6-bf2d-4a14-a162-b620beab5254	\N	\N	\N	\N	\N	Django	development	\N
ad89e0a2-7009-4001-81b9-9ee9bffc9110	2025-10-01 23:22:44.415491+03	2025-10-01 23:23:00.134655+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/b8f6abc5-a7a3-45eb-b26c-a739f83f311f/images-1jpg	images-1jpg	{"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 15, "typeMatch": true, "wordCount": 34, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 88.34}, "canonicalFields": {"id_type": "pass_citizencard", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}	\N	DONE	54156927-dcea-45ef-b34c-ce31b6d1cd67	\N	\N	\N	\N	\N	Django	development	\N
99962c78-fd35-419a-bdbb-dab0aa5990da	2025-10-01 23:29:48.452555+03	2025-10-01 23:29:56.600559+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/91a1a614-cfac-4a23-bdc9-09363b584ebd/images-1jpg	images-1jpg	{"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 15, "typeMatch": true, "wordCount": 34, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 88.34}, "canonicalFields": {"id_type": "pass_citizencard", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}	\N	DONE	f0dd499a-d077-461e-993f-bae4c21587d1	\N	\N	\N	\N	\N	Django	development	\N
e93b687c-1f81-4196-8478-8f664229e462	2025-10-01 23:37:04.793721+03	2025-10-01 23:37:13.931628+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/95bee455-b2f0-44dc-9c19-44f0db6b768c/images-1jpg	images-1jpg	{"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 15, "typeMatch": true, "wordCount": 34, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 88.34}, "canonicalFields": {"id_type": "pass_citizencard", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}	\N	DONE	5bac01e9-28f3-4d0d-9d9e-700ad628196e	\N	\N	\N	\N	\N	Django	development	\N
0f29edd8-e1e2-489c-bcaf-17d4ca74a2ee	2025-10-02 10:20:15.540445+03	2025-10-02 10:20:23.476904+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/a1e530c1-40c2-4554-b4d9-91d713acc9e6/images-1jpg	images-1jpg	{"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 15, "typeMatch": true, "wordCount": 34, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 88.34}, "canonicalFields": {"id_type": "pass_citizencard", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}	\N	DONE	76161d4b-a524-4ba3-a37c-fe448738cc1f	\N	\N	\N	\N	\N	Django	development	\N
0c1b8707-ed7a-40fa-9658-3393323124af	2025-10-02 11:18:25.889249+03	2025-10-02 11:18:40.375299+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/fd04af23-4247-40da-a7c8-47eedc6eceef/images-1jpg	images-1jpg	{"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 15, "typeMatch": true, "wordCount": 34, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 88.34}, "canonicalFields": {"id_type": "pass_citizencard", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}	\N	DONE	9b85c333-0fbb-4f96-8406-821545c77ca1	\N	\N	\N	\N	\N	Django	development	\N
579f346a-e4ff-40f6-a834-5cb25a24f8b0	2025-10-02 11:40:19.929619+03	2025-10-02 11:40:30.720794+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/09b60fb2-eab9-4cad-9df7-2d87f29e4bcd/images-1jpg	images-1jpg	{"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 15, "typeMatch": true, "wordCount": 34, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 88.34}, "canonicalFields": {"id_type": "pass_citizencard", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}	\N	DONE	05153cb7-9df8-4cc9-b468-14805536e902	\N	\N	\N	\N	\N	Django	development	\N
57fe8b5d-6bdb-492c-8905-ed1a56e9786c	2025-10-02 14:39:12.90533+03	2025-10-02 14:39:19.657872+03	t	national_id	uploads/dev/f358d3bc-ba14-439b-ac4d-eb402ddb9ae7/2025/10/477d0fea-c037-48e0-a9c0-7518eb4475e4/id-cardjpg	id-cardjpg	{"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": true, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "identification", "id card"], "presentKeywords": ["republic of kenya"], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}	\N	DONE	00d83689-0605-4c10-8530-0453f9ac3a42	\N	\N	\N	\N	\N	Django	development	\N
f0bb2c36-fd5b-4efa-ac6c-8a8a7d647a9a	2025-10-02 14:39:46.455926+03	2025-10-02 14:39:53.258846+03	t	kra_pin	uploads/dev/f358d3bc-ba14-439b-ac4d-eb402ddb9ae7/2025/10/51068070-4443-46b6-80a8-0482afc2849b/downloadpng	downloadpng	{"fields": {",": "", "-": "", "I": "", "mm": "", "- -": "", "that -": ""}, "diagnostics": {"clarity": "poor", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 28, "typeMatch": false, "wordCount": 42, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 69.89}, "canonicalFields": {}}	\N	DONE	cf70c4da-f8cb-470e-a894-fac447f14163	\N	\N	\N	\N	\N	Django	development	\N
511c2155-64c2-4562-9094-63c61604f306	2025-10-02 14:39:45.076995+03	2025-10-02 14:39:53.50599+03	t	logbook	uploads/dev/f358d3bc-ba14-439b-ac4d-eb402ddb9ae7/2025/10/0c7fe32c-54d2-4c13-8a07-518cf5594f01/imagesjpeg	imagesjpeg	{"fields": {"K": "1075352 C", "Pin:": "", "Town": "NAIROBI", "Body:": "SALOON", "Code:": "", "Color": "SILVER", "Duty:": "Paid", "Fuel:": "Petrol", "Make:": "TOYOTA", "Name:": "-", "Type:": "Motor vehicle", "Axies:": "2", "Model:": "CBA-", "class:": "Private", "Box No.": "", "Rating:": "1290", "(Section": "6(5))", "12/10/16": "", "country,": "Capan", "Man.Year:": "2009", "Engine No:": "", "Reg. Date:": "06-OCT-16", "Important:-": "The person in whose name # vehicle is registered that unless the contrary be proved, be deemed to be the owner of the vehicle. Before you use any vehicle on the road, please ensure that your insurance against third party risk is in order it is # serious offence to drive without proper insurance", "Original No": "20000071409", "Passengers:": "5", "TRAFFIC ACT": "(CAP 403)", "Tare weight:": "1110", "Gross weight:": "", "Previous Reg.": "", "Registration:": "KUMMA", "USAN signature:": "", "Load capacity(ikg):": "", "Authorising Signature": "BEST", "Previous registration:": "5305A9271", "Chasis/Frame:NT00000000": "", "Number of previous owners:": "0"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": ["kw:pin"], "logbook": ["kw:registration"], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 59, "typeMatch": false, "wordCount": 145, "typeScores": {"kra_pin": 1, "logbook": 1, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "logbook", "missingKeywords": ["logbook", "chassis", "ntsa", "national transport", "chief registrar"], "presentKeywords": ["registration"], "avgWordConfidence": 87.18}, "canonicalFields": {"id_type": "national_id", "id_number": "1075352"}}	\N	DONE	4ce5c15b-6094-4aa6-a060-1c719c2cb74e	\N	\N	\N	\N	\N	Django	development	\N
e8c07013-f00c-48eb-b950-b65078947b2d	2025-10-02 14:40:07.308552+03	2025-10-02 14:40:12.164081+03	t	kra_pin	uploads/dev/f358d3bc-ba14-439b-ac4d-eb402ddb9ae7/2025/10/ee2dbd29-eb16-42c1-81b4-0797d5062d57/downloadpng	downloadpng	{"fields": {",": "", "-": "", "I": "", "mm": "", "- -": "", "that -": ""}, "diagnostics": {"clarity": "poor", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 28, "typeMatch": false, "wordCount": 42, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 69.89}, "canonicalFields": {}}	\N	DONE	18c543a6-1bb3-47c4-8f98-71ea48ad776e	\N	\N	\N	\N	\N	Django	development	\N
5fc4f6ba-e519-46a2-b042-705c9eabe0f2	2025-10-02 17:55:44.157409+03	2025-10-02 17:55:44.157421+03	t	logbook	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/91992864-3954-44f7-8f3a-4857f1d35d21/imagesjpeg	imagesjpeg	\N	\N	PROCESSING	91c9b6a7-e004-43ab-9670-305902e89bb0	\N	\N	\N	\N	\N	Django	development	\N
35e00bc5-5c3d-466b-b4a8-aa3eaf8b01c8	2025-10-02 17:55:44.711619+03	2025-10-02 17:55:44.711629+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/06ec1537-1128-49f4-95af-efada73574d2/id-cardjpg	id-cardjpg	\N	\N	PROCESSING	d90eeaf8-a11b-48fb-a60c-961a75e929fb	\N	\N	\N	\N	\N	Django	development	\N
f423fe88-5d44-452c-9652-9bfe1569c78f	2025-10-02 17:55:45.114393+03	2025-10-02 17:55:45.114402+03	t	kra_pin	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/1507ea52-5516-40a7-b726-7114a006061d/downloadpng	downloadpng	\N	\N	PROCESSING	19d9ce47-2737-41df-a11f-65ac79c3aee7	\N	\N	\N	\N	\N	Django	development	\N
1f76d259-8b3e-4e06-9db8-f350b62e503b	2025-10-13 09:59:11.250199+03	2025-10-13 09:59:15.039333+03	t	kra_pin	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/b207b363-02f3-4dec-90fb-b0e11f2d4006/downloadpng	downloadpng	{"fields": {",": "", "-": "", "I": "", "mm": "", "- -": "", "that -": ""}, "diagnostics": {"clarity": "poor", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 28, "typeMatch": false, "wordCount": 42, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 69.89}, "canonicalFields": {}}	\N	DONE	8e619e1d-89b1-406b-91bd-0b0b1e6191ed	\N	\N	\N	\N	\N	Django	development	\N
0ab53be1-2567-4c58-9c08-998e3faaf2ad	2025-10-08 09:44:05.697328+03	2025-10-08 09:44:14.1212+03	t	logbook	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/5cf5a411-4f14-402f-80cd-b7660955347a/imagesjpeg	imagesjpeg	{"fields": {"K": "1075352 C", "Pin:": "", "Town": "NAIROBI", "Body:": "SALOON", "Code:": "", "Color": "SILVER", "Duty:": "Paid", "Fuel:": "Petrol", "Make:": "TOYOTA", "Name:": "-", "Type:": "Motor vehicle", "Axies:": "2", "Model:": "CBA-", "class:": "Private", "Box No.": "", "Rating:": "1290", "(Section": "6(5))", "12/10/16": "", "country,": "Capan", "Man.Year:": "2009", "Engine No:": "", "Reg. Date:": "06-OCT-16", "Important:-": "The person in whose name # vehicle is registered that unless the contrary be proved, be deemed to be the owner of the vehicle. Before you use any vehicle on the road, please ensure that your insurance against third party risk is in order it is # serious offence to drive without proper insurance", "Original No": "20000071409", "Passengers:": "5", "TRAFFIC ACT": "(CAP 403)", "Tare weight:": "1110", "Gross weight:": "", "Previous Reg.": "", "Registration:": "KUMMA", "USAN signature:": "", "Load capacity(ikg):": "", "Authorising Signature": "BEST", "Previous registration:": "5305A9271", "Chasis/Frame:NT00000000": "", "Number of previous owners:": "0"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": ["kw:pin"], "logbook": ["kw:registration"], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 59, "typeMatch": false, "wordCount": 145, "typeScores": {"kra_pin": 1, "logbook": 1, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "logbook", "missingKeywords": ["logbook", "chassis", "ntsa", "national transport", "chief registrar"], "presentKeywords": ["registration"], "avgWordConfidence": 87.18}, "canonicalFields": {"id_type": "national_id", "id_number": "1075352"}}	\N	DONE	e6425b70-69ee-4473-9c07-d061bae543b3	\N	\N	\N	\N	\N	Django	development	\N
3f3f822d-445b-425a-86c9-b26f432c71c0	2025-10-08 09:44:28.238533+03	2025-10-08 09:44:36.255697+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/a4b97b0f-174f-4762-bf70-85e031326253/id-cardjpg	id-cardjpg	{"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": true, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "identification", "id card"], "presentKeywords": ["republic of kenya"], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}	\N	DONE	51b94d8a-868f-407e-a2f5-910423ba0dc8	\N	\N	\N	\N	\N	Django	development	\N
75b3377b-57c9-4710-8c83-e449d5cc7be4	2025-10-08 09:44:30.478106+03	2025-10-08 09:44:38.535567+03	t	kra_pin	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/933d3fd6-30c6-40d8-8abc-aff4deb5b252/downloadpng	downloadpng	{"fields": {",": "", "-": "", "I": "", "mm": "", "- -": "", "that -": ""}, "diagnostics": {"clarity": "poor", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 28, "typeMatch": false, "wordCount": 42, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 69.89}, "canonicalFields": {}}	\N	DONE	ad314bbe-6fdd-45c7-8ff9-8e05f9a1bb20	\N	\N	\N	\N	\N	Django	development	\N
e6693960-7171-457d-8628-1db8446b0bef	2025-10-08 09:57:21.608837+03	2025-10-08 09:57:25.856088+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/069e9cd7-3ff7-423c-aa9f-a5b639f12975/downloadpng	downloadpng	{"fields": {",": "", "-": "", "I": "", "mm": "", "- -": "", "that -": ""}, "diagnostics": {"clarity": "poor", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 28, "typeMatch": true, "wordCount": 42, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 69.89}, "canonicalFields": {}}	\N	DONE	89fd682c-1a68-4e2d-8846-be70102afd4a	\N	\N	\N	\N	\N	Django	development	\N
85d21e12-294f-4a05-b1c6-253f83eaad86	2025-10-08 09:57:20.91472+03	2025-10-08 09:57:29.632882+03	t	logbook	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/fa7147f8-5a84-4138-9abf-0852c1375c79/imagesjpeg	imagesjpeg	{"fields": {"K": "1075352 C", "Pin:": "", "Town": "NAIROBI", "Body:": "SALOON", "Code:": "", "Color": "SILVER", "Duty:": "Paid", "Fuel:": "Petrol", "Make:": "TOYOTA", "Name:": "-", "Type:": "Motor vehicle", "Axies:": "2", "Model:": "CBA-", "class:": "Private", "Box No.": "", "Rating:": "1290", "(Section": "6(5))", "12/10/16": "", "country,": "Capan", "Man.Year:": "2009", "Engine No:": "", "Reg. Date:": "06-OCT-16", "Important:-": "The person in whose name # vehicle is registered that unless the contrary be proved, be deemed to be the owner of the vehicle. Before you use any vehicle on the road, please ensure that your insurance against third party risk is in order it is # serious offence to drive without proper insurance", "Original No": "20000071409", "Passengers:": "5", "TRAFFIC ACT": "(CAP 403)", "Tare weight:": "1110", "Gross weight:": "", "Previous Reg.": "", "Registration:": "KUMMA", "USAN signature:": "", "Load capacity(ikg):": "", "Authorising Signature": "BEST", "Previous registration:": "5305A9271", "Chasis/Frame:NT00000000": "", "Number of previous owners:": "0"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": ["kw:pin"], "logbook": ["kw:registration"], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 59, "typeMatch": false, "wordCount": 145, "typeScores": {"kra_pin": 1, "logbook": 1, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "logbook", "missingKeywords": ["logbook", "chassis", "ntsa", "national transport", "chief registrar"], "presentKeywords": ["registration"], "avgWordConfidence": 87.18}, "canonicalFields": {"id_type": "national_id", "id_number": "1075352"}}	\N	DONE	1d112d9d-2091-494e-9ee0-54653fbc64d7	\N	\N	\N	\N	\N	Django	development	\N
320af7a2-cefd-4aad-a68b-4b03557afb48	2025-10-08 09:57:31.948151+03	2025-10-08 09:57:41.892574+03	t	kra_pin	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/ffaa8a38-ad26-4c6f-a68d-b61ed46dc981/id-cardjpg	id-cardjpg	{"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": false, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}	\N	DONE	3b5ba5d3-e140-43b3-ab0c-07ff0d20508e	\N	\N	\N	\N	\N	Django	development	\N
70b089e8-2381-4361-8b35-76e9dfb0942d	2025-10-08 14:51:08.427046+03	2025-10-08 14:51:17.265738+03	t	logbook	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/9b91c453-a5b6-47c6-b92d-0a164996fb79/imagesjpeg	imagesjpeg	{"fields": {"K": "1075352 C", "Pin:": "", "Town": "NAIROBI", "Body:": "SALOON", "Code:": "", "Color": "SILVER", "Duty:": "Paid", "Fuel:": "Petrol", "Make:": "TOYOTA", "Name:": "-", "Type:": "Motor vehicle", "Axies:": "2", "Model:": "CBA-", "class:": "Private", "Box No.": "", "Rating:": "1290", "(Section": "6(5))", "12/10/16": "", "country,": "Capan", "Man.Year:": "2009", "Engine No:": "", "Reg. Date:": "06-OCT-16", "Important:-": "The person in whose name # vehicle is registered that unless the contrary be proved, be deemed to be the owner of the vehicle. Before you use any vehicle on the road, please ensure that your insurance against third party risk is in order it is # serious offence to drive without proper insurance", "Original No": "20000071409", "Passengers:": "5", "TRAFFIC ACT": "(CAP 403)", "Tare weight:": "1110", "Gross weight:": "", "Previous Reg.": "", "Registration:": "KUMMA", "USAN signature:": "", "Load capacity(ikg):": "", "Authorising Signature": "BEST", "Previous registration:": "5305A9271", "Chasis/Frame:NT00000000": "", "Number of previous owners:": "0"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": ["kw:pin"], "logbook": ["kw:registration"], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 59, "typeMatch": false, "wordCount": 145, "typeScores": {"kra_pin": 1, "logbook": 1, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "logbook", "missingKeywords": ["logbook", "chassis", "ntsa", "national transport", "chief registrar"], "presentKeywords": ["registration"], "avgWordConfidence": 87.18}, "canonicalFields": {"id_type": "national_id", "id_number": "1075352"}}	\N	DONE	dd79cbc7-c430-4acb-be55-cb99ff1c55c7	\N	\N	\N	\N	\N	Django	development	\N
da30c838-3574-4a4e-9f26-28801c10fd18	2025-10-08 14:51:32.499509+03	2025-10-08 14:51:37.280232+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/9c14f98a-144d-445b-97a2-dbeec195a5a6/id-cardjpg	id-cardjpg	{"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": true, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "identification", "id card"], "presentKeywords": ["republic of kenya"], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}	\N	DONE	371c9eff-2d73-4514-907c-89fa84f34d6d	\N	\N	\N	\N	\N	Django	development	\N
d7c24115-4913-445c-9d38-eaebfef9011c	2025-10-08 14:51:33.111364+03	2025-10-08 14:51:41.184136+03	t	kra_pin	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/156241bc-bbf7-48f3-8563-70255d214f17/downloadpng	downloadpng	{"fields": {",": "", "-": "", "I": "", "mm": "", "- -": "", "that -": ""}, "diagnostics": {"clarity": "poor", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 28, "typeMatch": false, "wordCount": 42, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 69.89}, "canonicalFields": {}}	\N	DONE	b7dc3a2b-2f1b-4c60-aef4-d77b29005b73	\N	\N	\N	\N	\N	Django	development	\N
179cd05c-d36b-4003-a4f0-304e19e401b3	2025-10-09 23:54:32.638886+03	2025-10-09 23:55:02.463539+03	t	logbook	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/30d988d5-1995-4b71-a490-c3adc98916ce/imagesjpeg	imagesjpeg	{"fields": {"K": "1075352 C", "Pin:": "", "Town": "NAIROBI", "Body:": "SALOON", "Code:": "", "Color": "SILVER", "Duty:": "Paid", "Fuel:": "Petrol", "Make:": "TOYOTA", "Name:": "-", "Type:": "Motor vehicle", "Axies:": "2", "Model:": "CBA-", "class:": "Private", "Box No.": "", "Rating:": "1290", "(Section": "6(5))", "12/10/16": "", "country,": "Capan", "Man.Year:": "2009", "Engine No:": "", "Reg. Date:": "06-OCT-16", "Important:-": "The person in whose name # vehicle is registered that unless the contrary be proved, be deemed to be the owner of the vehicle. Before you use any vehicle on the road, please ensure that your insurance against third party risk is in order it is # serious offence to drive without proper insurance", "Original No": "20000071409", "Passengers:": "5", "TRAFFIC ACT": "(CAP 403)", "Tare weight:": "1110", "Gross weight:": "", "Previous Reg.": "", "Registration:": "KUMMA", "USAN signature:": "", "Load capacity(ikg):": "", "Authorising Signature": "BEST", "Previous registration:": "5305A9271", "Chasis/Frame:NT00000000": "", "Number of previous owners:": "0"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": ["kw:pin"], "logbook": ["kw:registration"], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 59, "typeMatch": false, "wordCount": 145, "typeScores": {"kra_pin": 1, "logbook": 1, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "logbook", "missingKeywords": ["logbook", "chassis", "ntsa", "national transport", "chief registrar"], "presentKeywords": ["registration"], "avgWordConfidence": 87.18}, "canonicalFields": {"id_type": "national_id", "id_number": "1075352"}}	\N	DONE	fcfadb57-411e-4760-9e9f-62b41a974583	\N	\N	\N	\N	\N	Django	development	\N
1c3554f4-54a3-4c9a-b510-bb0014d59369	2025-10-09 23:55:04.803573+03	2025-10-09 23:55:10.21606+03	t	kra_pin	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/01d3d34c-60cf-4933-856c-faafe4942062/id-cardjpg	id-cardjpg	{"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": false, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}	\N	DONE	7f8ebef0-56ce-4f65-ae57-311e6cb97df6	\N	\N	\N	\N	\N	Django	development	\N
c95908a3-8e78-4243-9c6f-6489049d4173	2025-10-09 23:54:36.291834+03	2025-10-09 23:55:12.58827+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/3369bd07-86a0-4808-b36e-d1493b99dcee/id-cardjpg	id-cardjpg	{"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": true, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "identification", "id card"], "presentKeywords": ["republic of kenya"], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}	\N	DONE	3671eaab-a61c-4cca-95f0-69de7e06b654	\N	\N	\N	\N	\N	Django	development	\N
fe2826cf-4e36-4011-842d-ba4c3875ea1a	2025-10-11 01:59:34.041511+03	2025-10-11 01:59:41.252051+03	t	logbook	uploads/dev/3dc28354-5326-4acb-b194-d2da11fd51c0/2025/10/dda54d3d-943e-4d3c-a464-93850c2ffbda/imagesjpeg	imagesjpeg	{"fields": {"K": "1075352 C", "Pin:": "", "Town": "NAIROBI", "Body:": "SALOON", "Code:": "", "Color": "SILVER", "Duty:": "Paid", "Fuel:": "Petrol", "Make:": "TOYOTA", "Name:": "-", "Type:": "Motor vehicle", "Axies:": "2", "Model:": "CBA-", "class:": "Private", "Box No.": "", "Rating:": "1290", "(Section": "6(5))", "12/10/16": "", "country,": "Capan", "Man.Year:": "2009", "Engine No:": "", "Reg. Date:": "06-OCT-16", "Important:-": "The person in whose name # vehicle is registered that unless the contrary be proved, be deemed to be the owner of the vehicle. Before you use any vehicle on the road, please ensure that your insurance against third party risk is in order it is # serious offence to drive without proper insurance", "Original No": "20000071409", "Passengers:": "5", "TRAFFIC ACT": "(CAP 403)", "Tare weight:": "1110", "Gross weight:": "", "Previous Reg.": "", "Registration:": "KUMMA", "USAN signature:": "", "Load capacity(ikg):": "", "Authorising Signature": "BEST", "Previous registration:": "5305A9271", "Chasis/Frame:NT00000000": "", "Number of previous owners:": "0"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": ["kw:pin"], "logbook": ["kw:registration"], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 59, "typeMatch": false, "wordCount": 145, "typeScores": {"kra_pin": 1, "logbook": 1, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "logbook", "missingKeywords": ["logbook", "chassis", "ntsa", "national transport", "chief registrar"], "presentKeywords": ["registration"], "avgWordConfidence": 87.18}, "canonicalFields": {"id_type": "national_id", "id_number": "1075352"}}	\N	DONE	8d8401b9-b0f3-4f93-998d-2ebb5a160915	\N	\N	\N	\N	\N	Django	development	\N
4bd8839b-466e-49d3-9384-f9101bf7e4f6	2025-10-11 01:59:36.98406+03	2025-10-11 01:59:43.784459+03	t	national_id	uploads/dev/3dc28354-5326-4acb-b194-d2da11fd51c0/2025/10/97a05471-d68f-4bc9-9e72-7f2f2edfb1c4/id-cardjpg	id-cardjpg	{"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": true, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "identification", "id card"], "presentKeywords": ["republic of kenya"], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}	\N	DONE	b33ee125-246d-4cb5-bf35-0c7b20014e53	\N	\N	\N	\N	\N	Django	development	\N
a4f28d62-7f5d-48d1-a2c4-90f9e474f457	2025-10-11 01:59:37.507156+03	2025-10-11 01:59:44.271994+03	t	kra_pin	uploads/dev/3dc28354-5326-4acb-b194-d2da11fd51c0/2025/10/464a1fa5-114f-4071-9d11-f4f4f569422b/downloadpng	downloadpng	{"fields": {",": "", "-": "", "I": "", "mm": "", "- -": "", "that -": ""}, "diagnostics": {"clarity": "poor", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 28, "typeMatch": false, "wordCount": 42, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 69.89}, "canonicalFields": {}}	\N	DONE	5bab3d05-d23f-4d54-81b6-bd532bb80f9f	\N	\N	\N	\N	\N	Django	development	\N
19e2c859-1366-4520-905c-5036f33c2bdb	2025-10-13 09:59:03.992634+03	2025-10-13 09:59:09.787899+03	t	logbook	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/b74501e8-3369-419c-af33-b28f5b093e39/imagesjpeg	imagesjpeg	{"fields": {"K": "1075352 C", "Pin:": "", "Town": "NAIROBI", "Body:": "SALOON", "Code:": "", "Color": "SILVER", "Duty:": "Paid", "Fuel:": "Petrol", "Make:": "TOYOTA", "Name:": "-", "Type:": "Motor vehicle", "Axies:": "2", "Model:": "CBA-", "class:": "Private", "Box No.": "", "Rating:": "1290", "(Section": "6(5))", "12/10/16": "", "country,": "Capan", "Man.Year:": "2009", "Engine No:": "", "Reg. Date:": "06-OCT-16", "Important:-": "The person in whose name # vehicle is registered that unless the contrary be proved, be deemed to be the owner of the vehicle. Before you use any vehicle on the road, please ensure that your insurance against third party risk is in order it is # serious offence to drive without proper insurance", "Original No": "20000071409", "Passengers:": "5", "TRAFFIC ACT": "(CAP 403)", "Tare weight:": "1110", "Gross weight:": "", "Previous Reg.": "", "Registration:": "KUMMA", "USAN signature:": "", "Load capacity(ikg):": "", "Authorising Signature": "BEST", "Previous registration:": "5305A9271", "Chasis/Frame:NT00000000": "", "Number of previous owners:": "0"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": ["kw:pin"], "logbook": ["kw:registration"], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 59, "typeMatch": false, "wordCount": 145, "typeScores": {"kra_pin": 1, "logbook": 1, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "logbook", "missingKeywords": ["logbook", "chassis", "ntsa", "national transport", "chief registrar"], "presentKeywords": ["registration"], "avgWordConfidence": 87.18}, "canonicalFields": {"id_type": "national_id", "id_number": "1075352"}}	\N	DONE	00330f38-3197-445b-bae2-ddad748f02d4	\N	\N	\N	\N	\N	Django	development	\N
44bee5c2-f400-4782-871c-d14fb767e41e	2025-10-13 09:59:10.589258+03	2025-10-13 09:59:17.81077+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/1b39bdb2-bc7b-45c1-93db-63e8b0420d1f/id-cardjpg	id-cardjpg	{"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": true, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "identification", "id card"], "presentKeywords": ["republic of kenya"], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}	\N	DONE	ba1d59dc-8f66-461c-b022-b4f9d88c6622	\N	\N	\N	\N	\N	Django	development	\N
9d9a6eab-9d23-4fd0-aad0-c2415c0e3cc9	2025-10-13 09:59:30.344295+03	2025-10-13 09:59:37.083525+03	t	kra_pin	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/d5295e86-a1f9-40be-911a-3ec319353ee5/id-cardjpg	id-cardjpg	{"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": false, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}	\N	DONE	5c31d08d-7aed-427c-bef7-438be96376a4	\N	\N	\N	\N	\N	Django	development	\N
abedd5cf-e31c-47ec-a254-b5ebb4bbaff6	2025-10-13 10:42:42.053618+03	2025-10-13 10:42:50.435716+03	t	logbook	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/adcd1e7f-a9c4-45cb-a438-5104407c9a8f/imagesjpeg	imagesjpeg	{"fields": {"K": "1075352 C", "Pin:": "", "Town": "NAIROBI", "Body:": "SALOON", "Code:": "", "Color": "SILVER", "Duty:": "Paid", "Fuel:": "Petrol", "Make:": "TOYOTA", "Name:": "-", "Type:": "Motor vehicle", "Axies:": "2", "Model:": "CBA-", "class:": "Private", "Box No.": "", "Rating:": "1290", "(Section": "6(5))", "12/10/16": "", "country,": "Capan", "Man.Year:": "2009", "Engine No:": "", "Reg. Date:": "06-OCT-16", "Important:-": "The person in whose name # vehicle is registered that unless the contrary be proved, be deemed to be the owner of the vehicle. Before you use any vehicle on the road, please ensure that your insurance against third party risk is in order it is # serious offence to drive without proper insurance", "Original No": "20000071409", "Passengers:": "5", "TRAFFIC ACT": "(CAP 403)", "Tare weight:": "1110", "Gross weight:": "", "Previous Reg.": "", "Registration:": "KUMMA", "USAN signature:": "", "Load capacity(ikg):": "", "Authorising Signature": "BEST", "Previous registration:": "5305A9271", "Chasis/Frame:NT00000000": "", "Number of previous owners:": "0"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": ["kw:pin"], "logbook": ["kw:registration"], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 59, "typeMatch": false, "wordCount": 145, "typeScores": {"kra_pin": 1, "logbook": 1, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "logbook", "missingKeywords": ["logbook", "chassis", "ntsa", "national transport", "chief registrar"], "presentKeywords": ["registration"], "avgWordConfidence": 87.18}, "canonicalFields": {"id_type": "national_id", "id_number": "1075352"}}	\N	DONE	4f0d0aed-2ad7-478a-91e7-ba39d0d13673	\N	\N	\N	\N	\N	Django	development	\N
51c66c7f-0b78-4e24-b14f-877e46647ef2	2025-10-13 10:42:46.502574+03	2025-10-13 10:42:54.698001+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/22bdc751-389d-4178-be9f-3580e3d938f5/downloadpng	downloadpng	{"fields": {",": "", "-": "", "I": "", "mm": "", "- -": "", "that -": ""}, "diagnostics": {"clarity": "poor", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 28, "typeMatch": true, "wordCount": 42, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 69.89}, "canonicalFields": {}}	\N	DONE	dd530891-81c9-4a4f-8256-fd52fb3bd85c	\N	\N	\N	\N	\N	Django	development	\N
5003f7bf-b64c-422e-af4b-21f71b76fcd8	2025-10-13 10:42:58.05038+03	2025-10-13 10:43:02.020615+03	t	kra_pin	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/3354721c-753a-47b4-bb7f-57ca0c732528/downloadpng	downloadpng	{"fields": {",": "", "-": "", "I": "", "mm": "", "- -": "", "that -": ""}, "diagnostics": {"clarity": "poor", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 28, "typeMatch": false, "wordCount": 42, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 69.89}, "canonicalFields": {}}	\N	DONE	d7e52f0e-c11b-4f03-9e91-87ef29c5cdc7	\N	\N	\N	\N	\N	Django	development	\N
5ae24081-1022-41de-9f62-732850205a46	2025-10-13 12:20:58.293697+03	2025-10-13 12:21:06.420531+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/33c7a3c2-a34f-4aa2-a82f-590143803600/id-cardjpg	id-cardjpg	{"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": true, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "identification", "id card"], "presentKeywords": ["republic of kenya"], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}	\N	DONE	5e91730a-6d7c-406b-8222-cbd728f9033e	\N	\N	\N	\N	\N	Django	development	\N
48c9b78e-bd94-4b21-9232-da334947464a	2025-10-13 12:20:52.31776+03	2025-10-13 12:21:01.843775+03	t	logbook	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/a026664e-badc-4887-a60b-75ecf2f9211f/imagesjpeg	imagesjpeg	{"fields": {"K": "1075352 C", "Pin:": "", "Town": "NAIROBI", "Body:": "SALOON", "Code:": "", "Color": "SILVER", "Duty:": "Paid", "Fuel:": "Petrol", "Make:": "TOYOTA", "Name:": "-", "Type:": "Motor vehicle", "Axies:": "2", "Model:": "CBA-", "class:": "Private", "Box No.": "", "Rating:": "1290", "(Section": "6(5))", "12/10/16": "", "country,": "Capan", "Man.Year:": "2009", "Engine No:": "", "Reg. Date:": "06-OCT-16", "Important:-": "The person in whose name # vehicle is registered that unless the contrary be proved, be deemed to be the owner of the vehicle. Before you use any vehicle on the road, please ensure that your insurance against third party risk is in order it is # serious offence to drive without proper insurance", "Original No": "20000071409", "Passengers:": "5", "TRAFFIC ACT": "(CAP 403)", "Tare weight:": "1110", "Gross weight:": "", "Previous Reg.": "", "Registration:": "KUMMA", "USAN signature:": "", "Load capacity(ikg):": "", "Authorising Signature": "BEST", "Previous registration:": "5305A9271", "Chasis/Frame:NT00000000": "", "Number of previous owners:": "0"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": ["kw:pin"], "logbook": ["kw:registration"], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 59, "typeMatch": false, "wordCount": 145, "typeScores": {"kra_pin": 1, "logbook": 1, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "logbook", "missingKeywords": ["logbook", "chassis", "ntsa", "national transport", "chief registrar"], "presentKeywords": ["registration"], "avgWordConfidence": 87.18}, "canonicalFields": {"id_type": "national_id", "id_number": "1075352"}}	\N	DONE	364c85d1-73e3-45c3-90d7-e7691debad3a	\N	\N	\N	\N	\N	Django	development	\N
61d97d21-b1cb-48c9-84c3-4971ce1e3036	2025-10-13 12:21:00.435372+03	2025-10-13 12:21:08.929308+03	t	kra_pin	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/d79d7329-fb1b-4882-b2d6-ad5eb6cd1c44/id-cardjpg	id-cardjpg	{"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": false, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}	\N	DONE	02d68a2b-1a44-4f83-85cb-4303c0ea1458	\N	\N	\N	\N	\N	Django	development	\N
5447297a-7206-4fbf-a9be-eddab6654bbf	2025-10-13 12:27:13.150154+03	2025-10-13 12:27:17.996516+03	t	logbook	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/33e643fc-a17c-4f39-9101-d6558c02d720/imagesjpeg	imagesjpeg	{"fields": {"K": "1075352 C", "Pin:": "", "Town": "NAIROBI", "Body:": "SALOON", "Code:": "", "Color": "SILVER", "Duty:": "Paid", "Fuel:": "Petrol", "Make:": "TOYOTA", "Name:": "-", "Type:": "Motor vehicle", "Axies:": "2", "Model:": "CBA-", "class:": "Private", "Box No.": "", "Rating:": "1290", "(Section": "6(5))", "12/10/16": "", "country,": "Capan", "Man.Year:": "2009", "Engine No:": "", "Reg. Date:": "06-OCT-16", "Important:-": "The person in whose name # vehicle is registered that unless the contrary be proved, be deemed to be the owner of the vehicle. Before you use any vehicle on the road, please ensure that your insurance against third party risk is in order it is # serious offence to drive without proper insurance", "Original No": "20000071409", "Passengers:": "5", "TRAFFIC ACT": "(CAP 403)", "Tare weight:": "1110", "Gross weight:": "", "Previous Reg.": "", "Registration:": "KUMMA", "USAN signature:": "", "Load capacity(ikg):": "", "Authorising Signature": "BEST", "Previous registration:": "5305A9271", "Chasis/Frame:NT00000000": "", "Number of previous owners:": "0"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": ["kw:pin"], "logbook": ["kw:registration"], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 59, "typeMatch": false, "wordCount": 145, "typeScores": {"kra_pin": 1, "logbook": 1, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "logbook", "missingKeywords": ["logbook", "chassis", "ntsa", "national transport", "chief registrar"], "presentKeywords": ["registration"], "avgWordConfidence": 87.18}, "canonicalFields": {"id_type": "national_id", "id_number": "1075352"}}	\N	DONE	e4c3e730-f146-40d9-9b1a-98b05e832fd8	\N	\N	\N	\N	\N	Django	development	\N
74d39466-d1a0-47ff-a809-1c225737449e	2025-10-13 12:27:18.400354+03	2025-10-13 12:27:26.400947+03	t	national_id	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/ffa2a95c-3b83-4bc3-8df9-4cf48e78c008/id-cardjpg	id-cardjpg	{"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": true, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "identification", "id card"], "presentKeywords": ["republic of kenya"], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}	\N	DONE	515a4b19-a2a9-4a22-aa58-d8c2796246c2	\N	\N	\N	\N	\N	Django	development	\N
fcd30eb2-0040-4565-af14-7e4c21baaf24	2025-10-13 12:28:33.349878+03	2025-10-13 12:28:37.125718+03	t	kra_pin	uploads/dev/95069092-9673-4c6b-a137-19a3f6131272/2025/10/cc11fdf8-f2ca-4261-91c5-0ee7d1a9a9cd/downloadpng	downloadpng	{"fields": {",": "", "-": "", "I": "", "mm": "", "- -": "", "that -": ""}, "diagnostics": {"clarity": "poor", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 28, "typeMatch": false, "wordCount": 42, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 69.89}, "canonicalFields": {}}	\N	DONE	893fa392-2c22-458a-bb87-b0c70a07eaa9	\N	\N	\N	\N	\N	Django	development	\N
\.


--
-- Data for Name: app_extendiblepricing; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_extendiblepricing (id, date_created, date_updated, is_active, initial_period_days, initial_amount, balance_amount, total_annual_premium, extension_deadline_days, grace_period_days, cover_note_template, full_certificate_template, extension_reminder_template, auto_reminder_schedule, penalty_for_late_extension, allow_partial_extension, subcategory_id, underwriter_id) FROM stdin;
\.


--
-- Data for Name: app_extensionreminder; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_extensionreminder (id, date_created, date_updated, is_active, reminder_type, scheduled_date, sent_date, status, message_template, personalized_message, delivery_channel, delivery_status, customer_response, customer_response_date, follow_up_required, policy_extension_id) FROM stdin;
\.


--
-- Data for Name: app_insuranceprovider; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_insuranceprovider (id, date_created, date_updated, is_active, name, code, contact_email, contact_phone, address, supported_categories, supported_payment_methods, features, display_mode) FROM stdin;
2ccc38e1-d8c1-42e1-acca-19bbc0dd3c28	2025-09-27 00:17:45.166212+03	2025-09-27 00:18:17.65771+03	t	Britam Insurance	BRITAM	info@britam.com	\N	\N	["PRIVATE", "COMMERCIAL", "PSV", "MOTORCYCLE"]	[]	{"pricing": {"PRIVATE_TOR": {"base_premium": 1725.0, "pricing_type": "fixed"}, "PSV_UBER_TP": {"base_premium": 6160.0, "pricing_type": "fixed"}, "PSV_UBER_COMP": {"rate": 0.04104, "min_premium": 16200.000000000002, "pricing_type": "percentage"}, "COMMERCIAL_TOR": {"base_premium": 2300.0, "pricing_type": "fixed"}, "PSV_MATATU_1M_TP": {"base_premium": 3500.0, "pricing_type": "fixed"}, "MOTORCYCLE_PSV_TP": {"base_premium": 3500.0, "pricing_type": "fixed"}, "PRIVATE_THIRD_PARTY": {"base_premium": 3920.0, "pricing_type": "fixed"}, "MOTORCYCLE_PRIVATE_TP": {"base_premium": 3500.0, "pricing_type": "fixed"}, "PRIVATE_COMPREHENSIVE": {"rate": 0.0324, "min_premium": 16200.000000000002, "pricing_type": "percentage"}, "PRIVATE_MOTORCYCLE_TP": {"base_premium": 3136.0, "pricing_type": "fixed"}, "COMMERCIAL_OWN_GOODS_TP": {"base_premium": 5040.0, "pricing_type": "fixed"}, "MOTORCYCLE_PRIVATE_COMP": {"rate": 0.03, "min_premium": 16200.000000000002, "pricing_type": "percentage"}, "PRIVATE_THIRD_PARTY_EXT": {"base_premium": 4500.0, "pricing_type": "fixed"}, "COMMERCIAL_OWN_GOODS_COMP": {"rate": 0.0378, "min_premium": 16200.000000000002, "pricing_type": "percentage"}, "COMMERCIAL_GENERAL_CARTAGE_TP": {"base_premium": 5824.0, "pricing_type": "fixed"}}, "market_position": "premium"}	GROSS
14900c1c-4327-4366-a1e9-585699b1a495	2025-09-23 17:54:11.598596+03	2025-09-27 00:18:17.658987+03	t	Jubilee Insurance	JUBILEE	info@jubileekenya.com	\N	\N	["PRIVATE", "COMMERCIAL", "PSV", "TUKTUK"]	["mpesa"]	{"dmvic": true, "pricing": {"PRIVATE_TOR": {"base_premium": 1320.0, "pricing_type": "fixed"}, "PSV_UBER_TP": {"base_premium": 4675.0, "pricing_type": "fixed"}, "PSV_UBER_COMP": {"rate": 0.03496, "min_premium": 13800.0, "pricing_type": "percentage"}, "TUKTUK_PSV_TP": {"base_premium": 3500.0, "pricing_type": "fixed"}, "COMMERCIAL_TOR": {"base_premium": 1760.0, "pricing_type": "fixed"}, "PSV_MATATU_1M_TP": {"base_premium": 3500.0, "pricing_type": "fixed"}, "PRIVATE_THIRD_PARTY": {"base_premium": 2975.0, "pricing_type": "fixed"}, "TUKTUK_COMMERCIAL_TP": {"base_premium": 3500.0, "pricing_type": "fixed"}, "PRIVATE_COMPREHENSIVE": {"rate": 0.0276, "min_premium": 13800.0, "pricing_type": "percentage"}, "PRIVATE_MOTORCYCLE_TP": {"base_premium": 2380.0, "pricing_type": "fixed"}, "TUKTUK_COMMERCIAL_COMP": {"rate": 0.03, "min_premium": 13800.0, "pricing_type": "percentage"}, "COMMERCIAL_OWN_GOODS_TP": {"base_premium": 3825.0, "pricing_type": "fixed"}, "PRIVATE_THIRD_PARTY_EXT": {"base_premium": 4500.0, "pricing_type": "fixed"}, "COMMERCIAL_OWN_GOODS_COMP": {"rate": 0.0322, "min_premium": 13800.0, "pricing_type": "percentage"}, "COMMERCIAL_GENERAL_CARTAGE_TP": {"base_premium": 4420.0, "pricing_type": "fixed"}}, "market_position": "budget"}	GROSS
155e4474-a112-4231-b2b4-29e7f0a675e4	2025-09-23 22:14:48.891896+03	2025-09-30 13:43:56.412981+03	t	MONARCH	MNK	\N	\N	\N	[]	[]	{}	GROSS
39667f07-51d1-483b-a430-3fc2b52b05b9	2025-09-27 00:17:24.521142+03	2025-09-27 00:18:17.65387+03	t	CIC Insurance Group	CIC	info@cic.co.ke	\N	\N	["PRIVATE", "COMMERCIAL", "PSV", "MOTORCYCLE", "TUKTUK"]	[]	{"pricing": {"PRIVATE_TOR": {"base_premium": 1725.0, "pricing_type": "fixed"}, "PSV_UBER_TP": {"base_premium": 6160.0, "pricing_type": "fixed"}, "PSV_UBER_COMP": {"rate": 0.04104, "min_premium": 16200.000000000002, "pricing_type": "percentage"}, "TUKTUK_PSV_TP": {"base_premium": 3500.0, "pricing_type": "fixed"}, "COMMERCIAL_TOR": {"base_premium": 2300.0, "pricing_type": "fixed"}, "PSV_MATATU_1M_TP": {"base_premium": 3500.0, "pricing_type": "fixed"}, "MOTORCYCLE_PSV_TP": {"base_premium": 3500.0, "pricing_type": "fixed"}, "PRIVATE_THIRD_PARTY": {"base_premium": 3920.0, "pricing_type": "fixed"}, "TUKTUK_COMMERCIAL_TP": {"base_premium": 3500.0, "pricing_type": "fixed"}, "MOTORCYCLE_PRIVATE_TP": {"base_premium": 3500.0, "pricing_type": "fixed"}, "PRIVATE_COMPREHENSIVE": {"rate": 0.0324, "min_premium": 16200.000000000002, "pricing_type": "percentage"}, "PRIVATE_MOTORCYCLE_TP": {"base_premium": 3136.0, "pricing_type": "fixed"}, "TUKTUK_COMMERCIAL_COMP": {"rate": 0.03, "min_premium": 16200.000000000002, "pricing_type": "percentage"}, "COMMERCIAL_OWN_GOODS_TP": {"base_premium": 5040.0, "pricing_type": "fixed"}, "MOTORCYCLE_PRIVATE_COMP": {"rate": 0.03, "min_premium": 16200.000000000002, "pricing_type": "percentage"}, "PRIVATE_THIRD_PARTY_EXT": {"base_premium": 4500.0, "pricing_type": "fixed"}, "COMMERCIAL_OWN_GOODS_COMP": {"rate": 0.0378, "min_premium": 16200.000000000002, "pricing_type": "percentage"}, "COMMERCIAL_GENERAL_CARTAGE_TP": {"base_premium": 5824.0, "pricing_type": "fixed"}}, "market_position": "premium"}	GROSS
acff5e40-a95b-4dd1-bc06-8e210e1e95bc	2025-09-23 17:54:11.595169+03	2025-09-27 00:18:17.655427+03	t	APA Insurance	APA	info@apainsurance.org	\N	\N	["PRIVATE", "COMMERCIAL", "PSV", "MOTORCYCLE", "TUKTUK"]	["mpesa", "dpo"]	{"dmvic": true, "pricing": {"PRIVATE_TOR": {"base_premium": 1500.0, "pricing_type": "fixed"}, "PSV_UBER_TP": {"base_premium": 5500.0, "pricing_type": "fixed"}, "PSV_UBER_COMP": {"rate": 0.038, "min_premium": 15000.0, "pricing_type": "percentage"}, "TUKTUK_PSV_TP": {"base_premium": 3500.0, "pricing_type": "fixed"}, "COMMERCIAL_TOR": {"base_premium": 2000.0, "pricing_type": "fixed"}, "PSV_MATATU_1M_TP": {"base_premium": 3500.0, "pricing_type": "fixed"}, "MOTORCYCLE_PSV_TP": {"base_premium": 3500.0, "pricing_type": "fixed"}, "PRIVATE_THIRD_PARTY": {"base_premium": 3500.0, "pricing_type": "fixed"}, "TUKTUK_COMMERCIAL_TP": {"base_premium": 3500.0, "pricing_type": "fixed"}, "MOTORCYCLE_PRIVATE_TP": {"base_premium": 3500.0, "pricing_type": "fixed"}, "PRIVATE_COMPREHENSIVE": {"rate": 0.03, "min_premium": 15000.0, "pricing_type": "percentage"}, "PRIVATE_MOTORCYCLE_TP": {"base_premium": 2800.0, "pricing_type": "fixed"}, "TUKTUK_COMMERCIAL_COMP": {"rate": 0.03, "min_premium": 15000.0, "pricing_type": "percentage"}, "COMMERCIAL_OWN_GOODS_TP": {"base_premium": 4500.0, "pricing_type": "fixed"}, "MOTORCYCLE_PRIVATE_COMP": {"rate": 0.03, "min_premium": 15000.0, "pricing_type": "percentage"}, "PRIVATE_THIRD_PARTY_EXT": {"base_premium": 4500.0, "pricing_type": "fixed"}, "COMMERCIAL_OWN_GOODS_COMP": {"rate": 0.035, "min_premium": 15000.0, "pricing_type": "percentage"}, "COMMERCIAL_GENERAL_CARTAGE_TP": {"base_premium": 5200.0, "pricing_type": "fixed"}}, "market_position": "competitive"}	GROSS
771c566f-292a-49f1-97a9-19c2b967335e	2025-09-24 11:29:37.723871+03	2025-09-30 13:43:00.947284+03	t	PATABIMA INC	PTA	\N	\N	\N	["PRIVATE", "COMMERCIAL", "MOTORCYCLE", "TUKTUK"]	["MPESA", "CARD", "BANK_TRANSFER", "CASH"]	{"pricing": {"PRIVATE_TP": {"base_premium": 2200, "pricing_type": "fixed"}, "PRIVATE_TOR": {"base_premium": 600, "pricing_type": "fixed"}, "MOTORCYCLE_TP": {"base_premium": 2500, "pricing_type": "fixed"}, "TUKTUK_PSV_TP": {"base_premium": 3500, "pricing_type": "fixed"}, "COMMERCIAL_TOR": {"base_premium": 1760, "pricing_type": "fixed"}, "MOTORCYCLE_TOR": {"base_premium": 800, "pricing_type": "fixed"}, "MOTORCYCLE_PSV_TP": {"base_premium": 3500, "pricing_type": "fixed"}, "PRIVATE_THIRD_PARTY": {"base_premium": 2975, "pricing_type": "fixed"}, "TUKTUK_COMMERCIAL_TP": {"base_premium": 3500, "pricing_type": "fixed"}, "MOTORCYCLE_PRIVATE_TP": {"base_premium": 3500, "pricing_type": "fixed"}, "PRIVATE_COMPREHENSIVE": {"rate": 0.03, "min_premium": 15000, "pricing_type": "percentage"}, "PRIVATE_MOTORCYCLE_TP": {"base_premium": 2380, "pricing_type": "fixed"}, "TUKTUK_COMMERCIAL_COMP": {"rate": 0.03, "min_premium": 13800, "pricing_type": "percentage"}, "COMMERCIAL_OWN_GOODS_TP": {"base_premium": 3825, "pricing_type": "fixed"}, "MOTORCYCLE_PRIVATE_COMP": {"rate": 0.03, "min_premium": 13800, "pricing_type": "percentage"}, "PRIVATE_THIRD_PARTY_EXT": {"base_premium": 4500, "pricing_type": "fixed"}, "MOTORCYCLE_COMPREHENSIVE": {"rate": 0.025, "min_premium": 8000, "pricing_type": "percentage"}, "COMMERCIAL_OWN_GOODS_COMP": {"rate": 0.0322, "min_premium": 13800, "pricing_type": "percentage"}, "COMMERCIAL_GENERAL_CARTAGE_TP": {"base_premium": 4420, "pricing_type": "fixed"}}, "addon_overrides": {}, "market_position": "budget"}	GROSS
aa85d49e-06a2-40ec-9a22-e09b453f8066	2025-09-27 00:18:17.626625+03	2025-10-08 14:59:22.145196+03	t	Madison Insurance	MADISON	info@madison.co.ke	\N	\N	["PRIVATE", "COMMERCIAL", "MOTORCYCLE", "TUKTUK"]	[]	{"pricing": {"PRIVATE_TP": {"base_premium": 2200, "pricing_type": "fixed"}, "PRIVATE_TOR": {"base_premium": 600, "pricing_type": "fixed"}, "MOTORCYCLE_TP": {"base_premium": 2000, "pricing_type": "fixed"}, "TUKTUK_PSV_TP": {"base_premium": 3500, "pricing_type": "fixed"}, "COMMERCIAL_TOR": {"base_premium": 1760, "pricing_type": "fixed"}, "MOTORCYCLE_TOR": {"base_premium": 800, "pricing_type": "fixed"}, "MOTORCYCLE_PSV_TP": {"base_premium": 3500, "pricing_type": "fixed"}, "PRIVATE_THIRD_PARTY": {"base_premium": 2975, "pricing_type": "fixed"}, "TUKTUK_COMMERCIAL_TP": {"base_premium": 3500, "pricing_type": "fixed"}, "MOTORCYCLE_PRIVATE_TP": {"base_premium": 3500, "pricing_type": "fixed"}, "PRIVATE_COMPREHENSIVE": {"rate": 0.03, "min_premium": 15000, "pricing_type": "percentage"}, "PRIVATE_MOTORCYCLE_TP": {"base_premium": 2380, "pricing_type": "fixed"}, "TUKTUK_COMMERCIAL_COMP": {"rate": 0.03, "min_premium": 13800, "pricing_type": "percentage"}, "COMMERCIAL_OWN_GOODS_TP": {"base_premium": 3825, "pricing_type": "fixed"}, "MOTORCYCLE_PRIVATE_COMP": {"rate": 0.03, "min_premium": 13800, "pricing_type": "percentage"}, "PRIVATE_THIRD_PARTY_EXT": {"base_premium": 4500, "pricing_type": "fixed"}, "MOTORCYCLE_COMPREHENSIVE": {"rate": 0.025, "min_premium": 8000, "pricing_type": "percentage"}, "COMMERCIAL_OWN_GOODS_COMP": {"rate": 0.0322, "min_premium": 13800, "pricing_type": "percentage"}, "COMMERCIAL_GENERAL_CARTAGE_TP": {"base_premium": 4420, "pricing_type": "fixed"}}, "addon_overrides": {}, "market_position": "budget"}	GROSS
cb192689-b1f2-4afd-b08a-c2bc2e6cc864	2025-09-27 00:18:17.62406+03	2025-10-08 15:00:12.548014+03	t	UAP Insurance	UAP	info@uap.co.ke	\N	\N	["PRIVATE", "COMMERCIAL", "PSV", "SPECIAL CLASS"]	[]	{"pricing": {"PRIVATE_TOR": {"base_premium": 1500.0, "pricing_type": "fixed"}, "PSV_UBER_TP": {"base_premium": 5500.0, "pricing_type": "fixed"}, "PSV_UBER_COMP": {"rate": 0.038, "min_premium": 15000.0, "pricing_type": "percentage"}, "COMMERCIAL_TOR": {"base_premium": 2000.0, "pricing_type": "fixed"}, "PSV_MATATU_1M_TP": {"base_premium": 3500.0, "pricing_type": "fixed"}, "PRIVATE_THIRD_PARTY": {"base_premium": 3500.0, "pricing_type": "fixed"}, "PRIVATE_COMPREHENSIVE": {"rate": 0.03, "min_premium": 15000.0, "pricing_type": "percentage"}, "PRIVATE_MOTORCYCLE_TP": {"base_premium": 2800.0, "pricing_type": "fixed"}, "COMMERCIAL_OWN_GOODS_TP": {"base_premium": 4500.0, "pricing_type": "fixed"}, "PRIVATE_THIRD_PARTY_EXT": {"base_premium": 4500.0, "pricing_type": "fixed"}, "COMMERCIAL_OWN_GOODS_COMP": {"rate": 0.035, "min_premium": 15000.0, "pricing_type": "percentage"}, "COMMERCIAL_GENERAL_CARTAGE_TP": {"base_premium": 5200.0, "pricing_type": "fixed"}}, "market_position": "competitive"}	GROSS
\.


--
-- Data for Name: app_insurancequotation; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_insurancequotation (id, date_created, date_updated, is_active, insurance_type, quotation_number, status, form_data, base_premium, training_levy, stamp_duty, total_premium, dmvic_data, textract_data, selected_underwriter, agent_id) FROM stdin;
3926a767-a4f5-428f-b053-2ece81e6ebde	2025-09-30 16:55:24.51352+03	2025-09-30 16:55:24.513538+03	t	MOTOR_PRIVATE	QUO940054	DRAFT	{"debug": true}	\N	\N	\N	\N	\N	\N	\N	2e85b1cf-3231-46a8-9678-4a103673e5da
3acf1f03-7de5-4154-90a5-e2735c3fab09	2025-09-30 17:13:33.702423+03	2025-09-30 17:13:33.702439+03	t	MOTOR_PRIVATE	QUO809177	DRAFT	{"debug": true}	\N	\N	\N	\N	\N	\N	\N	2e85b1cf-3231-46a8-9678-4a103673e5da
f03e81fa-b5ff-4b53-88ee-fe83dbef392a	2025-09-30 17:19:22.251789+03	2025-09-30 17:19:22.251807+03	t	MOTOR_PRIVATE	QUO133922	DRAFT	{"debug": true}	\N	\N	\N	\N	\N	\N	\N	2e85b1cf-3231-46a8-9678-4a103673e5da
9437f29c-55d0-48fe-9883-a288539f52ee	2025-09-30 17:20:07.042375+03	2025-09-30 17:20:07.042392+03	t	MOTOR_PRIVATE	QUO539978	DRAFT	{"debug": true}	\N	\N	\N	\N	\N	\N	\N	2e85b1cf-3231-46a8-9678-4a103673e5da
bed7e4a2-4ccf-4bab-8634-080621c7cd04	2025-09-30 18:04:42.701134+03	2025-09-30 18:04:42.701149+03	t	MOTOR_PRIVATE	QUO888774	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
371910ae-8145-4282-8d68-e6b326eaa57d	2025-09-30 18:10:45.454935+03	2025-09-30 18:10:45.45495+03	t	MOTOR_PRIVATE	QUO866075	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
c02fa29b-c4a0-4a67-a3d2-7f5e0487f453	2025-09-30 18:56:47.855444+03	2025-09-30 18:56:47.855464+03	t	MOTOR_PRIVATE	QUO502686	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
f56c5d6d-5585-48be-b463-b57efdfd48e5	2025-09-30 19:01:44.384636+03	2025-09-30 19:01:44.384651+03	t	MOTOR_PRIVATE	QUO696798	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
a0bcd341-b52b-46f8-9d95-83c603f7e72c	2025-09-30 19:10:07.439482+03	2025-09-30 19:10:07.439498+03	t	MOTOR_PRIVATE	QUO413158	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
324b075b-eafa-42d3-8d2a-4348ac2b9ced	2025-09-30 19:25:12.078943+03	2025-09-30 19:25:18.125346+03	t	MOTOR_PRIVATE	QUO750375	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	{"logbook": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}}	\N	95069092-9673-4c6b-a137-19a3f6131272
bb749322-867d-4554-894c-76d3addbc178	2025-09-30 19:32:07.501736+03	2025-09-30 19:32:13.735193+03	t	MOTOR_PRIVATE	QUO379729	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "canonicalFields": {"id_type": "pass_citizencard", "id_number": "5843 2166 1964 2184", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
390c7cdc-ef50-4801-bf72-b982485c2c70	2025-09-30 19:42:06.439546+03	2025-09-30 19:42:12.613314+03	t	MOTOR_PRIVATE	QUO328632	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "canonicalFields": {"id_type": "pass_citizencard", "id_number": "5843 2166 1964 2184", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
a6379ef8-7651-4b5d-9c4b-73292d61e26b	2025-09-30 19:42:40.185652+03	2025-09-30 19:42:46.364501+03	t	MOTOR_PRIVATE	QUO391927	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "canonicalFields": {"id_type": "pass_citizencard", "id_number": "5843 2166 1964 2184", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
ac61fae5-601d-4e18-9390-c7bcc3a3dff7	2025-09-30 19:49:57.481045+03	2025-09-30 19:50:03.5756+03	t	MOTOR_PRIVATE	QUO761020	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	{"logbook": {"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "canonicalFields": {"id_type": "pass_citizencard", "id_number": "5843 2166 1964 2184", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
dbfcd66a-3e49-49cf-b726-6fce7a733477	2025-09-30 19:53:23.626197+03	2025-09-30 19:53:30.375936+03	t	MOTOR_PRIVATE	QUO045994	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	{"logbook": {"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "canonicalFields": {"id_type": "pass_citizencard", "id_number": "5843 2166 1964 2184", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
a0600459-4879-4714-aec4-1652d7d80a62	2025-09-30 19:54:48.35197+03	2025-09-30 19:54:56.909897+03	t	MOTOR_PRIVATE	QUO557250	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "canonicalFields": {"id_type": "pass_citizencard", "id_number": "5843 2166 1964 2184", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
ac6bf4ad-a6c6-479d-af26-0ec990102b37	2025-09-30 20:11:40.903886+03	2025-09-30 20:11:48.295579+03	t	MOTOR_PRIVATE	QUO283251	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	{"logbook": {"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "canonicalFields": {"id_type": "pass_citizencard", "id_number": "5843 2166 1964 2184", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
d8dc5cd2-665b-4ce5-96a1-d80c3b5c7ee6	2025-09-30 20:12:59.917036+03	2025-09-30 20:12:59.917046+03	t	MOTOR_PRIVATE	QUO878292	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
be838dc9-d2ac-4fef-97fb-ac7b8577ac80	2025-09-30 20:13:33.814504+03	2025-09-30 20:13:40.931508+03	t	MOTOR_PRIVATE	QUO174400	DRAFT	{"source": "docs_upload", "docType": "kra_pin", "autoCreated": true}	\N	\N	\N	\N	\N	{"kra_pin": {"fields": {"-": ""}, "canonicalFields": {}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
958e24c5-0964-44b3-bee3-c6e31b23adc6	2025-09-30 20:19:34.148562+03	2025-09-30 20:19:40.67031+03	t	MOTOR_PRIVATE	QUO136061	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "diagnostics": {"clarity": "fair", "lineCount": 15, "typeMatch": true, "wordCount": 34, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 88.34}, "canonicalFields": {"id_type": "pass_citizencard", "id_number": "5843 2166 1964 2184", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
f4fe3612-b100-4ed5-9363-4bf7c6adb2cf	2025-09-30 20:20:38.028969+03	2025-09-30 20:20:44.577695+03	t	MOTOR_PRIVATE	QUO345664	DRAFT	{"source": "docs_upload", "docType": "kra_pin", "autoCreated": true}	\N	\N	\N	\N	\N	{"kra_pin": {"fields": {"-": ""}, "diagnostics": {"clarity": "good", "lineCount": 11, "typeMatch": false, "wordCount": 30, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 95.15}, "canonicalFields": {}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
191dba77-6cab-4c5d-a03d-29f5e72483cf	2025-09-30 20:26:39.320239+03	2025-09-30 20:26:45.318354+03	t	MOTOR_PRIVATE	QUO579423	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "diagnostics": {"clarity": "fair", "lineCount": 15, "typeMatch": true, "wordCount": 34, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 88.34}, "canonicalFields": {"id_type": "pass_citizencard", "id_number": "5843 2166 1964 2184", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
07f1024c-fb16-452b-b7e7-0440606ec7a0	2025-10-01 09:19:57.413449+03	2025-10-01 09:19:57.41346+03	t	MOTOR_PRIVATE	QUO057263	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
466632ed-5346-46dd-b1cd-4edcbc6326d3	2025-10-01 09:20:16.707179+03	2025-10-01 09:20:16.70719+03	t	MOTOR_PRIVATE	QUO376308	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
9f8d23ab-015d-4050-bf23-82f17c0e39c5	2025-10-01 09:20:28.041015+03	2025-10-01 09:20:28.041029+03	t	MOTOR_PRIVATE	QUO546099	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
de6058ef-e013-403d-ad7b-616bf2f64df3	2025-10-01 09:29:33.363163+03	2025-10-01 09:29:33.363177+03	t	MOTOR_PRIVATE	QUO714950	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
eb6e1a2e-1dbc-4184-b223-185c17efbe05	2025-10-01 10:43:39.030463+03	2025-10-01 10:43:39.030483+03	t	MOTOR_PRIVATE	QUO253880	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
05574b68-538e-43d4-93f9-e21d1ab5a0f8	2025-10-01 10:53:13.308985+03	2025-10-01 10:53:13.308998+03	t	MOTOR_PRIVATE	QUO543200	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
1f373deb-7400-42c0-a74f-bf87fe101b11	2025-10-01 10:54:05.64455+03	2025-10-01 10:54:05.644565+03	t	MOTOR_PRIVATE	QUO166180	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
4ab42a09-be08-488e-93d8-cdd912c6ed9d	2025-10-01 11:07:07.496045+03	2025-10-01 11:07:07.496061+03	t	MOTOR_PRIVATE	QUO907654	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
cbbd9243-167a-487d-8b0f-1050fd10c89d	2025-10-01 11:14:08.311218+03	2025-10-01 11:14:08.311233+03	t	MOTOR_PRIVATE	QUO429664	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
821069e9-35e7-40e6-8e02-f69648787b3b	2025-10-01 11:44:02.930137+03	2025-10-01 11:44:02.930152+03	t	MOTOR_PRIVATE	QUO562402	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
1ce536be-9109-47a9-b400-1a5a3d7003a5	2025-10-01 11:45:18.649087+03	2025-10-01 11:45:18.649101+03	t	MOTOR_PRIVATE	QUO265160	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
cf9331b0-2c4d-4692-956a-d1be2e295049	2025-10-01 11:52:48.874593+03	2025-10-01 11:52:48.874607+03	t	MOTOR_PRIVATE	QUO925302	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
b5640214-caae-4f53-b8c9-a01cd4f77fbe	2025-10-01 11:57:55.242568+03	2025-10-01 11:57:55.242581+03	t	MOTOR_PRIVATE	QUO255660	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
f83f7caf-64cd-4d31-8da5-094cdaa0270b	2025-10-01 12:29:23.913947+03	2025-10-01 12:29:23.913963+03	t	MOTOR_PRIVATE	QUO572449	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
e936301d-2e85-4c85-96fd-c6ef663ff354	2025-10-01 14:13:02.201568+03	2025-10-01 14:13:02.201583+03	t	MOTOR_PRIVATE	QUO994405	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
a02bfd8d-6b62-4d0b-aa4d-58773640aab2	2025-10-01 22:46:52.607723+03	2025-10-01 22:46:52.607735+03	t	MOTOR_PRIVATE	QUO770014	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
fc2003b6-bf2d-4a14-a162-b620beab5254	2025-10-01 23:05:17.624704+03	2025-10-01 23:05:33.096597+03	t	MOTOR_PRIVATE	QUO401215	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 15, "typeMatch": true, "wordCount": 34, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 88.34}, "canonicalFields": {"id_type": "pass_citizencard", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
54156927-dcea-45ef-b34c-ce31b6d1cd67	2025-10-01 23:22:44.406996+03	2025-10-01 23:23:00.14207+03	t	MOTOR_PRIVATE	QUO156206	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 15, "typeMatch": true, "wordCount": 34, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 88.34}, "canonicalFields": {"id_type": "pass_citizencard", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
f0dd499a-d077-461e-993f-bae4c21587d1	2025-10-01 23:29:48.446423+03	2025-10-01 23:29:56.602554+03	t	MOTOR_PRIVATE	QUO425362	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 15, "typeMatch": true, "wordCount": 34, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 88.34}, "canonicalFields": {"id_type": "pass_citizencard", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
5bac01e9-28f3-4d0d-9d9e-700ad628196e	2025-10-01 23:37:04.790354+03	2025-10-01 23:37:13.933279+03	t	MOTOR_PRIVATE	QUO731393	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 15, "typeMatch": true, "wordCount": 34, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 88.34}, "canonicalFields": {"id_type": "pass_citizencard", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
d90eeaf8-a11b-48fb-a60c-961a75e929fb	2025-10-02 17:55:44.709535+03	2025-10-02 17:55:44.709551+03	t	MOTOR_PRIVATE	QUO481759	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
19d9ce47-2737-41df-a11f-65ac79c3aee7	2025-10-02 17:55:45.113301+03	2025-10-02 17:55:45.113315+03	t	MOTOR_PRIVATE	QUO051069	DRAFT	{"source": "docs_upload", "docType": "kra_pin", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
76161d4b-a524-4ba3-a37c-fe448738cc1f	2025-10-02 10:20:15.535971+03	2025-10-02 10:20:23.479319+03	t	MOTOR_PRIVATE	QUO616114	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 15, "typeMatch": true, "wordCount": 34, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 88.34}, "canonicalFields": {"id_type": "pass_citizencard", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
9b85c333-0fbb-4f96-8406-821545c77ca1	2025-10-02 11:18:25.881599+03	2025-10-02 11:18:40.382386+03	t	MOTOR_PRIVATE	QUO508877	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 15, "typeMatch": true, "wordCount": 34, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 88.34}, "canonicalFields": {"id_type": "pass_citizencard", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
05153cb7-9df8-4cc9-b468-14805536e902	2025-10-02 11:40:19.922368+03	2025-10-02 11:40:30.724726+03	t	MOTOR_PRIVATE	QUO175513	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {"OoB": "09 Nov 2002", "Name": "Angela Greene", "Expires on": "30 Apr 2028"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 15, "typeMatch": true, "wordCount": 34, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 88.34}, "canonicalFields": {"id_type": "pass_citizencard", "owner_name": "Angela Greene", "id_expiry_date": "2028-04-30"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
00d83689-0605-4c10-8530-0453f9ac3a42	2025-10-02 14:39:12.735301+03	2025-10-02 14:39:19.660769+03	t	MOTOR_PRIVATE	QUO944345	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": true, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "identification", "id card"], "presentKeywords": ["republic of kenya"], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}}	\N	f358d3bc-ba14-439b-ac4d-eb402ddb9ae7
cf70c4da-f8cb-470e-a894-fac447f14163	2025-10-02 14:39:46.454187+03	2025-10-02 14:39:53.260367+03	t	MOTOR_PRIVATE	QUO544025	DRAFT	{"source": "docs_upload", "docType": "kra_pin", "autoCreated": true}	\N	\N	\N	\N	\N	{"kra_pin": {"fields": {",": "", "-": "", "I": "", "mm": "", "- -": "", "that -": ""}, "diagnostics": {"clarity": "poor", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 28, "typeMatch": false, "wordCount": 42, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 69.89}, "canonicalFields": {}}}	\N	f358d3bc-ba14-439b-ac4d-eb402ddb9ae7
4ce5c15b-6094-4aa6-a060-1c719c2cb74e	2025-10-02 14:39:45.071021+03	2025-10-02 14:39:53.512277+03	t	MOTOR_PRIVATE	QUO809864	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	{"logbook": {"fields": {"K": "1075352 C", "Pin:": "", "Town": "NAIROBI", "Body:": "SALOON", "Code:": "", "Color": "SILVER", "Duty:": "Paid", "Fuel:": "Petrol", "Make:": "TOYOTA", "Name:": "-", "Type:": "Motor vehicle", "Axies:": "2", "Model:": "CBA-", "class:": "Private", "Box No.": "", "Rating:": "1290", "(Section": "6(5))", "12/10/16": "", "country,": "Capan", "Man.Year:": "2009", "Engine No:": "", "Reg. Date:": "06-OCT-16", "Important:-": "The person in whose name # vehicle is registered that unless the contrary be proved, be deemed to be the owner of the vehicle. Before you use any vehicle on the road, please ensure that your insurance against third party risk is in order it is # serious offence to drive without proper insurance", "Original No": "20000071409", "Passengers:": "5", "TRAFFIC ACT": "(CAP 403)", "Tare weight:": "1110", "Gross weight:": "", "Previous Reg.": "", "Registration:": "KUMMA", "USAN signature:": "", "Load capacity(ikg):": "", "Authorising Signature": "BEST", "Previous registration:": "5305A9271", "Chasis/Frame:NT00000000": "", "Number of previous owners:": "0"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": ["kw:pin"], "logbook": ["kw:registration"], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 59, "typeMatch": false, "wordCount": 145, "typeScores": {"kra_pin": 1, "logbook": 1, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "logbook", "missingKeywords": ["logbook", "chassis", "ntsa", "national transport", "chief registrar"], "presentKeywords": ["registration"], "avgWordConfidence": 87.18}, "canonicalFields": {"id_type": "national_id", "id_number": "1075352"}}}	\N	f358d3bc-ba14-439b-ac4d-eb402ddb9ae7
18c543a6-1bb3-47c4-8f98-71ea48ad776e	2025-10-02 14:40:07.307594+03	2025-10-02 14:40:12.165579+03	t	MOTOR_PRIVATE	QUO047040	DRAFT	{"source": "docs_upload", "docType": "kra_pin", "autoCreated": true}	\N	\N	\N	\N	\N	{"kra_pin": {"fields": {",": "", "-": "", "I": "", "mm": "", "- -": "", "that -": ""}, "diagnostics": {"clarity": "poor", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 28, "typeMatch": false, "wordCount": 42, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 69.89}, "canonicalFields": {}}}	\N	f358d3bc-ba14-439b-ac4d-eb402ddb9ae7
91c9b6a7-e004-43ab-9670-305902e89bb0	2025-10-02 17:55:44.146138+03	2025-10-02 17:55:44.146152+03	t	MOTOR_PRIVATE	QUO661888	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	\N	\N	95069092-9673-4c6b-a137-19a3f6131272
e6425b70-69ee-4473-9c07-d061bae543b3	2025-10-08 09:44:05.691535+03	2025-10-08 09:44:14.124501+03	t	MOTOR_PRIVATE	QUO684148	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	{"logbook": {"fields": {"K": "1075352 C", "Pin:": "", "Town": "NAIROBI", "Body:": "SALOON", "Code:": "", "Color": "SILVER", "Duty:": "Paid", "Fuel:": "Petrol", "Make:": "TOYOTA", "Name:": "-", "Type:": "Motor vehicle", "Axies:": "2", "Model:": "CBA-", "class:": "Private", "Box No.": "", "Rating:": "1290", "(Section": "6(5))", "12/10/16": "", "country,": "Capan", "Man.Year:": "2009", "Engine No:": "", "Reg. Date:": "06-OCT-16", "Important:-": "The person in whose name # vehicle is registered that unless the contrary be proved, be deemed to be the owner of the vehicle. Before you use any vehicle on the road, please ensure that your insurance against third party risk is in order it is # serious offence to drive without proper insurance", "Original No": "20000071409", "Passengers:": "5", "TRAFFIC ACT": "(CAP 403)", "Tare weight:": "1110", "Gross weight:": "", "Previous Reg.": "", "Registration:": "KUMMA", "USAN signature:": "", "Load capacity(ikg):": "", "Authorising Signature": "BEST", "Previous registration:": "5305A9271", "Chasis/Frame:NT00000000": "", "Number of previous owners:": "0"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": ["kw:pin"], "logbook": ["kw:registration"], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 59, "typeMatch": false, "wordCount": 145, "typeScores": {"kra_pin": 1, "logbook": 1, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "logbook", "missingKeywords": ["logbook", "chassis", "ntsa", "national transport", "chief registrar"], "presentKeywords": ["registration"], "avgWordConfidence": 87.18}, "canonicalFields": {"id_type": "national_id", "id_number": "1075352"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
51b94d8a-868f-407e-a2f5-910423ba0dc8	2025-10-08 09:44:28.237178+03	2025-10-08 09:44:36.257764+03	t	MOTOR_PRIVATE	QUO478916	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": true, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "identification", "id card"], "presentKeywords": ["republic of kenya"], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
ad314bbe-6fdd-45c7-8ff9-8e05f9a1bb20	2025-10-08 09:44:30.476903+03	2025-10-08 09:44:38.537733+03	t	MOTOR_PRIVATE	QUO141079	DRAFT	{"source": "docs_upload", "docType": "kra_pin", "autoCreated": true}	\N	\N	\N	\N	\N	{"kra_pin": {"fields": {",": "", "-": "", "I": "", "mm": "", "- -": "", "that -": ""}, "diagnostics": {"clarity": "poor", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 28, "typeMatch": false, "wordCount": 42, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 69.89}, "canonicalFields": {}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
89fd682c-1a68-4e2d-8846-be70102afd4a	2025-10-08 09:57:21.607869+03	2025-10-08 09:57:25.859416+03	t	MOTOR_PRIVATE	QUO975479	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {",": "", "-": "", "I": "", "mm": "", "- -": "", "that -": ""}, "diagnostics": {"clarity": "poor", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 28, "typeMatch": true, "wordCount": 42, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 69.89}, "canonicalFields": {}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
1d112d9d-2091-494e-9ee0-54653fbc64d7	2025-10-08 09:57:20.9098+03	2025-10-08 09:57:29.636432+03	t	MOTOR_PRIVATE	QUO282375	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	{"logbook": {"fields": {"K": "1075352 C", "Pin:": "", "Town": "NAIROBI", "Body:": "SALOON", "Code:": "", "Color": "SILVER", "Duty:": "Paid", "Fuel:": "Petrol", "Make:": "TOYOTA", "Name:": "-", "Type:": "Motor vehicle", "Axies:": "2", "Model:": "CBA-", "class:": "Private", "Box No.": "", "Rating:": "1290", "(Section": "6(5))", "12/10/16": "", "country,": "Capan", "Man.Year:": "2009", "Engine No:": "", "Reg. Date:": "06-OCT-16", "Important:-": "The person in whose name # vehicle is registered that unless the contrary be proved, be deemed to be the owner of the vehicle. Before you use any vehicle on the road, please ensure that your insurance against third party risk is in order it is # serious offence to drive without proper insurance", "Original No": "20000071409", "Passengers:": "5", "TRAFFIC ACT": "(CAP 403)", "Tare weight:": "1110", "Gross weight:": "", "Previous Reg.": "", "Registration:": "KUMMA", "USAN signature:": "", "Load capacity(ikg):": "", "Authorising Signature": "BEST", "Previous registration:": "5305A9271", "Chasis/Frame:NT00000000": "", "Number of previous owners:": "0"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": ["kw:pin"], "logbook": ["kw:registration"], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 59, "typeMatch": false, "wordCount": 145, "typeScores": {"kra_pin": 1, "logbook": 1, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "logbook", "missingKeywords": ["logbook", "chassis", "ntsa", "national transport", "chief registrar"], "presentKeywords": ["registration"], "avgWordConfidence": 87.18}, "canonicalFields": {"id_type": "national_id", "id_number": "1075352"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
3b5ba5d3-e140-43b3-ab0c-07ff0d20508e	2025-10-08 09:57:31.946996+03	2025-10-08 09:57:41.89443+03	t	MOTOR_PRIVATE	QUO695273	DRAFT	{"source": "docs_upload", "docType": "kra_pin", "autoCreated": true}	\N	\N	\N	\N	\N	{"kra_pin": {"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": false, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
dd79cbc7-c430-4acb-be55-cb99ff1c55c7	2025-10-08 14:51:08.422173+03	2025-10-08 14:51:17.269762+03	t	MOTOR_PRIVATE	QUO545799	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	{"logbook": {"fields": {"K": "1075352 C", "Pin:": "", "Town": "NAIROBI", "Body:": "SALOON", "Code:": "", "Color": "SILVER", "Duty:": "Paid", "Fuel:": "Petrol", "Make:": "TOYOTA", "Name:": "-", "Type:": "Motor vehicle", "Axies:": "2", "Model:": "CBA-", "class:": "Private", "Box No.": "", "Rating:": "1290", "(Section": "6(5))", "12/10/16": "", "country,": "Capan", "Man.Year:": "2009", "Engine No:": "", "Reg. Date:": "06-OCT-16", "Important:-": "The person in whose name # vehicle is registered that unless the contrary be proved, be deemed to be the owner of the vehicle. Before you use any vehicle on the road, please ensure that your insurance against third party risk is in order it is # serious offence to drive without proper insurance", "Original No": "20000071409", "Passengers:": "5", "TRAFFIC ACT": "(CAP 403)", "Tare weight:": "1110", "Gross weight:": "", "Previous Reg.": "", "Registration:": "KUMMA", "USAN signature:": "", "Load capacity(ikg):": "", "Authorising Signature": "BEST", "Previous registration:": "5305A9271", "Chasis/Frame:NT00000000": "", "Number of previous owners:": "0"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": ["kw:pin"], "logbook": ["kw:registration"], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 59, "typeMatch": false, "wordCount": 145, "typeScores": {"kra_pin": 1, "logbook": 1, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "logbook", "missingKeywords": ["logbook", "chassis", "ntsa", "national transport", "chief registrar"], "presentKeywords": ["registration"], "avgWordConfidence": 87.18}, "canonicalFields": {"id_type": "national_id", "id_number": "1075352"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
371c9eff-2d73-4514-907c-89fa84f34d6d	2025-10-08 14:51:32.497857+03	2025-10-08 14:51:37.282185+03	t	MOTOR_PRIVATE	QUO862350	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": true, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "identification", "id card"], "presentKeywords": ["republic of kenya"], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
b7dc3a2b-2f1b-4c60-aef4-d77b29005b73	2025-10-08 14:51:33.110107+03	2025-10-08 14:51:41.18594+03	t	MOTOR_PRIVATE	QUO571962	DRAFT	{"source": "docs_upload", "docType": "kra_pin", "autoCreated": true}	\N	\N	\N	\N	\N	{"kra_pin": {"fields": {",": "", "-": "", "I": "", "mm": "", "- -": "", "that -": ""}, "diagnostics": {"clarity": "poor", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 28, "typeMatch": false, "wordCount": 42, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 69.89}, "canonicalFields": {}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
fcfadb57-411e-4760-9e9f-62b41a974583	2025-10-09 23:54:32.625204+03	2025-10-09 23:55:02.468996+03	t	MOTOR_PRIVATE	QUO002392	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	{"logbook": {"fields": {"K": "1075352 C", "Pin:": "", "Town": "NAIROBI", "Body:": "SALOON", "Code:": "", "Color": "SILVER", "Duty:": "Paid", "Fuel:": "Petrol", "Make:": "TOYOTA", "Name:": "-", "Type:": "Motor vehicle", "Axies:": "2", "Model:": "CBA-", "class:": "Private", "Box No.": "", "Rating:": "1290", "(Section": "6(5))", "12/10/16": "", "country,": "Capan", "Man.Year:": "2009", "Engine No:": "", "Reg. Date:": "06-OCT-16", "Important:-": "The person in whose name # vehicle is registered that unless the contrary be proved, be deemed to be the owner of the vehicle. Before you use any vehicle on the road, please ensure that your insurance against third party risk is in order it is # serious offence to drive without proper insurance", "Original No": "20000071409", "Passengers:": "5", "TRAFFIC ACT": "(CAP 403)", "Tare weight:": "1110", "Gross weight:": "", "Previous Reg.": "", "Registration:": "KUMMA", "USAN signature:": "", "Load capacity(ikg):": "", "Authorising Signature": "BEST", "Previous registration:": "5305A9271", "Chasis/Frame:NT00000000": "", "Number of previous owners:": "0"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": ["kw:pin"], "logbook": ["kw:registration"], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 59, "typeMatch": false, "wordCount": 145, "typeScores": {"kra_pin": 1, "logbook": 1, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "logbook", "missingKeywords": ["logbook", "chassis", "ntsa", "national transport", "chief registrar"], "presentKeywords": ["registration"], "avgWordConfidence": 87.18}, "canonicalFields": {"id_type": "national_id", "id_number": "1075352"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
7f8ebef0-56ce-4f65-ae57-311e6cb97df6	2025-10-09 23:55:04.801224+03	2025-10-09 23:55:10.21953+03	t	MOTOR_PRIVATE	QUO801717	DRAFT	{"source": "docs_upload", "docType": "kra_pin", "autoCreated": true}	\N	\N	\N	\N	\N	{"kra_pin": {"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": false, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
3671eaab-a61c-4cca-95f0-69de7e06b654	2025-10-09 23:54:36.289767+03	2025-10-09 23:55:12.599822+03	t	MOTOR_PRIVATE	QUO501213	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": true, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "identification", "id card"], "presentKeywords": ["republic of kenya"], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
8d8401b9-b0f3-4f93-998d-2ebb5a160915	2025-10-11 01:59:34.037139+03	2025-10-11 01:59:41.258446+03	t	MOTOR_PRIVATE	QUO580944	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	{"logbook": {"fields": {"K": "1075352 C", "Pin:": "", "Town": "NAIROBI", "Body:": "SALOON", "Code:": "", "Color": "SILVER", "Duty:": "Paid", "Fuel:": "Petrol", "Make:": "TOYOTA", "Name:": "-", "Type:": "Motor vehicle", "Axies:": "2", "Model:": "CBA-", "class:": "Private", "Box No.": "", "Rating:": "1290", "(Section": "6(5))", "12/10/16": "", "country,": "Capan", "Man.Year:": "2009", "Engine No:": "", "Reg. Date:": "06-OCT-16", "Important:-": "The person in whose name # vehicle is registered that unless the contrary be proved, be deemed to be the owner of the vehicle. Before you use any vehicle on the road, please ensure that your insurance against third party risk is in order it is # serious offence to drive without proper insurance", "Original No": "20000071409", "Passengers:": "5", "TRAFFIC ACT": "(CAP 403)", "Tare weight:": "1110", "Gross weight:": "", "Previous Reg.": "", "Registration:": "KUMMA", "USAN signature:": "", "Load capacity(ikg):": "", "Authorising Signature": "BEST", "Previous registration:": "5305A9271", "Chasis/Frame:NT00000000": "", "Number of previous owners:": "0"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": ["kw:pin"], "logbook": ["kw:registration"], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 59, "typeMatch": false, "wordCount": 145, "typeScores": {"kra_pin": 1, "logbook": 1, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "logbook", "missingKeywords": ["logbook", "chassis", "ntsa", "national transport", "chief registrar"], "presentKeywords": ["registration"], "avgWordConfidence": 87.18}, "canonicalFields": {"id_type": "national_id", "id_number": "1075352"}}}	\N	3dc28354-5326-4acb-b194-d2da11fd51c0
b33ee125-246d-4cb5-bf35-0c7b20014e53	2025-10-11 01:59:36.982647+03	2025-10-11 01:59:43.786326+03	t	MOTOR_PRIVATE	QUO545362	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": true, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "identification", "id card"], "presentKeywords": ["republic of kenya"], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}}	\N	3dc28354-5326-4acb-b194-d2da11fd51c0
5bab3d05-d23f-4d54-81b6-bd532bb80f9f	2025-10-11 01:59:37.505993+03	2025-10-11 01:59:44.273624+03	t	MOTOR_PRIVATE	QUO102684	DRAFT	{"source": "docs_upload", "docType": "kra_pin", "autoCreated": true}	\N	\N	\N	\N	\N	{"kra_pin": {"fields": {",": "", "-": "", "I": "", "mm": "", "- -": "", "that -": ""}, "diagnostics": {"clarity": "poor", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 28, "typeMatch": false, "wordCount": 42, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 69.89}, "canonicalFields": {}}}	\N	3dc28354-5326-4acb-b194-d2da11fd51c0
00330f38-3197-445b-bae2-ddad748f02d4	2025-10-13 09:59:03.979484+03	2025-10-13 09:59:09.790463+03	t	MOTOR_PRIVATE	QUO864692	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	{"logbook": {"fields": {"K": "1075352 C", "Pin:": "", "Town": "NAIROBI", "Body:": "SALOON", "Code:": "", "Color": "SILVER", "Duty:": "Paid", "Fuel:": "Petrol", "Make:": "TOYOTA", "Name:": "-", "Type:": "Motor vehicle", "Axies:": "2", "Model:": "CBA-", "class:": "Private", "Box No.": "", "Rating:": "1290", "(Section": "6(5))", "12/10/16": "", "country,": "Capan", "Man.Year:": "2009", "Engine No:": "", "Reg. Date:": "06-OCT-16", "Important:-": "The person in whose name # vehicle is registered that unless the contrary be proved, be deemed to be the owner of the vehicle. Before you use any vehicle on the road, please ensure that your insurance against third party risk is in order it is # serious offence to drive without proper insurance", "Original No": "20000071409", "Passengers:": "5", "TRAFFIC ACT": "(CAP 403)", "Tare weight:": "1110", "Gross weight:": "", "Previous Reg.": "", "Registration:": "KUMMA", "USAN signature:": "", "Load capacity(ikg):": "", "Authorising Signature": "BEST", "Previous registration:": "5305A9271", "Chasis/Frame:NT00000000": "", "Number of previous owners:": "0"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": ["kw:pin"], "logbook": ["kw:registration"], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 59, "typeMatch": false, "wordCount": 145, "typeScores": {"kra_pin": 1, "logbook": 1, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "logbook", "missingKeywords": ["logbook", "chassis", "ntsa", "national transport", "chief registrar"], "presentKeywords": ["registration"], "avgWordConfidence": 87.18}, "canonicalFields": {"id_type": "national_id", "id_number": "1075352"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
8e619e1d-89b1-406b-91bd-0b0b1e6191ed	2025-10-13 09:59:11.249083+03	2025-10-13 09:59:15.041031+03	t	MOTOR_PRIVATE	QUO930797	DRAFT	{"source": "docs_upload", "docType": "kra_pin", "autoCreated": true}	\N	\N	\N	\N	\N	{"kra_pin": {"fields": {",": "", "-": "", "I": "", "mm": "", "- -": "", "that -": ""}, "diagnostics": {"clarity": "poor", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 28, "typeMatch": false, "wordCount": 42, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 69.89}, "canonicalFields": {}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
ba1d59dc-8f66-461c-b022-b4f9d88c6622	2025-10-13 09:59:10.587531+03	2025-10-13 09:59:17.813136+03	t	MOTOR_PRIVATE	QUO253727	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": true, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "identification", "id card"], "presentKeywords": ["republic of kenya"], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
5c31d08d-7aed-427c-bef7-438be96376a4	2025-10-13 09:59:30.343085+03	2025-10-13 09:59:37.085034+03	t	MOTOR_PRIVATE	QUO489148	DRAFT	{"source": "docs_upload", "docType": "kra_pin", "autoCreated": true}	\N	\N	\N	\N	\N	{"kra_pin": {"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": false, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
4f0d0aed-2ad7-478a-91e7-ba39d0d13673	2025-10-13 10:42:42.044051+03	2025-10-13 10:42:50.439453+03	t	MOTOR_PRIVATE	QUO367542	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	{"logbook": {"fields": {"K": "1075352 C", "Pin:": "", "Town": "NAIROBI", "Body:": "SALOON", "Code:": "", "Color": "SILVER", "Duty:": "Paid", "Fuel:": "Petrol", "Make:": "TOYOTA", "Name:": "-", "Type:": "Motor vehicle", "Axies:": "2", "Model:": "CBA-", "class:": "Private", "Box No.": "", "Rating:": "1290", "(Section": "6(5))", "12/10/16": "", "country,": "Capan", "Man.Year:": "2009", "Engine No:": "", "Reg. Date:": "06-OCT-16", "Important:-": "The person in whose name # vehicle is registered that unless the contrary be proved, be deemed to be the owner of the vehicle. Before you use any vehicle on the road, please ensure that your insurance against third party risk is in order it is # serious offence to drive without proper insurance", "Original No": "20000071409", "Passengers:": "5", "TRAFFIC ACT": "(CAP 403)", "Tare weight:": "1110", "Gross weight:": "", "Previous Reg.": "", "Registration:": "KUMMA", "USAN signature:": "", "Load capacity(ikg):": "", "Authorising Signature": "BEST", "Previous registration:": "5305A9271", "Chasis/Frame:NT00000000": "", "Number of previous owners:": "0"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": ["kw:pin"], "logbook": ["kw:registration"], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 59, "typeMatch": false, "wordCount": 145, "typeScores": {"kra_pin": 1, "logbook": 1, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "logbook", "missingKeywords": ["logbook", "chassis", "ntsa", "national transport", "chief registrar"], "presentKeywords": ["registration"], "avgWordConfidence": 87.18}, "canonicalFields": {"id_type": "national_id", "id_number": "1075352"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
dd530891-81c9-4a4f-8256-fd52fb3bd85c	2025-10-13 10:42:46.501518+03	2025-10-13 10:42:54.699538+03	t	MOTOR_PRIVATE	QUO354347	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {",": "", "-": "", "I": "", "mm": "", "- -": "", "that -": ""}, "diagnostics": {"clarity": "poor", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 28, "typeMatch": true, "wordCount": 42, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "republic of kenya", "identification", "id card"], "presentKeywords": [], "avgWordConfidence": 69.89}, "canonicalFields": {}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
d7e52f0e-c11b-4f03-9e91-87ef29c5cdc7	2025-10-13 10:42:58.048975+03	2025-10-13 10:43:02.02219+03	t	MOTOR_PRIVATE	QUO723970	DRAFT	{"source": "docs_upload", "docType": "kra_pin", "autoCreated": true}	\N	\N	\N	\N	\N	{"kra_pin": {"fields": {",": "", "-": "", "I": "", "mm": "", "- -": "", "that -": ""}, "diagnostics": {"clarity": "poor", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 28, "typeMatch": false, "wordCount": 42, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 69.89}, "canonicalFields": {}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
5e91730a-6d7c-406b-8222-cbd728f9033e	2025-10-13 12:20:58.291601+03	2025-10-13 12:21:06.422132+03	t	MOTOR_PRIVATE	QUO000015	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": true, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "identification", "id card"], "presentKeywords": ["republic of kenya"], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
364c85d1-73e3-45c3-90d7-e7691debad3a	2025-10-13 12:20:52.308961+03	2025-10-13 12:21:01.850309+03	t	MOTOR_PRIVATE	QUO581549	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	{"logbook": {"fields": {"K": "1075352 C", "Pin:": "", "Town": "NAIROBI", "Body:": "SALOON", "Code:": "", "Color": "SILVER", "Duty:": "Paid", "Fuel:": "Petrol", "Make:": "TOYOTA", "Name:": "-", "Type:": "Motor vehicle", "Axies:": "2", "Model:": "CBA-", "class:": "Private", "Box No.": "", "Rating:": "1290", "(Section": "6(5))", "12/10/16": "", "country,": "Capan", "Man.Year:": "2009", "Engine No:": "", "Reg. Date:": "06-OCT-16", "Important:-": "The person in whose name # vehicle is registered that unless the contrary be proved, be deemed to be the owner of the vehicle. Before you use any vehicle on the road, please ensure that your insurance against third party risk is in order it is # serious offence to drive without proper insurance", "Original No": "20000071409", "Passengers:": "5", "TRAFFIC ACT": "(CAP 403)", "Tare weight:": "1110", "Gross weight:": "", "Previous Reg.": "", "Registration:": "KUMMA", "USAN signature:": "", "Load capacity(ikg):": "", "Authorising Signature": "BEST", "Previous registration:": "5305A9271", "Chasis/Frame:NT00000000": "", "Number of previous owners:": "0"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": ["kw:pin"], "logbook": ["kw:registration"], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 59, "typeMatch": false, "wordCount": 145, "typeScores": {"kra_pin": 1, "logbook": 1, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "logbook", "missingKeywords": ["logbook", "chassis", "ntsa", "national transport", "chief registrar"], "presentKeywords": ["registration"], "avgWordConfidence": 87.18}, "canonicalFields": {"id_type": "national_id", "id_number": "1075352"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
02d68a2b-1a44-4f83-85cb-4303c0ea1458	2025-10-13 12:21:00.434048+03	2025-10-13 12:21:08.931858+03	t	MOTOR_PRIVATE	QUO353901	DRAFT	{"source": "docs_upload", "docType": "kra_pin", "autoCreated": true}	\N	\N	\N	\N	\N	{"kra_pin": {"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": false, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
e4c3e730-f146-40d9-9b1a-98b05e832fd8	2025-10-13 12:27:13.146388+03	2025-10-13 12:27:17.998521+03	t	MOTOR_PRIVATE	QUO472049	DRAFT	{"source": "docs_upload", "docType": "logbook", "autoCreated": true}	\N	\N	\N	\N	\N	{"logbook": {"fields": {"K": "1075352 C", "Pin:": "", "Town": "NAIROBI", "Body:": "SALOON", "Code:": "", "Color": "SILVER", "Duty:": "Paid", "Fuel:": "Petrol", "Make:": "TOYOTA", "Name:": "-", "Type:": "Motor vehicle", "Axies:": "2", "Model:": "CBA-", "class:": "Private", "Box No.": "", "Rating:": "1290", "(Section": "6(5))", "12/10/16": "", "country,": "Capan", "Man.Year:": "2009", "Engine No:": "", "Reg. Date:": "06-OCT-16", "Important:-": "The person in whose name # vehicle is registered that unless the contrary be proved, be deemed to be the owner of the vehicle. Before you use any vehicle on the road, please ensure that your insurance against third party risk is in order it is # serious offence to drive without proper insurance", "Original No": "20000071409", "Passengers:": "5", "TRAFFIC ACT": "(CAP 403)", "Tare weight:": "1110", "Gross weight:": "", "Previous Reg.": "", "Registration:": "KUMMA", "USAN signature:": "", "Load capacity(ikg):": "", "Authorising Signature": "BEST", "Previous registration:": "5305A9271", "Chasis/Frame:NT00000000": "", "Number of previous owners:": "0"}, "diagnostics": {"clarity": "fair", "signals": {"kra_pin": ["kw:pin"], "logbook": ["kw:registration"], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 59, "typeMatch": false, "wordCount": 145, "typeScores": {"kra_pin": 1, "logbook": 1, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "logbook", "missingKeywords": ["logbook", "chassis", "ntsa", "national transport", "chief registrar"], "presentKeywords": ["registration"], "avgWordConfidence": 87.18}, "canonicalFields": {"id_type": "national_id", "id_number": "1075352"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
515a4b19-a2a9-4a22-aa58-d8c2796246c2	2025-10-13 12:27:18.399336+03	2025-10-13 12:27:26.402501+03	t	MOTOR_PRIVATE	QUO856200	DRAFT	{"source": "docs_upload", "docType": "national_id", "autoCreated": true}	\N	\N	\N	\N	\N	{"national_id": {"fields": {"SEX": "", "FULL NAMES": "ZEDEKIAH MAINA ANDENGA", "ID NUMBER:": "24798402", "DATE OF BIRTH": "29. 12. 1985", "DATE OF ISSUE": "20.02.2013", "SERIAL NUMBER": "228788719", "HOLDER'S SIGN.": "Zes", "PLACE OF ISSUE": "KHWISERO", "DISTRICT OF BIRTH": "BUTERE/MUMIAS"}, "diagnostics": {"clarity": "good", "signals": {"kra_pin": [], "logbook": [], "national_id": ["kw:republic of kenya"], "business_permit": [], "valuation_report": []}, "lineCount": 18, "typeMatch": true, "wordCount": 40, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 1, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "national_id", "missingKeywords": ["national", "identity", "identification", "id card"], "presentKeywords": ["republic of kenya"], "avgWordConfidence": 98.08}, "canonicalFields": {"id_type": "national_id", "id_number": "24798402"}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
893fa392-2c22-458a-bb87-b0c70a07eaa9	2025-10-13 12:28:33.348714+03	2025-10-13 12:28:37.127886+03	t	MOTOR_PRIVATE	QUO142177	DRAFT	{"source": "docs_upload", "docType": "kra_pin", "autoCreated": true}	\N	\N	\N	\N	\N	{"kra_pin": {"fields": {",": "", "-": "", "I": "", "mm": "", "- -": "", "that -": ""}, "diagnostics": {"clarity": "poor", "signals": {"kra_pin": [], "logbook": [], "national_id": [], "business_permit": [], "valuation_report": []}, "lineCount": 28, "typeMatch": false, "wordCount": 42, "typeScores": {"kra_pin": 0, "logbook": 0, "national_id": 0, "business_permit": 0, "valuation_report": 0}, "guessedType": "national_id", "expectedType": "kra_pin", "missingKeywords": ["kra", "pin", "kenya revenue", "itax", "tax"], "presentKeywords": [], "avgWordConfidence": 69.89}, "canonicalFields": {}}}	\N	95069092-9673-4c6b-a137-19a3f6131272
\.


--
-- Data for Name: app_manualquote; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_manualquote (id, date_created, date_updated, is_active, reference, line_key, payload, preferred_underwriters, status, computed_premium, levies_breakdown, admin_notes, created_at, updated_at, agent_id) FROM stdin;
a8dadbbf-2679-42cb-a876-e435f37ce7b3	2025-10-10 10:27:12.728658+03	2025-10-10 10:38:59.735554+03	t	MNL-MEDICAL-AD8ED5AD	MEDICAL	{"age": 28, "client_name": "Jane Smith", "client_type": "INDIVIDUAL", "cover_limit": 750000, "contact_email": "jane.smith@email.com", "contact_phone": "0798765432", "medical_conditions": "Diabetes"}	["JUBILEE", "MADISON"]	COMPLETED	10000.00	{"ITL": 25.0, "PCF": 25.0, "StampDuty": 40}		2025-10-10 10:27:12.728709+03	2025-10-10 10:38:59.735564+03	2e85b1cf-3231-46a8-9678-4a103673e5da
cd3205bc-08b6-4a69-aef1-e3a17f1fc970	2025-10-10 11:45:37.889074+03	2025-10-10 13:23:59.956186+03	t	MNL-MEDICAL-7152250B	MEDICAL	{"age": "50", "fullName": "James Omosh", "idNumber": "231221212", "spouseAge": "20", "declaration": true, "phoneNumber": "079258441", "emailAddress": "james@gmail.com", "inpatientLimit": "500k", "maternityCover": false, "outpatientCover": true, "numberOfChildren": "5", "preferredUnderwriters": ["MADISON"]}	["MADISON"]	COMPLETED	\N	\N		2025-10-10 11:45:37.889159+03	2025-10-10 13:23:59.956206+03	95069092-9673-4c6b-a137-19a3f6131272
b85039fa-9866-427f-bc65-837353b3eedb	2025-10-10 10:13:00.82516+03	2025-10-10 10:13:00.825181+03	t	MNL-MEDICAL-81C39C3C	MEDICAL	{"age": 35, "client_name": "John Doe", "client_type": "INDIVIDUAL", "cover_limit": 500000, "contact_email": "john.doe@email.com", "contact_phone": "0712345678", "medical_conditions": "None"}	["MADISON", "BRITAM"]	COMPLETED	\N	\N		2025-10-10 10:13:00.825226+03	2025-10-10 10:13:00.82523+03	2e85b1cf-3231-46a8-9678-4a103673e5da
5a045511-9a86-4771-b74a-d6a1d8c60d29	2025-10-10 10:21:30.633508+03	2025-10-10 10:21:30.633527+03	t	MNL-MEDICAL-268E081B	MEDICAL	{"age": 35, "client_name": "John Doe", "client_type": "INDIVIDUAL", "cover_limit": 500000, "contact_email": "john.doe@email.com", "contact_phone": "0712345678", "medical_conditions": "None"}	["MADISON", "BRITAM"]	COMPLETED	\N	\N		2025-10-10 10:21:30.633569+03	2025-10-10 10:21:30.633573+03	2e85b1cf-3231-46a8-9678-4a103673e5da
05966bdf-b372-4545-82df-04d435e4088d	2025-10-10 10:23:13.960129+03	2025-10-10 10:23:13.960141+03	t	MNL-MEDICAL-A07D63E4	MEDICAL	{"age": 35, "client_name": "John Doe", "client_type": "INDIVIDUAL", "cover_limit": 500000, "contact_email": "john.doe@email.com", "contact_phone": "0712345678", "medical_conditions": "None"}	["MADISON", "BRITAM"]	COMPLETED	\N	\N		2025-10-10 10:23:13.960181+03	2025-10-10 10:23:13.960185+03	2e85b1cf-3231-46a8-9678-4a103673e5da
49333d21-b3b5-4114-aad5-094ad431ec2d	2025-10-10 10:23:21.024415+03	2025-10-10 10:23:21.024426+03	t	MNL-MEDICAL-CD036AEF	MEDICAL	{"age": 28, "client_name": "Jane Smith", "client_type": "INDIVIDUAL", "cover_limit": 750000, "contact_email": "jane.smith@email.com", "contact_phone": "0798765432", "medical_conditions": "Diabetes"}	["JUBILEE", "MADISON"]	COMPLETED	\N	\N		2025-10-10 10:23:21.024497+03	2025-10-10 10:23:21.024502+03	2e85b1cf-3231-46a8-9678-4a103673e5da
9ce6166d-4cdc-478f-8e07-805e8cc38c0c	2025-10-10 10:27:05.664345+03	2025-10-10 10:27:05.664359+03	t	MNL-MEDICAL-9785F647	MEDICAL	{"age": 35, "client_name": "John Doe", "client_type": "INDIVIDUAL", "cover_limit": 500000, "contact_email": "john.doe@email.com", "contact_phone": "0712345678", "medical_conditions": "None"}	["MADISON", "BRITAM"]	COMPLETED	\N	\N		2025-10-10 10:27:05.664404+03	2025-10-10 10:27:05.664408+03	2e85b1cf-3231-46a8-9678-4a103673e5da
06ee922b-7e51-46cd-b5dd-f747125bdfe1	2025-10-10 10:52:29.682852+03	2025-10-10 10:52:29.682863+03	t	MNL-MEDICAL-C7E53630	MEDICAL	{"age": "34", "fullName": "John Cena", "idNumber": "3242422", "spouseAge": "20", "declaration": true, "phoneNumber": "079258866", "emailAddress": "john@gmail.com", "inpatientLimit": "500k", "maternityCover": false, "outpatientCover": true, "numberOfChildren": "3", "preferredUnderwriters": ["MADISON"]}	["MADISON"]	COMPLETED	\N	\N		2025-10-10 10:52:29.682908+03	2025-10-10 10:52:29.682912+03	95069092-9673-4c6b-a137-19a3f6131272
a5443fcd-2b46-4346-9c8e-cb0dab3c1e34	2025-10-10 11:05:12.479755+03	2025-10-10 11:05:12.479768+03	t	MNL-MEDICAL-EFAAC589	MEDICAL	{"age": "34", "fullName": "John Cena", "idNumber": "3242422", "spouseAge": "20", "declaration": true, "phoneNumber": "079258866", "emailAddress": "john@gmail.com", "inpatientLimit": "500k", "maternityCover": false, "outpatientCover": true, "numberOfChildren": "3", "preferredUnderwriters": ["MADISON"]}	["MADISON"]	COMPLETED	\N	\N		2025-10-10 11:05:12.479799+03	2025-10-10 11:05:12.479803+03	95069092-9673-4c6b-a137-19a3f6131272
ee91c8f4-1bad-48ab-9c03-59f0ce61887f	2025-10-10 11:24:35.775545+03	2025-10-10 11:24:35.775556+03	t	MNL-MEDICAL-74D64C14	MEDICAL	{"age": "30", "fullName": "Anold Best", "idNumber": "242422121", "spouseAge": "25", "declaration": true, "phoneNumber": "096543322", "emailAddress": "anold@gmail.com", "inpatientLimit": "500k", "maternityCover": true, "outpatientCover": false, "numberOfChildren": "3", "preferredUnderwriters": ["CIC"]}	["CIC"]	COMPLETED	\N	\N		2025-10-10 11:24:35.775647+03	2025-10-10 11:24:35.775652+03	95069092-9673-4c6b-a137-19a3f6131272
ebf438b0-7abe-467c-913f-0fefc9e079a5	2025-10-10 22:42:59.499132+03	2025-10-10 22:42:59.499144+03	t	MNL-MEDICAL-00383AF4	MEDICAL	{"age": 35, "client_name": "John Doe", "client_type": "INDIVIDUAL", "cover_limit": 500000, "contact_email": "john.doe@email.com", "contact_phone": "0712345678", "medical_conditions": "None"}	["MADISON", "BRITAM"]	PENDING_ADMIN_REVIEW	\N	\N		2025-10-10 22:42:59.499183+03	2025-10-10 22:42:59.499187+03	2e85b1cf-3231-46a8-9678-4a103673e5da
c006992e-224b-4bfc-a79e-048187a6ed27	2025-10-10 22:46:14.191429+03	2025-10-10 22:46:14.191441+03	t	MNL-MEDICAL-D930F99F	MEDICAL	{"age": 35, "client_name": "John Doe", "client_type": "INDIVIDUAL", "cover_limit": 500000, "contact_email": "john.doe@email.com", "contact_phone": "0712345678", "medical_conditions": "None"}	["MADISON", "BRITAM"]	PENDING_ADMIN_REVIEW	\N	\N		2025-10-10 22:46:14.191479+03	2025-10-10 22:46:14.191483+03	2e85b1cf-3231-46a8-9678-4a103673e5da
eea6a437-d271-4220-a4fb-25d948e94e38	2025-10-10 22:48:34.914286+03	2025-10-10 22:48:34.914299+03	t	MNL-MEDICAL-F96A29C3	MEDICAL	{"age": 35, "client_name": "John Doe", "client_type": "INDIVIDUAL", "cover_limit": 500000, "contact_email": "john.doe@email.com", "contact_phone": "0712345678", "medical_conditions": "None"}	["MADISON", "BRITAM"]	PENDING_ADMIN_REVIEW	\N	\N		2025-10-10 22:48:34.914341+03	2025-10-10 22:48:34.914345+03	2e85b1cf-3231-46a8-9678-4a103673e5da
dbe84ab1-7f34-49f5-874d-e226149ac1cd	2025-10-10 22:48:35.969028+03	2025-10-10 22:48:35.969039+03	t	MNL-MEDICAL-653CF761	MEDICAL	{"age": 28, "client_name": "Jane Smith", "client_type": "INDIVIDUAL", "cover_limit": 750000, "contact_email": "jane.smith@email.com", "contact_phone": "0798765432", "medical_conditions": "Diabetes"}	["JUBILEE", "MADISON"]	PENDING_ADMIN_REVIEW	\N	\N		2025-10-10 22:48:35.969079+03	2025-10-10 22:48:35.969083+03	2e85b1cf-3231-46a8-9678-4a103673e5da
80424675-bd4f-4741-862c-fbffd11dd7bf	2025-10-11 02:08:20.399533+03	2025-10-11 02:08:20.39955+03	t	MNL-MEDICAL-77A109E2	MEDICAL	{"age": "56", "fullName": "kk kk ", "idNumber": "321242", "spouseAge": "33", "declaration": true, "phoneNumber": "0884444", "emailAddress": "kevin@gmail.com", "inpatientLimit": "500k", "maternityCover": false, "outpatientCover": true, "numberOfChildren": "3", "preferredUnderwriters": ["MNK"]}	["MNK"]	PENDING_ADMIN_REVIEW	\N	\N		2025-10-11 02:08:20.399603+03	2025-10-11 02:08:20.39961+03	3dc28354-5326-4acb-b194-d2da11fd51c0
4f719b11-8aea-4891-a257-14f5a89ae6ec	2025-10-11 09:35:42.073074+03	2025-10-11 09:35:42.073087+03	t	MNL-MEDICAL-8AFB2706	MEDICAL	{"age": 35, "client_name": "John Doe", "client_type": "INDIVIDUAL", "cover_limit": 500000, "contact_email": "john.doe@email.com", "contact_phone": "0712345678", "medical_conditions": "None"}	["MADISON", "BRITAM"]	PENDING_ADMIN_REVIEW	\N	\N		2025-10-11 09:35:42.073129+03	2025-10-11 09:35:42.073133+03	2e85b1cf-3231-46a8-9678-4a103673e5da
29ecad95-4984-43f2-9655-330191eee12a	2025-10-11 09:35:43.259786+03	2025-10-11 09:35:43.259797+03	t	MNL-MEDICAL-B5821D41	MEDICAL	{"age": 28, "client_name": "Jane Smith", "client_type": "INDIVIDUAL", "cover_limit": 750000, "contact_email": "jane.smith@email.com", "contact_phone": "0798765432", "medical_conditions": "Diabetes"}	["JUBILEE", "MADISON"]	PENDING_ADMIN_REVIEW	\N	\N		2025-10-11 09:35:43.259836+03	2025-10-11 09:35:43.259841+03	2e85b1cf-3231-46a8-9678-4a103673e5da
9f3a5a1b-c2e3-44d9-b5ed-93e2ce178457	2025-10-14 23:25:31.239648+03	2025-10-14 23:25:31.23966+03	t	MNL-MEDICAL-5C8B6EC4	MEDICAL	{"age": "56", "fullName": "kelvin dd", "idNumber": "324232312", "spouseAge": "30", "declaration": true, "phoneNumber": "0756348", "emailAddress": "kevin@gmail.com", "inpatientLimit": "500k", "maternityCover": false, "outpatientCover": true, "numberOfChildren": "3", "preferredUnderwriters": ["BRITAM"]}	["BRITAM"]	PENDING_ADMIN_REVIEW	\N	\N		2025-10-14 23:25:31.239694+03	2025-10-14 23:25:31.239698+03	95069092-9673-4c6b-a137-19a3f6131272
35bfa15f-bfca-45e2-baf2-efa467947188	2025-10-14 23:27:38.555014+03	2025-10-15 00:55:32.502428+03	t	MNL-MEDICAL-CFF6C0C5	MEDICAL	{"age": "45", "fullName": "James Doe", "idNumber": "23232", "spouseAge": "34", "declaration": true, "phoneNumber": "088155588", "emailAddress": "james @gmail.com", "inpatientLimit": "1m", "maternityCover": false, "outpatientCover": true, "numberOfChildren": "3", "preferredUnderwriters": ["MNK"]}	["MNK"]	COMPLETED	8000.00	\N		2025-10-14 23:27:38.555059+03	2025-10-15 00:55:32.502445+03	95069092-9673-4c6b-a137-19a3f6131272
\.


--
-- Data for Name: app_messagesmodels; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_messagesmodels (id, message_for, message, variables, is_active) FROM stdin;
\.


--
-- Data for Name: app_monthlyagentbonus; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_monthlyagentbonus (id, date_created, date_updated, is_active, month, year, period, total_policies, total_premium, bonus_rate, bonus_amount, payment_status, payment_date, payment_reference, notes, agent_id) FROM stdin;
\.


--
-- Data for Name: app_motorcategory; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_motorcategory (id, date_created, date_updated, is_active, code, name, description, icon, pricing_type, sort_order, requires_tonnage, requires_engine_capacity, requires_passenger_count, requires_passenger_type, requires_carrying_capacity, supports_time_period_variants, min_vehicle_age, max_vehicle_age) FROM stdin;
fe27c128-972d-4a08-8893-1ad922d882bd	2025-09-23 17:54:13.074954+03	2025-09-26 17:11:43.861442+03	t	COMMERCIAL	Commercial	Goods carriers and commercial vehicles	🚚	dynamic	2	t	f	f	f	f	f	0	20
d4ee8d63-363f-40e1-a5fc-41748a26ef42	2025-09-23 17:54:13.076468+03	2025-09-26 17:11:43.863147+03	t	PSV	PSV	Public service vehicles (matatu, buses)	🚌	dynamic	3	f	f	t	f	f	t	0	20
83a003d5-9c80-422b-9350-583f92bb9d55	2025-09-23 17:54:13.07824+03	2025-09-26 17:11:43.864578+03	t	MOTORCYCLE	Motorcycle	Motorcycles including boda boda	🏍️	dynamic	4	f	t	f	f	f	t	0	15
4f87a0cc-d791-4e20-9b96-39855211270e	2025-09-23 17:54:13.079616+03	2025-09-26 17:11:43.865855+03	t	TUKTUK	TukTuk	Three-wheeler vehicles	🛺	dynamic	5	f	f	t	f	f	f	0	15
63206394-bcc9-4ca4-9a2f-faf4cbadddb0	2025-09-23 17:54:13.080944+03	2025-09-26 17:11:43.867179+03	t	SPECIAL	Special Classes	Agricultural, institutional, and special vehicles	🚜	dynamic	6	t	f	t	t	f	f	0	25
02a099fd-e88b-4b61-8f64-0e3eb7ee173f	2025-09-23 17:54:13.068431+03	2025-09-28 14:00:27.282338+03	t	PRIVATE	Private	Personal vehicles for private use	🚗	dynamic	1	f	f	f	f	f	f	0	25
\.


--
-- Data for Name: app_motorinsurancedetails; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_motorinsurancedetails (id, date_created, date_updated, is_active, vehicle_make, vehicle_model, vehicle_year, vehicle_registration, chassis_number, engine_number, owner_name, owner_id_number, owner_kra_pin, owner_phone, owner_email, cover_start_date, cover_end_date, vehicle_usage, vehicle_color, seating_capacity, quotation_id) FROM stdin;
\.


--
-- Data for Name: app_motorpolicy; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_motorpolicy (id, date_created, date_updated, is_active, policy_number, quote_id, client_details, vehicle_details, product_details, underwriter_details, premium_breakdown, payment_details, addons, documents, status, cover_start_date, cover_end_date, policy_document_url, receipt_url, certificate_url, submitted_at, approved_at, notes, agent_code, approved_by_id, user_id, extension_count, is_renewal, last_extension_date, original_policy_id, renewal_count, renewed_at, total_extensions_amount) FROM stdin;
d79a4e96-5c2d-4411-a21e-3398cf77d7f7	2025-10-02 11:32:28.948691+03	2025-10-02 11:32:28.948709+03	t	POL-2025-712484	QUOTE-1759393947528	{"email": "kevi@gmail.com", "phone": "0792876663", "kraPin": "A45GDKALD", "fullName": "Angela Greene", "lastName": "Greene", "firstName": "Angela"}	{"make": "Toyota", "year": 2025, "model": "Premio", "registration": "KCA 234H"}	{"name": "Private Third-Party", "category": "PRIVATE", "subcategory": "PRIVATE_THIRD_PARTY", "coverageType": "THIRD_PARTY"}	{"id": "aa85d49e-06a2-40ec-9a22-e09b453f8066", "name": "Madison Insurance", "company": "Madison Insurance", "company_name": "Madison Insurance", "underwriter_name": "Madison Insurance"}	{"pcfLevy": 0, "stampDuty": 40, "basePremium": 0, "totalAmount": 0, "trainingLevy": 0}	{"amount": 3029.88, "method": "MPESA", "status": "CONFIRMED"}	[]	[]	PENDING_PAYMENT	\N	\N	\N	\N	\N	2025-10-02 11:32:28.948758+03	\N		\N	\N	95069092-9673-4c6b-a137-19a3f6131272	0	f	\N	\N	0	\N	0.00
4b6c0dfd-0f62-4aba-b7c7-a4bd931028c2	2025-10-02 11:42:12.999632+03	2025-10-02 11:42:12.999642+03	t	POL-2025-835592	QUOTE-1759394531659	{"email": "kevin@gmail.com", "phone": "079384894", "kraPin": "A4DGFIKJFS", "fullName": "Angela Greene", "lastName": "Greene", "firstName": "Angela"}	{"make": "Toyota", "year": 2025, "model": "V8", "registration": "KBC 345H"}	{"name": "Private Third-Party", "category": "PRIVATE", "subcategory": "PRIVATE_THIRD_PARTY", "coverageType": "THIRD_PARTY"}	{"id": "771c566f-292a-49f1-97a9-19c2b967335e", "name": "PATABIMA INC", "company": "PATABIMA INC", "company_name": "PATABIMA INC", "underwriter_name": "PATABIMA INC"}	{"pcfLevy": 0, "stampDuty": 40, "basePremium": 0, "totalAmount": 3029.88, "trainingLevy": 0}	{"amount": 3029.88, "method": "MPESA", "status": "CONFIRMED"}	[]	[]	PENDING_PAYMENT	\N	\N	\N	\N	\N	2025-10-02 11:42:12.999692+03	\N		\N	\N	95069092-9673-4c6b-a137-19a3f6131272	0	f	\N	\N	0	\N	0.00
8205135e-ad9b-4cd4-86ec-388a13f468fc	2025-10-02 14:41:58.637099+03	2025-10-02 14:41:58.637111+03	t	POL-2025-328700	QUOTE-1759405314630	{"email": "mathwew@gmail.com", "phone": "0838490303", "kraPin": "HDJKDKLLD", "fullName": "Mathwew  Ndari", "idNumber": "1075352", "lastName": "Ndari", "firstName": "Mathwew "}	{"make": "Toyota ", "year": 2025, "model": "Vitz", "registration": "KCA 234H"}	{"name": "Private Third-Party", "category": "PRIVATE", "subcategory": "PRIVATE_THIRD_PARTY", "coverageType": "THIRD_PARTY"}	{"id": "14900c1c-4327-4366-a1e9-585699b1a495", "name": "Jubilee Insurance", "company": "Jubilee Insurance", "company_name": "Jubilee Insurance", "underwriter_name": "Jubilee Insurance"}	{"pcfLevy": 0, "stampDuty": 40, "basePremium": 0, "totalAmount": 3029.88, "trainingLevy": 0}	{"amount": 3029.88, "method": "MPESA", "status": "CONFIRMED"}	[]	[]	PENDING_PAYMENT	\N	\N	\N	\N	\N	2025-10-02 14:41:58.637234+03	\N		\N	\N	f358d3bc-ba14-439b-ac4d-eb402ddb9ae7	0	f	\N	\N	0	\N	0.00
89cc0106-7b71-4972-8e23-59e5cdde834b	2025-10-08 09:47:31.379978+03	2025-10-10 23:07:58.208462+03	t	POL-2025-433825	QUOTE-1759906049439	{"email": "steven@gmail.com", "phone": "072985441", "kraPin": "345232", "fullName": "steven  moss", "idNumber": "1075352", "lastName": "moss", "firstName": "steven "}	{"make": "toyota", "year": "2016", "model": "axio", "registration": "KKK "}	{"name": "TOR For Private", "category": "PRIVATE", "subcategory": "PRIVATE_TOR", "coverageType": "FIXED"}	{"id": "aa85d49e-06a2-40ec-9a22-e09b453f8066", "name": "Madison Insurance", "company": "Madison Insurance", "company_name": "Madison Insurance", "underwriter_name": "Madison Insurance"}	{"pcfLevy": 1.5, "stampDuty": 40, "basePremium": 600, "totalAmount": 643, "trainingLevy": 1.5}	{"amount": 643, "method": "MPESA", "status": "CONFIRMED"}	[]	[]	ACTIVE	\N	\N	\N	\N	\N	2025-10-08 09:47:31.380062+03	\N		\N	\N	95069092-9673-4c6b-a137-19a3f6131272	0	f	\N	\N	0	\N	0.00
4c9f1e6f-4150-414d-9050-c641a4cd5769	2025-10-08 14:53:00.588638+03	2025-10-10 23:07:44.960849+03	t	POL-2025-208149	QUOTE-1759924378599	{"email": "john.doe@patabima.com", "phone": "072555558", "kraPin": "5643", "fullName": "JOHN  DOE", "idNumber": "1075352", "lastName": "DOE", "firstName": "JOHN "}	{"make": "TOYOTA ", "year": 2025, "model": "AXIO", "registration": "KDR 234T"}	{"name": "Private Third-Party", "category": "PRIVATE", "subcategory": "PRIVATE_THIRD_PARTY", "coverageType": "THIRD_PARTY"}	{"id": "14900c1c-4327-4366-a1e9-585699b1a495", "name": "Jubilee Insurance", "company": "Jubilee Insurance", "company_name": "Jubilee Insurance", "underwriter_name": "Jubilee Insurance"}	{"pcfLevy": 7.44, "stampDuty": 40, "basePremium": 2975, "totalAmount": 3029.88, "trainingLevy": 7.44}	{"amount": 3029.88, "method": "MPESA", "status": "CONFIRMED"}	[]	[]	ACTIVE	\N	\N	\N	\N	\N	2025-10-08 14:53:00.588694+03	\N		\N	\N	95069092-9673-4c6b-a137-19a3f6131272	0	f	\N	\N	0	\N	0.00
a38ff0bd-fd6a-48ad-b735-db6f133662e1	2025-10-02 19:05:58.446446+03	2025-10-10 23:08:31.071856+03	t	POL-2025-146066	QUOTE-1759421155925	{"email": "k@gmail.com", "phone": "078484994", "kraPin": "DSGSDGSDG", "fullName": "kelvin kk kk", "lastName": "kk", "firstName": "kelvin kk"}	{"make": "kev", "year": 2025, "model": "motor", "registration": "KBC 234H"}	{"name": "Private Third-Party Extendible", "category": "PRIVATE", "subcategory": "PRIVATE_THIRD_PARTY_EXT", "coverageType": "THIRD_PARTY"}	{"id": "aa85d49e-06a2-40ec-9a22-e09b453f8066", "name": "Madison Insurance", "company": "Madison Insurance", "company_name": "Madison Insurance", "underwriter_name": "Madison Insurance"}	{"pcfLevy": 11.25, "stampDuty": 40, "basePremium": 4500, "totalAmount": 4562.5, "trainingLevy": 11.25}	{"amount": 4562.5, "method": "MPESA", "status": "CONFIRMED"}	[]	[]	ACTIVE	\N	\N	\N	\N	\N	2025-10-02 19:05:58.44666+03	\N		\N	\N	95069092-9673-4c6b-a137-19a3f6131272	0	f	\N	\N	0	\N	0.00
89c8d92c-4958-40d7-b3ca-841ac64dbcc0	2025-10-11 02:00:45.028751+03	2025-10-11 02:01:54.232417+03	t	POL-2025-294874	QUOTE-1760137243639	{"email": "jones@gmail.com", "phone": "072883930", "kraPin": "56263782", "fullName": "kevlar  Jones", "idNumber": "1075352", "lastName": "Jones", "firstName": "kevlar "}	{"make": "Toyota ", "year": 2025, "model": "Axio", "registration": "KCG 234H"}	{"name": "Private Third-Party", "category": "PRIVATE", "subcategory": "PRIVATE_THIRD_PARTY", "coverageType": "THIRD_PARTY"}	{"id": "aa85d49e-06a2-40ec-9a22-e09b453f8066", "name": "Madison Insurance", "company": "Madison Insurance", "company_name": "Madison Insurance", "underwriter_name": "Madison Insurance"}	{"pcfLevy": 7.44, "stampDuty": 40, "basePremium": 2975, "totalAmount": 3029.88, "trainingLevy": 7.44}	{"amount": 3029.88, "method": "MPESA", "status": "CONFIRMED"}	[]	[]	ACTIVE	\N	\N	\N	\N	\N	2025-10-11 02:00:45.028808+03	\N		\N	\N	3dc28354-5326-4acb-b194-d2da11fd51c0	0	f	\N	\N	0	\N	0.00
fa41c3cc-ea10-45c0-b2ca-991f4d0b8a7a	2025-10-13 10:01:13.513104+03	2025-10-13 10:01:13.513119+03	t	POL-2025-402657	QUOTE-1760338871481	{"email": "G@gmail.com", "phone": "0203930", "kraPin": "0877389", "fullName": "kevlin  dsasa", "idNumber": "1075352", "lastName": "dsasa", "firstName": "kevlin "}	{"make": "Toyota ", "year": 2025, "model": "axio", "registration": "GEEE"}	{"name": "Private Third-Party", "category": "PRIVATE", "subcategory": "PRIVATE_THIRD_PARTY", "coverageType": "THIRD_PARTY"}	{"id": "2ccc38e1-d8c1-42e1-acca-19bbc0dd3c28", "name": "Britam Insurance", "company": "Britam Insurance", "company_name": "Britam Insurance", "underwriter_name": "Britam Insurance"}	{"pcfLevy": 9.8, "stampDuty": 40, "basePremium": 3920, "totalAmount": 3979.6, "trainingLevy": 9.8}	{"amount": 3979.6, "method": "MPESA", "status": "CONFIRMED"}	[]	[]	PENDING_PAYMENT	\N	\N	\N	\N	\N	2025-10-13 10:01:13.513174+03	\N		\N	\N	95069092-9673-4c6b-a137-19a3f6131272	0	f	\N	\N	0	\N	0.00
52f24471-df29-4fa5-9ae2-a156142eb891	2025-10-13 10:44:01.079248+03	2025-10-13 10:44:01.079261+03	t	POL-2025-286036	QUOTE-1760341439063	{"email": "john@gmail.com", "phone": "079292992", "kraPin": "A5364DHD", "fullName": "john  kkk", "idNumber": "1075352", "lastName": "kkk", "firstName": "john "}	{"make": "Toyota ", "year": 2025, "model": "Axio", "registration": "KCA 234H"}	{"name": "Private Third-Party", "category": "PRIVATE", "subcategory": "PRIVATE_THIRD_PARTY", "coverageType": "THIRD_PARTY"}	{"id": "771c566f-292a-49f1-97a9-19c2b967335e", "name": "PATABIMA INC", "company": "PATABIMA INC", "company_name": "PATABIMA INC", "underwriter_name": "PATABIMA INC"}	{"pcfLevy": 7.44, "stampDuty": 40, "basePremium": 2975, "totalAmount": 3029.88, "trainingLevy": 7.44}	{"amount": 3029.88, "method": "MPESA", "status": "CONFIRMED"}	[]	[]	PENDING_PAYMENT	\N	\N	\N	\N	\N	2025-10-13 10:44:01.07932+03	\N		\N	\N	95069092-9673-4c6b-a137-19a3f6131272	0	f	\N	\N	0	\N	0.00
\.


--
-- Data for Name: app_motorpricing; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_motorpricing (id, date_created, date_updated, is_active, base_premium, minimum_premium, pricing_factors, effective_from, effective_to, subcategory_id, underwriter_id, maximum_premium, bracket_pricing) FROM stdin;
2b7583f3-fb13-4128-82ed-72ae0e99b40f	2025-09-23 18:22:44.950826+03	2025-09-23 18:22:44.950837+03	t	5500.00	\N	{}	2025-09-23	\N	d85a3baa-dc18-4773-9dd4-d5556c66f24c	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
8c2e6b9c-7af6-44dd-a6b0-76562dedff72	2025-09-23 18:22:44.959844+03	2025-09-23 18:22:44.959854+03	t	5500.00	\N	{}	2025-09-23	\N	8a6b2335-aa56-4658-a15d-9c0db0062b2c	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
bd9f4698-ca3d-437a-9552-5477a497e4af	2025-09-23 18:22:44.962794+03	2025-09-23 18:22:44.962804+03	t	5500.00	\N	{}	2025-09-23	\N	accb806c-d4ba-4aa0-9ff0-bb7505fd78d2	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
23e10604-2f37-4b1a-89e7-3adf0a406565	2025-09-23 18:22:44.973293+03	2025-09-23 18:22:44.973303+03	t	5500.00	\N	{}	2025-09-23	\N	ce88273c-85b0-4d72-a815-d9e9fef0b66a	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
840bd48a-ebf2-431b-a2cf-29bd0ff62475	2025-09-23 18:22:45.038068+03	2025-09-23 18:22:45.03808+03	t	5500.00	\N	{}	2025-09-23	\N	d85a3baa-dc18-4773-9dd4-d5556c66f24c	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
c3593c84-3b98-4183-89ab-b74ac19c3e96	2025-09-23 18:22:45.049435+03	2025-09-23 18:22:45.049442+03	t	5500.00	\N	{}	2025-09-23	\N	8a6b2335-aa56-4658-a15d-9c0db0062b2c	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
50829cff-bb3b-4307-9de4-16e182e2bbe9	2025-09-23 18:22:44.981395+03	2025-09-23 18:22:44.981405+03	t	5500.00	\N	{}	2025-09-23	\N	9dbc9eb0-8694-41a5-adb2-f7ecdfa00530	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
74e3cb5e-e3c1-4d4c-a37c-9ff380883ed0	2025-09-23 18:22:44.999883+03	2025-09-23 18:22:44.999894+03	t	800.00	\N	{}	2025-09-23	\N	d83ac6d4-9151-417f-b11e-4f2a3277ac82	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
d17f802a-9743-4809-a860-d57f10e03039	2025-09-23 18:22:45.035543+03	2025-09-23 18:22:45.035552+03	t	5500.00	\N	{}	2025-09-23	\N	f74414bf-1e4f-4965-a953-dc4f46c3e265	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
540996d5-5cf3-4237-9446-0136df80c382	2025-09-23 18:22:45.052135+03	2025-09-23 18:22:45.052143+03	t	5500.00	\N	{}	2025-09-23	\N	accb806c-d4ba-4aa0-9ff0-bb7505fd78d2	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
f3b61a3c-fd58-4f63-a60e-d9ddf6fc6637	2025-09-23 18:22:45.066282+03	2025-09-23 18:22:45.066289+03	t	5500.00	\N	{}	2025-09-23	\N	ce88273c-85b0-4d72-a815-d9e9fef0b66a	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
3054cc79-b56c-49e6-8961-80eb55b035d6	2025-09-23 18:22:45.075353+03	2025-09-23 18:22:45.075367+03	t	5500.00	\N	{}	2025-09-23	\N	9dbc9eb0-8694-41a5-adb2-f7ecdfa00530	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
80f07e91-400e-4e51-a453-1d0d47d96049	2025-09-23 18:22:45.107031+03	2025-09-23 18:22:45.107045+03	t	0.00	20000.00	{}	2025-09-23	\N	562464a1-ba36-4db8-95f2-d2c6d7792781	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
07ba83b8-32cf-4e68-87cd-f2a92fba8e1d	2025-09-23 18:22:45.217374+03	2025-09-23 18:22:45.217382+03	t	0.00	20000.00	{}	2025-09-23	\N	562464a1-ba36-4db8-95f2-d2c6d7792781	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
7974deb2-1a0f-4340-81d6-449f58a0de6e	2025-09-23 18:24:25.981232+03	2025-09-23 18:24:25.981242+03	t	5500.00	\N	{}	2025-09-23	\N	e5fda96b-fdda-4fe9-a53c-3cd8d5500ada	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
b885ee7b-ebbe-42c2-a7e4-b189913e0c2e	2025-09-23 18:24:26.000672+03	2025-09-23 18:24:26.000679+03	t	5500.00	\N	{}	2025-09-23	\N	f1b4d2b9-5654-4146-a799-5a66e44fd01e	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
b6a79310-6f6e-4ad2-8c21-af5d19d60837	2025-09-23 18:24:26.002886+03	2025-09-23 18:24:26.002892+03	t	5500.00	\N	{}	2025-09-23	\N	47363ab5-bb14-4a5d-bec4-37f5cd8159b3	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
c52300a0-592b-4c10-b7af-bfeefd1acb6c	2025-09-23 18:24:26.010836+03	2025-09-23 18:24:26.010847+03	t	5500.00	\N	{}	2025-09-23	\N	55ec10f8-901f-4684-9601-d01944a85987	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
b4e926b8-4bbf-4243-8537-24cdd3c3a5fc	2025-09-23 18:24:26.017095+03	2025-09-23 18:24:26.017106+03	t	5500.00	\N	{}	2025-09-23	\N	87862519-800b-4655-b480-790228534766	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
8bf014db-66b8-480f-8e40-9e414a29b0d6	2025-09-23 18:24:26.021688+03	2025-09-23 18:24:26.021694+03	t	5500.00	\N	{}	2025-09-23	\N	8da7297d-5b17-4969-9b1b-e78bb6d5d40f	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
673b4939-34c4-4a29-add9-c9cf397ae7df	2025-09-23 18:24:26.032316+03	2025-09-23 18:24:26.032325+03	t	5500.00	\N	{}	2025-09-23	\N	0e9334f1-a127-48e0-8a41-623fc00825e3	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
bd088bc3-30d3-41c5-8291-d12332db3119	2025-09-23 18:24:26.068556+03	2025-09-23 18:24:26.068563+03	t	5500.00	\N	{}	2025-09-23	\N	e5fda96b-fdda-4fe9-a53c-3cd8d5500ada	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
a162cd6f-e3df-426d-b318-02ad5210ecc8	2025-09-23 18:24:26.085581+03	2025-09-23 18:24:26.085587+03	t	5500.00	\N	{}	2025-09-23	\N	f1b4d2b9-5654-4146-a799-5a66e44fd01e	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
4943cce5-2d1b-4aa6-857f-9a3843af464e	2025-09-23 18:24:26.087817+03	2025-09-23 18:24:26.087824+03	t	5500.00	\N	{}	2025-09-23	\N	47363ab5-bb14-4a5d-bec4-37f5cd8159b3	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
166bc61f-8a28-486e-98ba-2b999bd146aa	2025-09-23 18:24:26.09524+03	2025-09-23 18:24:26.095249+03	t	5500.00	\N	{}	2025-09-23	\N	55ec10f8-901f-4684-9601-d01944a85987	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
af11e3e7-414f-45ee-af9f-edc6ae6c4426	2025-09-23 18:24:26.099734+03	2025-09-23 18:24:26.099742+03	t	5500.00	\N	{}	2025-09-23	\N	87862519-800b-4655-b480-790228534766	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
f7bc9c08-45eb-4a91-ae33-5c5bd90e0ff3	2025-09-23 18:24:26.104394+03	2025-09-23 18:24:26.1044+03	t	5500.00	\N	{}	2025-09-23	\N	8da7297d-5b17-4969-9b1b-e78bb6d5d40f	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
dc0bb539-e0b0-42de-8889-8948f0b2fc8d	2025-09-23 18:24:26.165235+03	2025-09-23 18:24:26.165241+03	t	0.00	20000.00	{}	2025-09-23	\N	0b13511b-8e76-4616-934b-a847650f43fa	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
0f0e2b50-caba-4428-9e94-767267cdfa2a	2025-09-23 18:24:26.171055+03	2025-09-23 18:24:26.171061+03	t	0.00	20000.00	{}	2025-09-23	\N	c3d87a28-c87a-4b21-951f-1b0586a9d908	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
5f72b6e1-3f7e-403b-afdf-3e9f9e7844e4	2025-09-23 18:24:26.17718+03	2025-09-23 18:24:26.177189+03	t	0.00	20000.00	{}	2025-09-23	\N	d850b486-5ea8-40b1-940d-5c29927fb6c6	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
56b08730-57d6-4872-a485-7551f1bab3c1	2025-09-23 18:24:26.184306+03	2025-09-23 18:24:26.184315+03	t	0.00	20000.00	{}	2025-09-23	\N	cf9966b7-4e06-4341-a4ca-992f218926d1	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
39a81878-d4fd-4999-b4bd-2781e413cc0f	2025-09-23 18:24:26.21116+03	2025-09-23 18:24:26.211215+03	t	0.00	20000.00	{}	2025-09-23	\N	a3e56280-79a5-4f31-945f-f15b99f2cb9b	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
27508ea2-39b9-4ce9-a1df-aa35f34129b5	2025-09-23 18:24:26.221767+03	2025-09-23 18:24:26.22178+03	t	0.00	20000.00	{}	2025-09-23	\N	792f2b97-9bd0-480d-a5cf-6d213196591c	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
e1bce172-1d1e-46c3-bbd8-b8a167a5b3f4	2025-09-23 18:24:26.233364+03	2025-09-23 18:24:26.233376+03	t	0.00	20000.00	{}	2025-09-23	\N	d4426841-f3d0-42bf-931e-7662f12405a5	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
8cf44948-5eb3-4830-9b2e-a5e92894bb56	2025-09-23 18:24:26.270558+03	2025-09-23 18:24:26.270565+03	t	0.00	20000.00	{}	2025-09-23	\N	0b13511b-8e76-4616-934b-a847650f43fa	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
93653ca7-651d-4edc-aac0-0254bab9a255	2025-09-23 18:24:26.277147+03	2025-09-23 18:24:26.277156+03	t	0.00	20000.00	{}	2025-09-23	\N	c3d87a28-c87a-4b21-951f-1b0586a9d908	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
60147446-1dd3-4e5b-af2b-093fbec840b2	2025-09-23 18:24:26.284688+03	2025-09-23 18:24:26.284697+03	t	0.00	20000.00	{}	2025-09-23	\N	d850b486-5ea8-40b1-940d-5c29927fb6c6	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
e0ff6265-8ced-4452-9987-3813222ee8a5	2025-09-23 18:24:26.292712+03	2025-09-23 18:24:26.29272+03	t	0.00	20000.00	{}	2025-09-23	\N	cf9966b7-4e06-4341-a4ca-992f218926d1	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
fbd8b97b-c4bb-429a-9e5a-52745463b375	2025-09-28 18:57:16.43644+03	2025-09-28 23:38:56.595492+03	t	100.00	\N	{"pricing_type": "fixed"}	2025-09-28	\N	e5fda96b-fdda-4fe9-a53c-3cd8d5500ada	aa85d49e-06a2-40ec-9a22-e09b453f8066	\N	\N
939d71ee-59ed-4f52-aa21-afcdcac0da8c	2025-09-28 17:13:09.210962+03	2025-09-28 18:11:22.725311+03	t	3500.00	\N	{"pricing_type": "fixed"}	2025-09-27	\N	f74414bf-1e4f-4965-a953-dc4f46c3e265	771c566f-292a-49f1-97a9-19c2b967335e	\N	\N
fc8212aa-b1f8-4f46-a7cb-30d98903c0c1	2025-09-23 18:24:26.117267+03	2025-09-23 18:24:26.117276+03	t	5500.00	\N	{}	2025-09-23	\N	0e9334f1-a127-48e0-8a41-623fc00825e3	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
c245c32d-f79f-47bc-ac5c-7a4b7d5d6186	2025-09-23 18:24:26.313069+03	2025-09-23 18:24:26.313076+03	t	0.00	20000.00	{}	2025-09-23	\N	a3e56280-79a5-4f31-945f-f15b99f2cb9b	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
0d6b88ed-5adb-4f8c-bdcb-247f196b1a3e	2025-09-23 18:24:26.321003+03	2025-09-23 18:24:26.321014+03	t	0.00	20000.00	{}	2025-09-23	\N	792f2b97-9bd0-480d-a5cf-6d213196591c	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
0cbbcc3e-8ce5-487f-a6cb-0c163dbe7cfe	2025-09-23 18:22:44.923375+03	2025-09-23 18:22:44.923387+03	t	800.00	\N	{}	2025-09-23	\N	d83ac6d4-9151-417f-b11e-4f2a3277ac82	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
10a2d701-0fb7-4b1b-8ac8-9549032b8889	2025-09-23 22:17:32.853142+03	2025-09-23 22:17:32.853153+03	t	3600.00	\N	{}	2025-09-23	\N	e5fda96b-fdda-4fe9-a53c-3cd8d5500ada	155e4474-a112-4231-b2b4-29e7f0a675e4	\N	\N
ba233acd-d75d-41a9-a0a3-ccc38a0d423e	2025-09-23 18:24:26.329722+03	2025-09-23 18:24:26.329735+03	t	0.00	20000.00	{}	2025-09-23	\N	d4426841-f3d0-42bf-931e-7662f12405a5	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
d4942002-3ab7-4717-b648-d5e82a4b0130	2025-09-23 18:22:44.948164+03	2025-09-23 18:22:44.948175+03	t	5500.00	\N	{}	2025-09-23	\N	f74414bf-1e4f-4965-a953-dc4f46c3e265	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
8f9625e0-6bea-4acc-aee6-740106248cd5	2025-09-23 17:54:14.763883+03	2025-09-23 19:22:13.874356+03	t	850.00	\N	{}	2025-09-23	\N	5d6abafb-0ab9-418e-b37e-99d2447c137f	acff5e40-a95b-4dd1-bc06-8e210e1e95bc	\N	\N
db186486-700b-4e6d-aa41-282e6eb6de7c	2025-09-23 18:22:44.84653+03	2025-09-23 19:22:13.890671+03	t	900.00	\N	{}	2025-09-23	\N	5d6abafb-0ab9-418e-b37e-99d2447c137f	14900c1c-4327-4366-a1e9-585699b1a495	\N	\N
f3a5c2b7-b907-49b6-9200-d0f934f47cb7	2025-09-28 17:13:09.214559+03	2025-09-28 18:14:46.792641+03	t	0.00	20000.00	{"rate": 0.003, "pricing_type": "percentage"}	2025-09-28	\N	c3d87a28-c87a-4b21-951f-1b0586a9d908	771c566f-292a-49f1-97a9-19c2b967335e	\N	[{"to": 1500000, "min": 20000, "from": 0, "rate": 0.035}, {"to": 3000000, "min": 20000, "from": 1500000, "rate": 0.03}, {"to": null, "min": 30000, "from": 3000000, "rate": 0.025}]
ef9d64bf-fab1-4bb4-8d7b-f2ace11fdf6f	2025-09-28 18:03:49.389044+03	2025-09-28 19:28:56.562446+03	t	3500.00	\N	{"pricing_type": "fixed"}	2025-09-28	\N	ce88273c-85b0-4d72-a815-d9e9fef0b66a	aa85d49e-06a2-40ec-9a22-e09b453f8066	\N	\N
ae881db2-d597-4e1c-9b19-eaa3579e25fc	2025-09-28 18:03:49.39346+03	2025-09-28 19:28:56.567768+03	t	3500.00	\N	{"pricing_type": "fixed"}	2025-09-28	\N	87862519-800b-4655-b480-790228534766	aa85d49e-06a2-40ec-9a22-e09b453f8066	\N	\N
b44b86a0-6277-468a-942b-ca5b3d824576	2025-09-28 18:03:49.396178+03	2025-09-28 19:28:56.570433+03	t	0.00	15000.00	{"rate": 0.03, "pricing_type": "percentage"}	2025-09-28	\N	c3d87a28-c87a-4b21-951f-1b0586a9d908	aa85d49e-06a2-40ec-9a22-e09b453f8066	\N	\N
93e48481-d1e9-4e9b-8891-9d6a91d5062f	2025-09-28 18:03:49.381308+03	2025-09-28 23:10:44.570008+03	t	400.00	\N	{"pricing_type": "fixed"}	2025-09-28	\N	d83ac6d4-9151-417f-b11e-4f2a3277ac82	aa85d49e-06a2-40ec-9a22-e09b453f8066	\N	\N
743609b5-886f-4ea1-9f29-c63dbd9d8564	2025-09-28 18:14:46.789235+03	2025-09-28 23:10:44.583183+03	t	600.00	\N	{"pricing_type": "fixed"}	2025-09-28	\N	d83ac6d4-9151-417f-b11e-4f2a3277ac82	771c566f-292a-49f1-97a9-19c2b967335e	\N	\N
0376aa83-fe46-4659-a368-e55ae382f626	2025-09-28 17:13:09.19966+03	2025-09-28 18:14:46.784466+03	t	5200.00	\N	{"pricing_type": "fixed"}	2025-09-28	\N	e5fda96b-fdda-4fe9-a53c-3cd8d5500ada	771c566f-292a-49f1-97a9-19c2b967335e	\N	\N
88445284-3776-4303-85c7-cd9da750bd00	2025-09-28 18:57:16.460547+03	2025-09-28 23:10:44.579483+03	t	8000.00	8000.00	{"rate": 0.025, "pricing_type": "percentage"}	2025-09-28	\N	cf9966b7-4e06-4341-a4ca-992f218926d1	aa85d49e-06a2-40ec-9a22-e09b453f8066	\N	\N
\.


--
-- Data for Name: app_motorsubcategory; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_motorsubcategory (id, date_created, date_updated, is_active, subcategory_code, subcategory_name, product_type, description, additional_fields, field_validations, pricing_requirements, category_id, extendible_variant_id, is_extendible, pricing_model, is_complex, cover_type_ref_id, show_in_public, public_sort_order, public_label) FROM stdin;
d83ac6d4-9151-417f-b11e-4f2a3277ac82	2025-09-23 17:54:13.083103+03	2025-09-23 19:22:12.118444+03	t	PRIVATE_TOR	Private Time On Risk	fixed	\N	[]	{}	{}	02a099fd-e88b-4b61-8f64-0e3eb7ee173f	\N	f	FIXED	f	\N	t	401	TOR For Private
f74414bf-1e4f-4965-a953-dc4f46c3e265	2025-09-29 01:50:23.601463+03	2025-09-29 01:50:23.60147+03	t	PRIVATE_THIRD_PARTY_EXT	PRIVATE_THIRD_PARTY_EXT	THIRD_PARTY	\N	[]	{}	{}	02a099fd-e88b-4b61-8f64-0e3eb7ee173f	\N	f	FIXED	f	\N	t	203	Private Third-Party Extendible
a5159ed8-4774-4d50-ae56-d49b1d0f86a3	2025-09-29 01:50:23.60846+03	2025-09-29 01:50:23.608468+03	t	PRIVATE_MOTORCYCLE_TP	PRIVATE_MOTORCYCLE_TP	THIRD_PARTY	\N	[]	{}	{}	02a099fd-e88b-4b61-8f64-0e3eb7ee173f	\N	f	FIXED	f	\N	t	104	Private Motorcycle Third-Party
c3d87a28-c87a-4b21-951f-1b0586a9d908	2025-09-23 17:54:13.089253+03	2025-09-23 19:22:12.125495+03	t	PRIVATE_COMPREHENSIVE	Private Comprehensive	comprehensive	\N	[]	{}	{}	02a099fd-e88b-4b61-8f64-0e3eb7ee173f	\N	f	FIXED	f	\N	t	505	Private Comprehensive
d234cead-5ffa-4fd7-b75b-fc70002baf39	2025-09-29 03:12:30.171926+03	2025-09-29 03:12:30.171946+03	t	COMMERCIAL_TOR	TOR For Commercial	TOR	\N	["tonnage"]	{}	{"max_tonnage": 31, "requires_tonnage": true}	fe27c128-972d-4a08-8893-1ad922d882bd	\N	f	TONNAGE	f	\N	t	401	TOR For Commercial
b7ad403a-321a-4789-8fe4-0efb0dc4f817	2025-09-29 03:12:30.180306+03	2025-09-29 03:12:30.180318+03	t	COMMERCIAL_OWN_GOODS_TP	Own Goods Third-Party	THIRD_PARTY	\N	["tonnage"]	{}	{"max_tonnage": 31, "requires_tonnage": true}	fe27c128-972d-4a08-8893-1ad922d882bd	\N	f	TONNAGE	f	\N	t	102	Own Goods Third-Party
d7b4da34-6ad7-4a34-ae35-4cecbdb4b995	2025-09-29 03:12:30.181896+03	2025-09-29 03:12:30.181904+03	t	COMMERCIAL_OWN_GOODS_TP_EXT	Own Goods Third-Party Extendible	THIRD_PARTY_EXT	\N	["tonnage"]	{}	{"max_tonnage": 31, "requires_tonnage": true}	fe27c128-972d-4a08-8893-1ad922d882bd	\N	f	TONNAGE	f	\N	t	203	Own Goods Third-Party Extendible
97fccac6-72a3-4263-b7a9-57335e71985e	2025-09-29 03:12:30.183354+03	2025-09-29 03:12:30.183361+03	t	COMMERCIAL_GENERAL_CARTAGE_TP	General Cartage Third-Party	THIRD_PARTY	\N	["tonnage"]	{}	{"max_tonnage": 31, "requires_tonnage": true}	fe27c128-972d-4a08-8893-1ad922d882bd	\N	f	TONNAGE	f	\N	t	104	General Cartage Third-Party
927d6176-6b77-4650-a542-3874d629ae15	2025-09-29 03:12:30.184789+03	2025-09-29 03:12:30.184796+03	t	COMMERCIAL_GENERAL_CARTAGE_TP_EXT	General Cartage Third-Party Extendible	THIRD_PARTY_EXT	\N	["tonnage"]	{}	{"max_tonnage": 31, "requires_tonnage": true}	fe27c128-972d-4a08-8893-1ad922d882bd	\N	f	TONNAGE	f	\N	t	205	General Cartage Third-Party Extendible
f2e4c804-1bc3-4411-99ab-c91f1f08606c	2025-09-29 03:12:30.18637+03	2025-09-29 03:12:30.186377+03	t	COMMERCIAL_GENERAL_CARTAGE_TP_PM	General Cartage Third-Party Prime Mover	THIRD_PARTY	\N	["tonnage"]	{}	{"max_tonnage": 31, "requires_tonnage": true}	fe27c128-972d-4a08-8893-1ad922d882bd	\N	f	TONNAGE	f	\N	t	106	General Cartage Third-Party Prime Mover
d85a3baa-dc18-4773-9dd4-d5556c66f24c	2025-09-23 17:54:13.096334+03	2025-09-23 19:22:12.153574+03	t	COMM_TUKTUK_TP	Commercial TukTuk Third Party	third_party	\N	[]	{}	{}	fe27c128-972d-4a08-8893-1ad922d882bd	\N	f	FIXED	f	\N	f	0	\N
e5fda96b-fdda-4fe9-a53c-3cd8d5500ada	2025-09-29 01:50:23.588177+03	2025-09-29 01:50:23.588186+03	t	PRIVATE_THIRD_PARTY	PRIVATE_THIRD_PARTY	THIRD_PARTY	\N	[]	{}	{}	02a099fd-e88b-4b61-8f64-0e3eb7ee173f	\N	f	FIXED	f	\N	t	102	Private Third-Party
a3e56280-79a5-4f31-945f-f15b99f2cb9b	2025-09-29 01:50:23.571909+03	2025-09-29 01:50:23.571927+03	t	SPECIAL_INSTITUTIONAL_TP	SPECIAL_INSTITUTIONAL_TP	THIRD_PARTY	\N	[]	{}	{}	02a099fd-e88b-4b61-8f64-0e3eb7ee173f	\N	f	FIXED	f	\N	f	0	\N
f1b4d2b9-5654-4146-a799-5a66e44fd01e	2025-09-29 01:50:23.576224+03	2025-09-29 01:50:23.576232+03	t	COMMERCIAL_GENERAL_CARTAGE_TP	COMMERCIAL_GENERAL_CARTAGE_TP	THIRD_PARTY	\N	[]	{}	{}	02a099fd-e88b-4b61-8f64-0e3eb7ee173f	\N	f	FIXED	f	\N	f	0	\N
792f2b97-9bd0-480d-a5cf-6d213196591c	2025-09-29 01:50:23.578467+03	2025-09-29 01:50:23.578475+03	t	SPECIAL_AMBULANCE_COMP	SPECIAL_AMBULANCE_COMP	THIRD_PARTY	\N	[]	{}	{}	02a099fd-e88b-4b61-8f64-0e3eb7ee173f	\N	f	FIXED	f	\N	f	0	\N
47363ab5-bb14-4a5d-bec4-37f5cd8159b3	2025-09-29 01:50:23.58074+03	2025-09-29 01:50:23.580746+03	t	COMMERCIAL_OWN_GOODS_TP	COMMERCIAL_OWN_GOODS_TP	THIRD_PARTY	\N	[]	{}	{}	02a099fd-e88b-4b61-8f64-0e3eb7ee173f	\N	f	FIXED	f	\N	f	0	\N
cf9966b7-4e06-4341-a4ca-992f218926d1	2025-09-29 01:50:23.582741+03	2025-09-29 01:50:23.582747+03	t	MOTORCYCLE_PRIVATE_COMP	MOTORCYCLE_PRIVATE_COMP	THIRD_PARTY	\N	[]	{}	{}	02a099fd-e88b-4b61-8f64-0e3eb7ee173f	\N	f	FIXED	f	\N	f	0	\N
5d6abafb-0ab9-418e-b37e-99d2447c137f	2025-09-29 01:50:23.585495+03	2025-09-29 01:50:23.585506+03	t	COMMERCIAL_TOR	COMMERCIAL_TOR	THIRD_PARTY	\N	[]	{}	{}	02a099fd-e88b-4b61-8f64-0e3eb7ee173f	\N	f	FIXED	f	\N	f	0	\N
55ec10f8-901f-4684-9601-d01944a85987	2025-09-29 01:50:23.590266+03	2025-09-29 01:50:23.590272+03	t	PSV_MATATU_1M_TP	PSV_MATATU_1M_TP	THIRD_PARTY	\N	[]	{}	{}	02a099fd-e88b-4b61-8f64-0e3eb7ee173f	\N	f	FIXED	f	\N	f	0	\N
d4426841-f3d0-42bf-931e-7662f12405a5	2025-09-29 01:50:23.592226+03	2025-09-29 01:50:23.592232+03	t	SPECIAL_AGRICULTURAL_COMP	SPECIAL_AGRICULTURAL_COMP	THIRD_PARTY	\N	[]	{}	{}	02a099fd-e88b-4b61-8f64-0e3eb7ee173f	\N	f	FIXED	f	\N	f	0	\N
d850b486-5ea8-40b1-940d-5c29927fb6c6	2025-09-29 01:50:23.594388+03	2025-09-29 01:50:23.594398+03	t	PSV_UBER_COMP	PSV_UBER_COMP	THIRD_PARTY	\N	[]	{}	{}	02a099fd-e88b-4b61-8f64-0e3eb7ee173f	\N	f	FIXED	f	\N	f	0	\N
562464a1-ba36-4db8-95f2-d2c6d7792781	2025-09-29 01:50:23.596846+03	2025-09-29 01:50:23.596853+03	t	TUKTUK_COMMERCIAL_COMP	TUKTUK_COMMERCIAL_COMP	THIRD_PARTY	\N	[]	{}	{}	02a099fd-e88b-4b61-8f64-0e3eb7ee173f	\N	f	FIXED	f	\N	f	0	\N
8da7297d-5b17-4969-9b1b-e78bb6d5d40f	2025-09-29 01:50:23.599031+03	2025-09-29 01:50:23.599037+03	t	TUKTUK_COMMERCIAL_TP	TUKTUK_COMMERCIAL_TP	THIRD_PARTY	\N	[]	{}	{}	02a099fd-e88b-4b61-8f64-0e3eb7ee173f	\N	f	FIXED	f	\N	f	0	\N
0b13511b-8e76-4616-934b-a847650f43fa	2025-09-29 01:50:23.603477+03	2025-09-29 01:50:23.603484+03	t	COMMERCIAL_OWN_GOODS_COMP	COMMERCIAL_OWN_GOODS_COMP	THIRD_PARTY	\N	[]	{}	{}	02a099fd-e88b-4b61-8f64-0e3eb7ee173f	\N	f	FIXED	f	\N	f	0	\N
0e9334f1-a127-48e0-8a41-623fc00825e3	2025-09-29 01:50:23.606241+03	2025-09-29 01:50:23.606251+03	t	SPECIAL_AGRICULTURAL_TP	SPECIAL_AGRICULTURAL_TP	THIRD_PARTY	\N	[]	{}	{}	02a099fd-e88b-4b61-8f64-0e3eb7ee173f	\N	f	FIXED	f	\N	f	0	\N
9dbc9eb0-8694-41a5-adb2-f7ecdfa00530	2025-09-29 01:50:23.610516+03	2025-09-29 01:50:23.610524+03	t	TUKTUK_PSV_TP	TUKTUK_PSV_TP	THIRD_PARTY	\N	[]	{}	{}	02a099fd-e88b-4b61-8f64-0e3eb7ee173f	\N	f	FIXED	f	\N	f	0	\N
e319fcc3-a380-435c-ba1e-cb1f99e24c41	2025-09-29 03:12:30.188088+03	2025-09-29 03:12:30.188095+03	t	COMMERCIAL_GENERAL_CARTAGE_TP_EXT_PM	General Cartage Third-Party Extendible Prime Mover	THIRD_PARTY_EXT	\N	["tonnage"]	{}	{"max_tonnage": 31, "requires_tonnage": true}	fe27c128-972d-4a08-8893-1ad922d882bd	\N	f	TONNAGE	f	\N	t	207	General Cartage Third-Party Extendible Prime Mover
927c1088-fae4-4db6-b014-9d92428eac50	2025-09-29 03:12:30.190136+03	2025-09-29 03:12:30.190144+03	t	COMMERCIAL_GENERAL_CARTAGE_COMP	General Cartage Comprehensive	COMPREHENSIVE	\N	["tonnage"]	{}	{"max_tonnage": 31, "requires_tonnage": true}	fe27c128-972d-4a08-8893-1ad922d882bd	\N	f	TONNAGE	f	\N	t	508	General Cartage Comprehensive
3600f66f-b8dd-45b5-bbef-1316b6fb90fb	2025-09-29 03:12:30.191995+03	2025-09-29 03:12:30.192002+03	t	COMMERCIAL_OWN_GOODS_COMP	Own Goods Comprehensive	COMPREHENSIVE	\N	["tonnage"]	{}	{"max_tonnage": 31, "requires_tonnage": true}	fe27c128-972d-4a08-8893-1ad922d882bd	\N	f	TONNAGE	f	\N	t	509	Own Goods Comprehensive
8a6b2335-aa56-4658-a15d-9c0db0062b2c	2025-09-23 17:54:13.104318+03	2025-09-23 19:22:12.184627+03	t	PSV_UBER_TP	PSV Uber Third-Party	THIRD_PARTY	\N	[]	{}	{}	d4ee8d63-363f-40e1-a5fc-41748a26ef42	\N	f	PASSENGER	f	\N	t	101	PSV Uber Third-Party
accb806c-d4ba-4aa0-9ff0-bb7505fd78d2	2025-09-23 17:54:13.105875+03	2025-09-23 19:22:12.186843+03	t	PSV_TUKTUK_TP	PSV Tuk-Tuk Third-Party	THIRD_PARTY	\N	[]	{}	{}	d4ee8d63-363f-40e1-a5fc-41748a26ef42	\N	f	PASSENGER	f	\N	t	102	PSV Tuk-Tuk Third-Party
0ea55fb0-2580-4e81-b4cb-d4a0ce9e2d0e	2025-09-29 03:05:54.489387+03	2025-09-29 03:05:54.489409+03	t	PSV_TUKTUK_TP_EXT	PSV Tuk-Tuk Third-Party Extendible	THIRD_PARTY_EXT	\N	["passenger_count"]	{}	{"requires_passenger_count": true}	d4ee8d63-363f-40e1-a5fc-41748a26ef42	\N	f	PASSENGER	f	\N	t	203	PSV Tuk-Tuk Third-Party Extendible
20ff31a0-8000-4c03-9cd9-2313da80fa72	2025-09-29 03:05:54.493378+03	2025-09-29 03:05:54.493388+03	t	PSV_MATATU_1M_TP	1 Month PSV Matatu Third-Party	THIRD_PARTY	\N	["passenger_count"]	{}	{"requires_passenger_count": true}	d4ee8d63-363f-40e1-a5fc-41748a26ef42	\N	f	PASSENGER	f	\N	t	104	1 Month PSV Matatu Third-Party
30318080-02ef-4c91-902f-169cc49e5cd3	2025-09-29 03:05:54.49536+03	2025-09-29 03:05:54.495369+03	t	PSV_MATATU_2WKS_TP	2 Weeks PSV Matatu Third-Party	THIRD_PARTY	\N	["passenger_count"]	{}	{"requires_passenger_count": true}	d4ee8d63-363f-40e1-a5fc-41748a26ef42	\N	f	PASSENGER	f	\N	t	105	2 Weeks PSV Matatu Third-Party
2ed6271a-1b24-4463-b7a9-29021ca597ab	2025-09-29 03:05:54.497043+03	2025-09-29 03:05:54.49705+03	t	PSV_UBER_TP_EXT	PSV Uber Third-Party Extendible	THIRD_PARTY_EXT	\N	["passenger_count"]	{}	{"requires_passenger_count": true}	d4ee8d63-363f-40e1-a5fc-41748a26ef42	\N	f	PASSENGER	f	\N	t	206	PSV Uber Third-Party Extendible
115f0d9a-3a1c-43eb-8cde-03441d4fda05	2025-09-29 03:05:54.498591+03	2025-09-29 03:05:54.498599+03	t	PSV_TOUR_VAN_TP	PSV Tour Van Third-Party	THIRD_PARTY	\N	["passenger_count"]	{}	{"requires_passenger_count": true}	d4ee8d63-363f-40e1-a5fc-41748a26ef42	\N	f	PASSENGER	f	\N	t	107	PSV Tour Van Third-Party
8309f7db-23f7-4c96-a565-631a6f98cbf2	2025-09-29 03:05:54.500028+03	2025-09-29 03:05:54.500036+03	t	PSV_MATATU_1WK_TP_EXT	1 Week PSV Matatu Third-Party Extendible	THIRD_PARTY_EXT	\N	["passenger_count"]	{}	{"requires_passenger_count": true}	d4ee8d63-363f-40e1-a5fc-41748a26ef42	\N	f	PASSENGER	f	\N	t	208	1 Week PSV Matatu Third-Party Extendible
89b3450a-72d7-4e4d-a777-a195b27f20d1	2025-09-29 03:05:54.501709+03	2025-09-29 03:05:54.50172+03	t	PSV_PLAIN_TPO	PSV Plain TPO	THIRD_PARTY	\N	["passenger_count"]	{}	{"requires_passenger_count": true}	d4ee8d63-363f-40e1-a5fc-41748a26ef42	\N	f	PASSENGER	f	\N	t	109	PSV Plain TPO
80830f4d-a48a-4bb7-aabd-a5b418c14868	2025-09-29 03:05:54.503621+03	2025-09-29 03:05:54.503628+03	t	PSV_TOUR_VAN_TP_EXT	PSV Tour Van Third-Party Extendible	THIRD_PARTY_EXT	\N	["passenger_count"]	{}	{"requires_passenger_count": true}	d4ee8d63-363f-40e1-a5fc-41748a26ef42	\N	f	PASSENGER	f	\N	t	210	PSV Tour Van Third-Party Extendible
acf78ac4-9d88-4200-aae5-03131abce47b	2025-09-29 03:05:54.505466+03	2025-09-29 03:05:54.505478+03	t	PSV_UBER_COMP	PSV Uber Comprehensive	COMPREHENSIVE	\N	["passenger_count"]	{}	{"requires_passenger_count": true}	d4ee8d63-363f-40e1-a5fc-41748a26ef42	\N	f	PASSENGER	f	\N	t	511	PSV UBER COMPREHENSIVE
9d10c0e7-f9c9-4589-b9f5-17534b08881c	2025-09-29 03:05:54.507177+03	2025-09-29 03:05:54.507185+03	t	PSV_TOUR_VAN_COMP	PSV Tour Van Comprehensive	COMPREHENSIVE	\N	["passenger_count"]	{}	{"requires_passenger_count": true}	d4ee8d63-363f-40e1-a5fc-41748a26ef42	\N	f	PASSENGER	f	\N	t	512	PSV Tour Van Comprehensive
87862519-800b-4655-b480-790228534766	2025-09-23 17:54:13.113408+03	2025-09-23 19:22:12.211158+03	t	MOTORCYCLE_PRIVATE_TP	Private motorcycle third party	THIRD_PARTY	\N	[]	{}	{}	83a003d5-9c80-422b-9350-583f92bb9d55	\N	f	ENGINE_CC	f	\N	t	101	Private Motorcycle Third Party
ce88273c-85b0-4d72-a815-d9e9fef0b66a	2025-09-23 17:54:13.115651+03	2025-09-23 19:22:12.212971+03	t	MOTORCYCLE_PSV_TP	PSV motorcycle third party	THIRD_PARTY	\N	[]	{}	{}	83a003d5-9c80-422b-9350-583f92bb9d55	\N	f	ENGINE_CC	f	\N	t	102	PSV Motorcycle Third Party
8b31baec-cc54-4de4-9e60-82d932a61c85	2025-09-29 03:12:30.197643+03	2025-09-29 03:12:30.197653+03	t	MOTORCYCLE_PSV_TP_6M	PSV motorcycle third-party 6 months	THIRD_PARTY	\N	["engine_capacity"]	{}	{"requires_engine_capacity": true}	83a003d5-9c80-422b-9350-583f92bb9d55	\N	f	ENGINE_CC	f	\N	t	103	PSV motorcycle third-party 6 months
9050b00a-55a0-4bc2-ba54-d3d137514a33	2025-09-29 03:12:30.199179+03	2025-09-29 03:12:30.199186+03	t	MOTORCYCLE_PRIVATE_COMP	Private Motorcycle comprehensive	COMPREHENSIVE	\N	["engine_capacity"]	{}	{"requires_engine_capacity": true}	83a003d5-9c80-422b-9350-583f92bb9d55	\N	f	ENGINE_CC	f	\N	t	504	Private Motorcycle Comprehensive
d5497b86-997f-47cc-822e-9ea23b8929a9	2025-09-29 03:12:30.200818+03	2025-09-29 03:12:30.20083+03	t	MOTORCYCLE_PSV_COMP	PSV Motorcycle comprehensive	COMPREHENSIVE	\N	["engine_capacity"]	{}	{"requires_engine_capacity": true}	83a003d5-9c80-422b-9350-583f92bb9d55	\N	f	ENGINE_CC	f	\N	t	505	PSV Motorcycle comprehensive
ef6f9d94-afa6-4957-a6e1-c722dc3f327f	2025-09-29 03:12:30.202425+03	2025-09-29 03:12:30.202435+03	t	MOTORCYCLE_PSV_COMP_6M	PSV motorcycle comprehensive 6 months	COMPREHENSIVE	\N	["engine_capacity"]	{}	{"requires_engine_capacity": true}	83a003d5-9c80-422b-9350-583f92bb9d55	\N	f	ENGINE_CC	f	\N	t	506	PSV motorcycle comprehensive 6 months
563e94a4-6304-438a-9b5f-25b72bce2773	2025-09-29 03:12:30.204614+03	2025-09-29 03:12:30.204623+03	t	TUKTUK_PSV_TP	PSV Tuk-Tuk Third-Party	THIRD_PARTY	\N	["passenger_count"]	{}	{"requires_passenger_count": true}	4f87a0cc-d791-4e20-9b96-39855211270e	\N	f	PASSENGER	f	\N	t	101	PSV Tuk-Tuk Third-Party
d7b935c7-d55f-47ca-9e28-5a444243e9b1	2025-09-29 03:12:30.206137+03	2025-09-29 03:12:30.206145+03	t	TUKTUK_PSV_TP_EXT	PSV Tuk-Tuk Third-Party Extendible	THIRD_PARTY_EXT	\N	["passenger_count"]	{}	{"requires_passenger_count": true}	4f87a0cc-d791-4e20-9b96-39855211270e	\N	f	PASSENGER	f	\N	t	202	PSV Tuk-Tuk Third-Party Extendible
ace106ee-e1e8-40c1-9a97-4d073f5b3f33	2025-09-29 03:12:30.208217+03	2025-09-29 03:12:30.208225+03	t	TUKTUK_COMMERCIAL_TP	Commercial TukTuk Third-Party	THIRD_PARTY	\N	[]	{}	{}	4f87a0cc-d791-4e20-9b96-39855211270e	\N	f	FIXED	f	\N	t	103	Commercial TukTuk Third-Party
fb7e17be-9bfd-4fc3-93e8-6fa13346eebe	2025-09-29 03:12:30.209918+03	2025-09-29 03:12:30.209925+03	t	TUKTUK_COMMERCIAL_TP_EXT	Commercial TukTuk Third-Party Extendible	THIRD_PARTY_EXT	\N	[]	{}	{}	4f87a0cc-d791-4e20-9b96-39855211270e	\N	f	FIXED	f	\N	t	204	Commercial TukTuk Third-Party Extendible
cf100eb6-efb7-4c10-afab-9b628baf3747	2025-09-29 03:12:30.211648+03	2025-09-29 03:12:30.211655+03	t	TUKTUK_COMMERCIAL_COMP	Commercial TukTuk Comprehensive	COMPREHENSIVE	\N	[]	{}	{}	4f87a0cc-d791-4e20-9b96-39855211270e	\N	f	FIXED	f	\N	t	505	Commercial TukTuk Comprehensive
a1b8c919-c5a2-4e10-882d-41e9a2b734b8	2025-09-29 03:12:30.213092+03	2025-09-29 03:12:30.2131+03	t	TUKTUK_PSV_COMP	PSV Tuk-Tuk Comprehensive	COMPREHENSIVE	\N	["passenger_count"]	{}	{"requires_passenger_count": true}	4f87a0cc-d791-4e20-9b96-39855211270e	\N	f	PASSENGER	f	\N	t	506	PSV Tuk-Tuk Comprehensive
01409174-e37d-4573-ad01-cd717030ab52	2025-09-29 03:12:30.215128+03	2025-09-29 03:12:30.215135+03	t	SPECIAL_AGRICULTURAL_TP	Agricultural Tractor Third-Party	THIRD_PARTY	\N	["tonnage"]	{}	{"max_tonnage": 31, "requires_tonnage": true}	63206394-bcc9-4ca4-9a2f-faf4cbadddb0	\N	f	TONNAGE	f	\N	t	101	Agricultural Tractor Third-Party
65cb2a5d-36e5-468b-a371-0cf955cbd780	2025-09-29 03:12:30.216552+03	2025-09-29 03:12:30.216559+03	t	SPECIAL_INSTITUTIONAL_TP	Commercial Institutional Third-Party	THIRD_PARTY	\N	["passenger_count", "passenger_type"]	{}	{"requires_passenger_type": true, "requires_passenger_count": true}	63206394-bcc9-4ca4-9a2f-faf4cbadddb0	\N	f	PASSENGER	f	\N	t	102	Commercial Institutional Third-Party
b976507a-d35e-4e84-9ef7-94608abaa1b5	2025-09-29 03:12:30.218016+03	2025-09-29 03:12:30.218024+03	t	SPECIAL_INSTITUTIONAL_TP_EXT	Commercial Institutional Third-Party Extendible	THIRD_PARTY_EXT	\N	["passenger_count", "passenger_type"]	{}	{"requires_passenger_type": true, "requires_passenger_count": true}	63206394-bcc9-4ca4-9a2f-faf4cbadddb0	\N	f	PASSENGER	f	\N	t	203	Commercial Institutional Third-Party Extendible
29ee63eb-cc42-4b85-9052-cd515a8dc056	2025-09-29 03:12:30.219683+03	2025-09-29 03:12:30.219691+03	t	SPECIAL_KG_PLATE_TP	KG Plate Third-Party	THIRD_PARTY	\N	[]	{}	{}	63206394-bcc9-4ca4-9a2f-faf4cbadddb0	\N	f	FIXED	f	\N	t	104	KG Plate Third-Party
dec45528-de0c-4e25-b4d8-4d594237bb1a	2025-09-29 03:12:30.221846+03	2025-09-29 03:12:30.221854+03	t	SPECIAL_DRIVING_SCHOOL_TP	Driving School Third-Party	THIRD_PARTY	\N	["tonnage", "passenger_count"]	{}	{"requires_tonnage": true, "requires_passenger_count": true}	63206394-bcc9-4ca4-9a2f-faf4cbadddb0	\N	f	TONNAGE	f	\N	t	105	Driving School Third-Party
8e119d96-cd85-4281-b2e3-ed25887c0651	2025-09-29 03:12:30.223659+03	2025-09-29 03:12:30.223666+03	t	SPECIAL_AGRICULTURAL_COMP	Agricultural Tractor Comprehensive	COMPREHENSIVE	\N	["tonnage"]	{}	{"max_tonnage": 31, "requires_tonnage": true}	63206394-bcc9-4ca4-9a2f-faf4cbadddb0	\N	f	TONNAGE	f	\N	t	506	Agricultural Tractor Comprehensive
c5178a09-c508-45ec-8cfa-886b32f3e300	2025-09-29 03:12:30.225295+03	2025-09-29 03:12:30.225302+03	t	SPECIAL_INSTITUTIONAL_COMP	Commercial Institutional Comprehensive	COMPREHENSIVE	\N	["passenger_count", "passenger_type"]	{}	{"requires_passenger_type": true, "requires_passenger_count": true}	63206394-bcc9-4ca4-9a2f-faf4cbadddb0	\N	f	PASSENGER	f	\N	t	507	Commercial Institutional Comprehensive
051a8549-d5fd-4fc7-b176-1d6955ff5f13	2025-09-29 03:12:30.2267+03	2025-09-29 03:12:30.226707+03	t	SPECIAL_DRIVING_SCHOOL_COMP	Driving School Comprehensive	COMPREHENSIVE	\N	["tonnage", "passenger_count"]	{}	{"requires_tonnage": true, "requires_passenger_count": true}	63206394-bcc9-4ca4-9a2f-faf4cbadddb0	\N	f	TONNAGE	f	\N	t	508	Driving School Comprehensive
ac494bc7-5f7c-402e-9a9c-937a131ad25c	2025-09-29 03:12:30.228072+03	2025-09-29 03:12:30.228079+03	t	SPECIAL_FUEL_TANKER_COMP	Fuel Tankers Comprehensive	COMPREHENSIVE	\N	["tonnage"]	{}	{"max_tonnage": 31, "requires_tonnage": true}	63206394-bcc9-4ca4-9a2f-faf4cbadddb0	\N	f	TONNAGE	f	\N	t	509	Fuel Tankers Comprehensive
2f817e5c-17a4-4772-8fbf-627056677cd0	2025-09-29 03:12:30.229473+03	2025-09-29 03:12:30.229481+03	t	SPECIAL_AMBULANCE_COMP	Commercial Ambulance Comprehensive	COMPREHENSIVE	\N	[]	{}	{}	63206394-bcc9-4ca4-9a2f-faf4cbadddb0	\N	f	FIXED	f	\N	t	510	Commercial Ambulance Comprehensive
\.


--
-- Data for Name: app_otpmodel; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_otpmodel (id, otp_for, code, expiry_time, "user", date_created, is_verified, date_updated) FROM stdin;
1	CREATE_ACCOUNT	INVALID	\N	2e85b1cf-3231-46a8-9678-4a103673e5da	2025-09-23 19:27:28.250986+03	f	2025-09-23 19:27:28.250994+03
3	CREATE_ACCOUNT	INVALID	\N	21955367-50e9-443d-8cb9-8690d1d64ca1	2025-09-23 20:01:52.724425+03	f	2025-09-23 20:01:52.724434+03
4	LOGIN	PKC7WP	2025-09-23 20:06:53.229399+03	21955367-50e9-443d-8cb9-8690d1d64ca1	2025-09-23 20:01:52.724446+03	t	2025-09-23 20:01:53.72843+03
5	CREATE_ACCOUNT	INVALID	\N	0bc91409-d27a-47fb-9024-468efd3a88bf	2025-09-23 20:07:33.310909+03	f	2025-09-23 20:07:33.31092+03
32	LOGIN	HLMMRH	2025-09-25 09:45:14.917552+03	9a1e8504-228f-43a8-8ea6-081befd7f2d7	2025-09-25 09:40:14.477719+03	t	2025-09-25 09:40:15.354069+03
6	LOGIN	MHO4JN	2025-09-23 20:12:33.797717+03	0bc91409-d27a-47fb-9024-468efd3a88bf	2025-09-23 20:07:33.310929+03	t	2025-09-23 20:07:34.285654+03
7	CREATE_ACCOUNT	INVALID	\N	fb39b3bd-a2e1-4a1e-b943-936173ed8e0a	2025-09-23 20:10:52.592687+03	f	2025-09-23 20:10:52.592698+03
42	LOGIN	C5RB0T	2025-10-06 19:46:34.789385+03	06925957-1b8f-4bda-ae78-b5c777627bac	2025-10-06 19:41:05.032844+03	t	2025-10-06 19:42:42.082633+03
8	LOGIN	F38B0Q	2025-09-23 20:15:53.123363+03	fb39b3bd-a2e1-4a1e-b943-936173ed8e0a	2025-09-23 20:10:52.592709+03	t	2025-09-23 20:10:53.767683+03
9	CREATE_ACCOUNT	INVALID	\N	a0bfc0a4-8f28-437d-954f-37d2dec58c63	2025-09-23 20:15:44.584416+03	f	2025-09-23 20:15:44.584426+03
10	LOGIN	5JNT9W	2025-09-23 20:20:45.199009+03	a0bfc0a4-8f28-437d-954f-37d2dec58c63	2025-09-23 20:15:44.584434+03	t	2025-09-23 20:15:45.899873+03
11	CREATE_ACCOUNT	INVALID	\N	6e17c37a-4d51-4aa7-9f21-3172dbbda0b0	2025-09-23 22:32:00.783929+03	f	2025-09-23 22:32:00.78394+03
12	LOGIN	EF6ZIM	2025-09-23 22:37:01.271102+03	6e17c37a-4d51-4aa7-9f21-3172dbbda0b0	2025-09-23 22:32:00.78395+03	t	2025-09-23 22:32:01.764628+03
13	CREATE_ACCOUNT	INVALID	\N	95069092-9673-4c6b-a137-19a3f6131272	2025-09-24 09:57:30.311088+03	f	2025-09-24 09:57:30.311105+03
2	LOGIN	36KMTB	2025-10-11 09:40:42.716853+03	2e85b1cf-3231-46a8-9678-4a103673e5da	2025-09-23 19:27:28.251003+03	t	2025-10-11 09:35:43.216763+03
14	LOGIN	XUFL9F	2025-10-15 10:25:17.502821+03	95069092-9673-4c6b-a137-19a3f6131272	2025-09-24 09:57:30.311117+03	t	2025-10-15 10:20:21.099356+03
45	LOGIN	T6KQ6E	2025-10-11 10:13:53.537377+03	3dc28354-5326-4acb-b194-d2da11fd51c0	2025-10-11 01:58:32.058336+03	t	2025-10-11 10:08:58.606425+03
33	CREATE_ACCOUNT	INVALID	\N	706681c2-a083-4a97-be9f-687b41d2dfc5	2025-09-28 12:16:03.501172+03	f	2025-09-28 12:16:03.501183+03
15	CREATE_ACCOUNT	INVALID	\N	30ab6ca1-87cf-4e4c-a049-28d3dab3c779	2025-09-24 11:20:00.908176+03	f	2025-09-24 11:20:00.908184+03
16	LOGIN	8OCDG8	2025-09-24 11:25:01.36642+03	30ab6ca1-87cf-4e4c-a049-28d3dab3c779	2025-09-24 11:20:00.908192+03	t	2025-09-24 11:20:01.925145+03
17	CREATE_ACCOUNT	INVALID	\N	f74384a9-9c2c-4baa-8f3c-304361adb10a	2025-09-24 11:20:30.377043+03	f	2025-09-24 11:20:30.37705+03
18	LOGIN	0YS4JH	2025-09-24 11:25:30.823658+03	f74384a9-9c2c-4baa-8f3c-304361adb10a	2025-09-24 11:20:30.377059+03	t	2025-09-24 11:20:31.281117+03
19	CREATE_ACCOUNT	INVALID	\N	e6ab4066-d1d8-4290-a64b-459a02e75315	2025-09-24 11:24:15.019973+03	f	2025-09-24 11:24:15.01998+03
34	LOGIN	QIXYHQ	2025-09-28 12:21:06.072331+03	706681c2-a083-4a97-be9f-687b41d2dfc5	2025-09-28 12:16:03.501192+03	t	2025-09-28 12:16:08.679623+03
20	LOGIN	ZVM19I	2025-09-24 11:29:15.475236+03	e6ab4066-d1d8-4290-a64b-459a02e75315	2025-09-24 11:24:15.019989+03	t	2025-09-24 11:24:15.9192+03
21	CREATE_ACCOUNT	INVALID	\N	4535dbf2-1b63-4e23-970f-efcdc09ddbd9	2025-09-24 11:24:26.226014+03	f	2025-09-24 11:24:26.226021+03
35	CREATE_ACCOUNT	INVALID	\N	57b8550c-dfaf-4570-b3d9-82363e43ecab	2025-09-28 12:17:18.685541+03	f	2025-09-28 12:17:18.685548+03
22	LOGIN	M7HN4W	2025-09-24 11:29:26.67057+03	4535dbf2-1b63-4e23-970f-efcdc09ddbd9	2025-09-24 11:24:26.226029+03	t	2025-09-24 11:24:27.117364+03
23	CREATE_ACCOUNT	INVALID	\N	eb626f79-4fd4-49ed-a770-514d5b871087	2025-09-24 11:26:05.92115+03	f	2025-09-24 11:26:05.921157+03
24	LOGIN	PAHCY6	2025-09-24 11:31:06.371259+03	eb626f79-4fd4-49ed-a770-514d5b871087	2025-09-24 11:26:05.921165+03	t	2025-09-24 11:26:06.816052+03
25	CREATE_ACCOUNT	INVALID	\N	f137fd7c-fc2a-4a60-8fbe-dc4752824e43	2025-09-24 11:44:29.97289+03	f	2025-09-24 11:44:29.9729+03
26	LOGIN	UL8IX0	2025-09-24 11:49:30.428094+03	f137fd7c-fc2a-4a60-8fbe-dc4752824e43	2025-09-24 11:44:29.972908+03	t	2025-09-24 11:44:30.983137+03
27	CREATE_ACCOUNT	INVALID	\N	6ab819f5-1763-4d7a-9ef4-8f21fc69b922	2025-09-24 11:44:41.222805+03	f	2025-09-24 11:44:41.222812+03
36	LOGIN	T9RS0T	2025-09-28 12:22:21.161299+03	57b8550c-dfaf-4570-b3d9-82363e43ecab	2025-09-28 12:17:18.685557+03	t	2025-09-28 12:17:23.636395+03
28	LOGIN	KY7N2W	2025-09-24 11:49:41.670798+03	6ab819f5-1763-4d7a-9ef4-8f21fc69b922	2025-09-24 11:44:41.22282+03	t	2025-09-24 11:44:42.115968+03
29	CREATE_ACCOUNT	INVALID	\N	8291a3c5-e933-4801-b6e7-b859e47493fd	2025-09-24 11:45:52.854218+03	f	2025-09-24 11:45:52.854225+03
37	CREATE_ACCOUNT	INVALID	\N	1e6925b1-7bab-4cb4-b31d-3f0dcbf18229	2025-09-28 12:27:43.227532+03	f	2025-09-28 12:27:43.22754+03
30	LOGIN	J5O4ST	2025-09-24 11:50:53.302942+03	8291a3c5-e933-4801-b6e7-b859e47493fd	2025-09-24 11:45:52.854234+03	t	2025-09-24 11:45:53.751131+03
31	CREATE_ACCOUNT	INVALID	\N	9a1e8504-228f-43a8-8ea6-081befd7f2d7	2025-09-25 09:40:14.477704+03	f	2025-09-25 09:40:14.477711+03
43	LOGIN	EP939K	2025-10-10 10:43:53.077065+03	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698	2025-10-10 10:38:53.047749+03	t	2025-10-10 10:38:55.57763+03
38	LOGIN	08K9FN	2025-09-28 12:32:45.699342+03	1e6925b1-7bab-4cb4-b31d-3f0dcbf18229	2025-09-28 12:27:43.227548+03	t	2025-09-28 12:27:48.19091+03
39	CREATE_ACCOUNT	INVALID	\N	f358d3bc-ba14-439b-ac4d-eb402ddb9ae7	2025-10-02 14:04:58.263787+03	f	2025-10-02 14:04:58.263795+03
44	CREATE_ACCOUNT	INVALID	\N	3dc28354-5326-4acb-b194-d2da11fd51c0	2025-10-11 01:58:32.058318+03	f	2025-10-11 01:58:32.058326+03
41	CREATE_ACCOUNT	INVALID	\N	06925957-1b8f-4bda-ae78-b5c777627bac	2025-10-06 19:41:05.032822+03	f	2025-10-06 19:41:05.032833+03
40	LOGIN	6ETWMS	2025-10-02 14:28:32.51567+03	f358d3bc-ba14-439b-ac4d-eb402ddb9ae7	2025-10-02 14:04:58.263803+03	t	2025-10-02 14:23:35.236146+03
\.


--
-- Data for Name: app_policyextension; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_policyextension (id, date_created, date_updated, is_active, policy_number, customer_name, customer_phone, customer_email, product_name, initial_premium_paid, initial_start_date, initial_expiry_date, balance_amount, extension_status, reminder_count, last_reminder_sent, extension_payment_date, extension_amount_paid, full_certificate_issued, final_expiry_date, auto_reminder_enabled, underwriter_id) FROM stdin;
\.


--
-- Data for Name: app_psvpllprice; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_psvpllprice (id, date_created, date_updated, is_active, vehicle_type, pll_rate_per_person, effective_from, effective_to, underwriter_id) FROM stdin;
27d55d88-5501-47d1-9d8e-e2c334929fb4	2025-09-23 17:54:14.754699+03	2025-09-23 19:22:13.864595+03	t	STANDARD	500.00	2025-09-23	\N	acff5e40-a95b-4dd1-bc06-8e210e1e95bc
79fe0fab-5b23-4dc6-beeb-16aa9c067f6c	2025-09-23 17:54:14.756919+03	2025-09-23 19:22:13.866411+03	t	INSTITUTIONAL	250.00	2025-09-23	\N	acff5e40-a95b-4dd1-bc06-8e210e1e95bc
\.


--
-- Data for Name: app_psvpllpricing; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_psvpllpricing (id, date_created, date_updated, is_active, pll_amount, rate_per_person, is_commercial_institutional, effective_from, effective_to, subcategory_id, underwriter_id) FROM stdin;
\.


--
-- Data for Name: app_publicuserprofile; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_publicuserprofile (id, date_created, date_updated, is_active, idnum, full_names, dob, physical_address, gender, is_email_verified, is_phone_verified, registration_number, user_id) FROM stdin;
bedeb8a3-214d-49c7-ae27-ea1ae5417af2	2025-09-23 19:27:28.249304+03	2025-09-23 19:27:28.249318+03	t	\N	Test User	\N	\N	\N	f	f	P1580829700	2e85b1cf-3231-46a8-9678-4a103673e5da
4193c776-0a00-4519-b7f6-fbee0cfc707a	2025-09-23 20:01:52.723173+03	2025-09-23 20:01:52.723186+03	t	\N	Test User	\N	\N	\N	f	f	P9029878924	21955367-50e9-443d-8cb9-8690d1d64ca1
f340d8d0-c0bc-477e-a2a7-cf899426ca8c	2025-09-23 20:07:33.309916+03	2025-09-23 20:07:33.30993+03	t	\N	Test User	\N	\N	\N	f	f	P2844020989	0bc91409-d27a-47fb-9024-468efd3a88bf
f308df2d-d9bc-4914-a4ad-b0daa995e62d	2025-09-23 20:10:52.591749+03	2025-09-23 20:10:52.591762+03	t	\N	Test User	\N	\N	\N	f	f	P6717628822	fb39b3bd-a2e1-4a1e-b943-936173ed8e0a
0c3e59c6-e01f-4421-ba43-23af3f636e2e	2025-09-23 20:15:44.583138+03	2025-09-23 20:15:44.583153+03	t	\N	Test User	\N	\N	\N	f	f	P1925846569	a0bfc0a4-8f28-437d-954f-37d2dec58c63
8d8a3aee-0095-4037-b161-c85390544bae	2025-09-23 22:32:00.7826+03	2025-09-23 22:32:00.782614+03	t	\N	Test User	\N	\N	\N	f	f	P0309322581	6e17c37a-4d51-4aa7-9f21-3172dbbda0b0
70361cb0-d8fe-42d0-924f-5522d4635ab7	2025-09-24 11:20:00.906743+03	2025-09-24 11:20:00.906756+03	t	\N	Test User	\N	\N	\N	f	f	P6989229210	30ab6ca1-87cf-4e4c-a049-28d3dab3c779
3d2d8232-8feb-4c95-8cb1-3ae3363c2cdc	2025-09-24 11:20:30.376483+03	2025-09-24 11:20:30.376493+03	t	\N	Test User	\N	\N	\N	f	f	P4075854297	f74384a9-9c2c-4baa-8f3c-304361adb10a
bee93aa6-efe9-49f6-b80a-da094a4883cd	2025-09-24 11:24:15.019061+03	2025-09-24 11:24:15.019074+03	t	\N	Test User	\N	\N	\N	f	f	P2891542183	e6ab4066-d1d8-4290-a64b-459a02e75315
f78fdaf3-e6c6-49a3-b981-0b6f5db146fd	2025-09-24 11:24:26.225499+03	2025-09-24 11:24:26.225508+03	t	\N	Test User	\N	\N	\N	f	f	P1787528312	4535dbf2-1b63-4e23-970f-efcdc09ddbd9
e88c95cf-3f2a-40b4-86f5-52a1b1004470	2025-09-24 11:26:05.920601+03	2025-09-24 11:26:05.92061+03	t	\N	Test User	\N	\N	\N	f	f	P3647811628	eb626f79-4fd4-49ed-a770-514d5b871087
0e31eab5-404d-42c5-9582-62aa5856c359	2025-09-24 11:44:29.971191+03	2025-09-24 11:44:29.971201+03	t	\N	Test User	\N	\N	\N	f	f	P1033394430	f137fd7c-fc2a-4a60-8fbe-dc4752824e43
05e6e1bb-0379-461a-b978-b1092a7a307a	2025-09-24 11:44:41.222265+03	2025-09-24 11:44:41.222273+03	t	\N	Test User	\N	\N	\N	f	f	P5724496201	6ab819f5-1763-4d7a-9ef4-8f21fc69b922
f246b2c7-4cd1-4a1e-a87b-24bd92b5493b	2025-09-24 11:45:52.853655+03	2025-09-24 11:45:52.853665+03	t	\N	Test User	\N	\N	\N	f	f	P1562179132	8291a3c5-e933-4801-b6e7-b859e47493fd
12e278c5-85a8-4a8c-b5d9-e014558330d8	2025-09-25 09:40:14.476034+03	2025-09-25 09:40:14.476044+03	t	\N	Test User	\N	\N	\N	f	f	P8736026337	9a1e8504-228f-43a8-8ea6-081befd7f2d7
268d9698-d7a0-43c4-a0fb-784adb03c3f5	2025-09-28 12:16:03.499823+03	2025-09-28 12:16:03.499837+03	t	\N	Test User	\N	\N	\N	f	f	P9793195367	706681c2-a083-4a97-be9f-687b41d2dfc5
35ca4e00-75d1-49d5-85d2-2249678f6ed9	2025-09-28 12:17:18.684736+03	2025-09-28 12:17:18.684747+03	t	\N	Test User	\N	\N	\N	f	f	P3831865732	57b8550c-dfaf-4570-b3d9-82363e43ecab
e1cd0fbb-ad63-41df-b726-8790f03c4ec4	2025-09-28 12:27:43.226917+03	2025-09-28 12:27:43.226928+03	t	\N	Test User	\N	\N	\N	f	f	P4820912925	1e6925b1-7bab-4cb4-b31d-3f0dcbf18229
\.


--
-- Data for Name: app_serviceprocessinglog; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_serviceprocessinglog (id, date_created, date_updated, is_active, service_type, request_data, response_data, processing_time, success, error_message, quotation_id) FROM stdin;
\.


--
-- Data for Name: app_staffuserprofile; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_staffuserprofile (id, date_created, date_updated, is_active, idnum, full_names, dob, physical_address, gender, is_email_verified, is_phone_verified, agent_code, agent_prefix, user_id) FROM stdin;
3f8acd94-dcf0-4fe9-bbc6-23f1af24a52f	2025-09-24 09:57:30.305553+03	2025-09-24 09:57:30.305569+03	t	\N	Kelvin KK	\N	\N	\N	f	f	17774	AGT	95069092-9673-4c6b-a137-19a3f6131272
ecaafa9e-8f0d-43bc-896b-2a23bb6604b0	2025-10-02 14:04:58.262445+03	2025-10-02 14:04:58.262456+03	t	\N	Mark Kamau	\N	\N	\N	f	f	36464	AGT	f358d3bc-ba14-439b-ac4d-eb402ddb9ae7
c187f36c-d73e-4ee5-b2bf-cb16f9bb889b	2025-10-06 19:41:05.029026+03	2025-10-06 19:41:05.029039+03	t	\N	Nelson Omwani	\N	\N	\N	f	f	86850	AGT	06925957-1b8f-4bda-ae78-b5c777627bac
6ee20c61-ec9a-410a-a065-f439e6c4e091	2025-10-11 01:58:32.057127+03	2025-10-11 01:58:32.057139+03	t	\N	Kipchoge	\N	\N	\N	f	f	32218	AGT	3dc28354-5326-4acb-b194-d2da11fd51c0
\.


--
-- Data for Name: app_user; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_user (password, last_login, id, date_created, date_updated, is_active, email, phonenumber, role, nationality, country_code, is_admin, is_staff, created_by, is_default_password) FROM stdin;
pbkdf2_sha256$600000$Wh2eZBK68M0rVVjtjkIDTY$K/6Msq/x8h62gDSKgbxqlSfLoP51sidywWbEak5lhzs=	\N	21955367-50e9-443d-8cb9-8690d1d64ca1	2025-09-23 20:01:52.697789+03	2025-09-23 20:01:52.697803+03	t	test731993063@example.com	731993063	CUSTOMER	KENYAN	+254	f	f	SYSTEM	f
pbkdf2_sha256$600000$tagCJxQWRVLQ1JaXw9gOcf$xE+JYSPoBFsdusnscVsdxHYvmIXEySymCyzEs8cJ1dw=	\N	0bc91409-d27a-47fb-9024-468efd3a88bf	2025-09-23 20:07:33.305897+03	2025-09-23 20:07:33.305916+03	t	test750997861@example.com	750997861	CUSTOMER	KENYAN	+254	f	f	SYSTEM	f
pbkdf2_sha256$600000$4Gq6f0ZnCKYfVFgsCeA7Uz$cTq2lQO7hD8yQcWA+5ywm0ebYsKcZKbO0oN0TR5J46w=	\N	fb39b3bd-a2e1-4a1e-b943-936173ed8e0a	2025-09-23 20:10:52.587016+03	2025-09-23 20:10:52.58703+03	t	test776037404@example.com	776037404	CUSTOMER	KENYAN	+254	f	f	SYSTEM	f
pbkdf2_sha256$600000$5FvqCNVIpfDRLcjtepoalD$dXAT4ci/Qqg2QDFpKa1o91IWXn+jpqu5fBCKSh9pbMQ=	\N	a0bfc0a4-8f28-437d-954f-37d2dec58c63	2025-09-23 20:15:44.579084+03	2025-09-23 20:15:44.579098+03	t	test727734287@example.com	727734287	CUSTOMER	KENYAN	+254	f	f	SYSTEM	f
pbkdf2_sha256$600000$eTFiN1ktdY8io7sICZNDPR$RsB2zVvvg6AqbwMNaIgKMXcVLOKukvGCBlkfslFd7fA=	\N	3dc28354-5326-4acb-b194-d2da11fd51c0	2025-10-11 01:58:32.043922+03	2025-10-11 01:58:32.043934+03	t	kip@gmail.com	123456789	AGENT	KENYAN	+254	f	f	SYSTEM	f
pbkdf2_sha256$600000$yxgO6hcH7NT9Q3ldUH9YVz$I+5Ga25cmwLfIwXSrBqbxDJfs0LpOPZPT2Mammkok84=	\N	f358d3bc-ba14-439b-ac4d-eb402ddb9ae7	2025-10-02 14:04:58.245022+03	2025-10-02 14:04:58.245075+03	t	kamau@gmail.com	079286554	AGENT	KENYAN	+254	f	f	SYSTEM	f
pbkdf2_sha256$600000$cT5PJUMq4WhdYYrZ1ujJS5$BFzWZULmjpmdku5Nj7jEedeL+yrFRT5VOw4qNjOikqI=	\N	6e17c37a-4d51-4aa7-9f21-3172dbbda0b0	2025-09-23 22:32:00.770887+03	2025-09-23 22:32:00.770899+03	t		759384276	CUSTOMER	KENYAN	+254	f	f	SYSTEM	f
pbkdf2_sha256$600000$TBBjvHyLtAEJfUWeAiPvNy$4DC8tTeBOwUOHN6aG2WiRinEuW2Iq5VW5YPNzLjZ83M=	\N	06925957-1b8f-4bda-ae78-b5c777627bac	2025-10-06 19:41:04.991185+03	2025-10-06 19:41:04.991199+03	t	nelson@gmail.com	792865542	AGENT	KENYAN	+254	f	f	SYSTEM	f
pbkdf2_sha256$600000$s4v7RKWZr0wjRnATNfiyZ6$IMrPf3bbPo08jI+g9oK5THLEG+eMyEuCAdZ5oMIUbgU=	\N	30ab6ca1-87cf-4e4c-a049-28d3dab3c779	2025-09-24 11:20:00.872099+03	2025-09-24 11:20:00.872116+03	t	test711535924@example.com	711535924	CUSTOMER	KENYAN	+254	f	f	SYSTEM	f
pbkdf2_sha256$600000$flxwmq4GBmBNjTS61q0r3S$ZvFo9FPgz63R3QFBSeSqruaHwKNdRQWx7TfKJkKmSU4=	\N	f74384a9-9c2c-4baa-8f3c-304361adb10a	2025-09-24 11:20:30.373577+03	2025-09-24 11:20:30.37359+03	t	test736539912@example.com	736539912	CUSTOMER	KENYAN	+254	f	f	SYSTEM	f
pbkdf2_sha256$600000$OZD0q4KJoyTQ61Y5V5s7IX$YxFCXOoSfOY+QI7t3n94P/SbKPxuENtBb6M5zApgaZw=	\N	e6ab4066-d1d8-4290-a64b-459a02e75315	2025-09-24 11:24:15.010732+03	2025-09-24 11:24:15.010745+03	t	test716806467@example.com	716806467	CUSTOMER	KENYAN	+254	f	f	SYSTEM	f
pbkdf2_sha256$600000$iTUEFduOhMZn40PlWLDJwD$SwWz21jH/CGGP2inWzqRU5/L93A90jqOCZH9aqSDuPw=	\N	4535dbf2-1b63-4e23-970f-efcdc09ddbd9	2025-09-24 11:24:26.222651+03	2025-09-24 11:24:26.222663+03	t	test778501849@example.com	778501849	CUSTOMER	KENYAN	+254	f	f	SYSTEM	f
pbkdf2_sha256$600000$hENORZjnUk9fPkdzFEo5Af$BwitQAP6ps2tUhl7B4SkRSs0DlVDUVScA4WUAQvPAw4=	\N	eb626f79-4fd4-49ed-a770-514d5b871087	2025-09-24 11:26:05.914428+03	2025-09-24 11:26:05.91444+03	t	test788653005@example.com	788653005	CUSTOMER	KENYAN	+254	f	f	SYSTEM	f
pbkdf2_sha256$600000$qiwcwwhphjcixxyd0acqQ8$8TJsAeIjxBPIBTXxC40fRaFs8fuM209dFdWDKz3qI3I=	\N	f137fd7c-fc2a-4a60-8fbe-dc4752824e43	2025-09-24 11:44:29.958762+03	2025-09-24 11:44:29.958798+03	t	test747817930@example.com	747817930	CUSTOMER	KENYAN	+254	f	f	SYSTEM	f
pbkdf2_sha256$600000$9sl5NVOt3C3lqfAkDNibUE$ro/khs+Hd/NtWXUgQP2lZcHAg5bGAl7v+KfVOsNxW18=	\N	6ab819f5-1763-4d7a-9ef4-8f21fc69b922	2025-09-24 11:44:41.219438+03	2025-09-24 11:44:41.219451+03	t	test728732717@example.com	728732717	CUSTOMER	KENYAN	+254	f	f	SYSTEM	f
pbkdf2_sha256$600000$OLv6n1jVheIUHNknOznxmx$B37y6du2l9lrAEk4l1PqwzjBE8XxntJsT2bFgzbFzfs=	\N	8291a3c5-e933-4801-b6e7-b859e47493fd	2025-09-24 11:45:52.849746+03	2025-09-24 11:45:52.849759+03	t	test724967463@example.com	724967463	CUSTOMER	KENYAN	+254	f	f	SYSTEM	f
pbkdf2_sha256$600000$RjWqgpGMhWv0vpq7J2FdHg$43LFLtd2n7JNcLcFRCA7tqvNnY6olIsBjApaU9H+asQ=	\N	9a1e8504-228f-43a8-8ea6-081befd7f2d7	2025-09-25 09:40:14.457527+03	2025-09-25 09:40:14.457541+03	t	test799468940@example.com	799468940	CUSTOMER	KENYAN	+254	f	f	SYSTEM	f
pbkdf2_sha256$600000$3A7IGnUCI71Nti0xyv74VE$N1jUz34KFIGpzwqj2hzFr//IkfRCO+qYf5WuF22npVo=	2025-09-23 22:36:48.930626+03	7ba7e7cd-31c9-46a1-8e9a-3ffe8b223cec	2025-09-23 22:11:56.777562+03	2025-09-25 22:38:52.700709+03	t	\N	792865541	CUSTOMER	KENYAN	+254	t	t	SYSTEM	f
pbkdf2_sha256$600000$uIrP792WRKruX4Zu23xc9M$lzmjzXP74vpOZg6tTwZLeTO58HjaudS4/V1UCWLjBlk=	2025-09-29 11:10:23.089378+03	2e85b1cf-3231-46a8-9678-4a103673e5da	2025-09-23 19:27:28.225999+03	2025-10-11 09:35:42.051259+03	t	\N	712345678	AGENT	KENYAN	+254	t	t	SYSTEM	f
pbkdf2_sha256$600000$yCnO8rvtkXA81CRTdVB7NY$6imTFaVl+hwBcH3jybS0RzF3jBzbSRX9HohA/YXFPCw=	\N	95069092-9673-4c6b-a137-19a3f6131272	2025-09-24 09:57:30.271297+03	2025-10-15 00:55:32.495758+03	t	kevin@gmail.com	792865547	AGENT	KENYAN	+254	f	f	SYSTEM	f
pbkdf2_sha256$600000$49IO7NOjQYFBE8gcW3qQSB$eR/hd1t8yBQJu8NeBVmHTErOaUrKCnlyD0pe8NiLEtc=	\N	706681c2-a083-4a97-be9f-687b41d2dfc5	2025-09-28 12:16:03.472509+03	2025-09-28 12:16:03.472527+03	t	test776914706@example.com	776914706	CUSTOMER	KENYAN	+254	f	f	SYSTEM	f
pbkdf2_sha256$600000$5LkxKAGPZak3vbNhAnLXwU$ivT+NrxZ6wxxGEIhJ5AvS6VEXIR1dV9Di39UzR4oppw=	\N	57b8550c-dfaf-4570-b3d9-82363e43ecab	2025-09-28 12:17:18.681615+03	2025-09-28 12:17:18.681629+03	t	test761138501@example.com	761138501	CUSTOMER	KENYAN	+254	f	f	SYSTEM	f
pbkdf2_sha256$600000$KV52Yon9VvvWUxZ6wrPFDr$96hyXVD1tdPh1p/iXxofY9vNoS//byfPnRMLQvnTtAA=	\N	1e6925b1-7bab-4cb4-b31d-3f0dcbf18229	2025-09-28 12:27:43.21495+03	2025-09-28 12:27:43.214965+03	t	test761133308@example.com	761133308	CUSTOMER	KENYAN	+254	f	f	SYSTEM	f
pbkdf2_sha256$600000$BjzhWQg4HUC140JO5XnYew$C5+I9eJnekGni5eOSc0Bw39fPM9AjaCUdmCzoc+GuDE=	2025-10-10 12:32:41.47087+03	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698	2025-10-10 10:38:50.039215+03	2025-10-10 10:38:50.531743+03	t	admin@patabima.com	700000000	ADMIN	KENYAN	+254	t	t	SYSTEM	f
\.


--
-- Data for Name: app_vehicleadjustmentfactor; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.app_vehicleadjustmentfactor (id, date_created, date_updated, is_active, description, factor_type, factor_key, factor_value) FROM stdin;
ccc347d5-4bff-4638-a396-e0c3e0856797	2025-09-23 17:54:14.782137+03	2025-09-23 19:22:13.907048+03	t	Vehicle age band	legacy	AGE_13_30	1.0000
58e12b07-013f-4f1b-b861-e93448d7d466	2025-09-23 17:54:14.780725+03	2025-09-23 19:22:13.905329+03	t	Vehicle age band	legacy	AGE_8_12	1.0000
108e9a67-7357-4518-bc57-8608d3e31e67	2025-09-23 17:54:14.779031+03	2025-09-23 19:22:13.903941+03	t	Vehicle age band	legacy	AGE_4_7	1.0000
dcff9fa4-ef89-4b0a-8acd-835a0a731bdb	2025-09-23 17:54:14.776597+03	2025-09-23 19:22:13.902331+03	t	Vehicle age band	legacy	AGE_0_3	1.0000
\.


--
-- Data for Name: auth_group; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.auth_group (id, name) FROM stdin;
\.


--
-- Data for Name: auth_group_permissions; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.auth_group_permissions (id, group_id, permission_id) FROM stdin;
\.


--
-- Data for Name: auth_permission; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.auth_permission (id, name, content_type_id, codename) FROM stdin;
1	Can add log entry	1	add_logentry
2	Can change log entry	1	change_logentry
3	Can delete log entry	1	delete_logentry
4	Can view log entry	1	view_logentry
5	Can add permission	2	add_permission
6	Can change permission	2	change_permission
7	Can delete permission	2	delete_permission
8	Can view permission	2	view_permission
9	Can add group	3	add_group
10	Can change group	3	change_group
11	Can delete group	3	delete_group
12	Can view group	3	view_group
13	Can add content type	4	add_contenttype
14	Can change content type	4	change_contenttype
15	Can delete content type	4	delete_contenttype
16	Can view content type	4	view_contenttype
17	Can add session	5	add_session
18	Can change session	5	change_session
19	Can delete session	5	delete_session
20	Can view session	5	view_session
21	Can add user	6	add_user
22	Can change user	6	change_user
23	Can delete user	6	delete_user
24	Can view user	6	view_user
25	Can add messages models	7	add_messagesmodels
26	Can change messages models	7	change_messagesmodels
27	Can delete messages models	7	delete_messagesmodels
28	Can view messages models	7	view_messagesmodels
29	Can add otp model	8	add_otpmodel
30	Can change otp model	8	change_otpmodel
31	Can delete otp model	8	delete_otpmodel
32	Can view otp model	8	view_otpmodel
33	Can add staff user profile	9	add_staffuserprofile
34	Can change staff user profile	9	change_staffuserprofile
35	Can delete staff user profile	9	delete_staffuserprofile
36	Can view staff user profile	9	view_staffuserprofile
37	Can add public user profile	10	add_publicuserprofile
38	Can change public user profile	10	change_publicuserprofile
39	Can delete public user profile	10	delete_publicuserprofile
40	Can view public user profile	10	view_publicuserprofile
41	Can add insurance quotation	11	add_insurancequotation
42	Can change insurance quotation	11	change_insurancequotation
43	Can delete insurance quotation	11	delete_insurancequotation
44	Can view insurance quotation	11	view_insurancequotation
45	Can add service processing log	12	add_serviceprocessinglog
46	Can change service processing log	12	change_serviceprocessinglog
47	Can delete service processing log	12	delete_serviceprocessinglog
48	Can view service processing log	12	view_serviceprocessinglog
49	Can add motor insurance details	13	add_motorinsurancedetails
50	Can change motor insurance details	13	change_motorinsurancedetails
51	Can delete motor insurance details	13	delete_motorinsurancedetails
52	Can view motor insurance details	13	view_motorinsurancedetails
53	Can add document upload	14	add_documentupload
54	Can change document upload	14	change_documentupload
55	Can delete document upload	14	delete_documentupload
56	Can view document upload	14	view_documentupload
57	Can add insurance provider	15	add_insuranceprovider
58	Can change insurance provider	15	change_insuranceprovider
59	Can delete insurance provider	15	delete_insuranceprovider
60	Can view insurance provider	15	view_insuranceprovider
61	Can add motor category	16	add_motorcategory
62	Can change motor category	16	change_motorcategory
63	Can delete motor category	16	delete_motorcategory
64	Can view motor category	16	view_motorcategory
65	Can add vehicle adjustment factor	17	add_vehicleadjustmentfactor
66	Can change vehicle adjustment factor	17	change_vehicleadjustmentfactor
67	Can delete vehicle adjustment factor	17	delete_vehicleadjustmentfactor
68	Can view vehicle adjustment factor	17	view_vehicleadjustmentfactor
69	Can add psvpll price	18	add_psvpllprice
70	Can change psvpll price	18	change_psvpllprice
71	Can delete psvpll price	18	delete_psvpllprice
72	Can view psvpll price	18	view_psvpllprice
73	Can add motor subcategory	19	add_motorsubcategory
74	Can change motor subcategory	19	change_motorsubcategory
75	Can delete motor subcategory	19	delete_motorsubcategory
76	Can view motor subcategory	19	view_motorsubcategory
77	Can add motor pricing	20	add_motorpricing
78	Can change motor pricing	20	change_motorpricing
79	Can delete motor pricing	20	delete_motorpricing
80	Can view motor pricing	20	view_motorpricing
81	Can add commercial tonnage pricing	21	add_commercialtonnagepricing
82	Can change commercial tonnage pricing	21	change_commercialtonnagepricing
83	Can delete commercial tonnage pricing	21	delete_commercialtonnagepricing
84	Can view commercial tonnage pricing	21	view_commercialtonnagepricing
85	Can add additional field pricing	22	add_additionalfieldpricing
86	Can change additional field pricing	22	change_additionalfieldpricing
87	Can delete additional field pricing	22	delete_additionalfieldpricing
88	Can view additional field pricing	22	view_additionalfieldpricing
89	Can add Policy Extension	23	add_policyextension
90	Can change Policy Extension	23	change_policyextension
91	Can delete Policy Extension	23	delete_policyextension
92	Can view Policy Extension	23	view_policyextension
93	Can add Extension Reminder	24	add_extensionreminder
94	Can change Extension Reminder	24	change_extensionreminder
95	Can delete Extension Reminder	24	delete_extensionreminder
96	Can view Extension Reminder	24	view_extensionreminder
97	Can add Extendible Pricing	25	add_extendiblepricing
98	Can change Extendible Pricing	25	change_extendiblepricing
99	Can delete Extendible Pricing	25	delete_extendiblepricing
100	Can view Extendible Pricing	25	view_extendiblepricing
101	Can add Campaign	26	add_campaign
102	Can change Campaign	26	change_campaign
103	Can delete Campaign	26	delete_campaign
104	Can view Campaign	26	view_campaign
105	Can add campaign interaction	27	add_campaigninteraction
106	Can change campaign interaction	27	change_campaigninteraction
107	Can delete campaign interaction	27	delete_campaigninteraction
108	Can view campaign interaction	27	view_campaigninteraction
109	Can add campaign schedule	28	add_campaignschedule
110	Can change campaign schedule	28	change_campaignschedule
111	Can delete campaign schedule	28	delete_campaignschedule
112	Can view campaign schedule	28	view_campaignschedule
113	Can add Motor Cover Type	29	add_motorcovertype
114	Can change Motor Cover Type	29	change_motorcovertype
115	Can delete Motor Cover Type	29	delete_motorcovertype
116	Can view Motor Cover Type	29	view_motorcovertype
117	Can add psvpll pricing	30	add_psvpllpricing
118	Can change psvpll pricing	30	change_psvpllpricing
119	Can delete psvpll pricing	30	delete_psvpllpricing
120	Can view psvpll pricing	30	view_psvpllpricing
121	Can add additional coverage	31	add_additionalcoverage
122	Can change additional coverage	31	change_additionalcoverage
123	Can delete additional coverage	31	delete_additionalcoverage
124	Can view additional coverage	31	view_additionalcoverage
125	Can add mandatory levy	32	add_mandatorylevy
126	Can change mandatory levy	32	change_mandatorylevy
127	Can delete mandatory levy	32	delete_mandatorylevy
128	Can view mandatory levy	32	view_mandatorylevy
129	Can add underwriter	33	add_underwriter
130	Can change underwriter	33	change_underwriter
131	Can delete underwriter	33	delete_underwriter
132	Can view underwriter	33	view_underwriter
133	Can add Motor Policy	34	add_motorpolicy
134	Can change Motor Policy	34	change_motorpolicy
135	Can delete Motor Policy	34	delete_motorpolicy
136	Can view Motor Policy	34	view_motorpolicy
137	Can add claim document	35	add_claimdocument
138	Can change claim document	35	change_claimdocument
139	Can delete claim document	35	delete_claimdocument
140	Can view claim document	35	view_claimdocument
141	Can add claim	36	add_claim
142	Can change claim	36	change_claim
143	Can delete claim	36	delete_claim
144	Can view claim	36	view_claim
145	Can add Product Line	37	add_productline
146	Can change Product Line	37	change_productline
147	Can delete Product Line	37	delete_productline
148	Can view Product Line	37	view_productline
149	Can add Product Configuration	38	add_productconfiguration
150	Can change Product Configuration	38	change_productconfiguration
151	Can delete Product Configuration	38	delete_productconfiguration
152	Can view Product Configuration	38	view_productconfiguration
153	Can add generic quote	39	add_genericquote
154	Can change generic quote	39	change_genericquote
155	Can delete generic quote	39	delete_genericquote
156	Can view generic quote	39	view_genericquote
157	Can add generic policy	40	add_genericpolicy
158	Can change generic policy	40	change_genericpolicy
159	Can delete generic policy	40	delete_genericpolicy
160	Can view generic policy	40	view_genericpolicy
161	Can add manual quote	41	add_manualquote
162	Can change manual quote	41	change_manualquote
163	Can delete manual quote	41	delete_manualquote
164	Can view manual quote	41	view_manualquote
165	Can add Domestic Package quote	43	add_domesticpackagemanualquoteproxy
166	Can change Domestic Package quote	43	change_domesticpackagemanualquoteproxy
167	Can delete Domestic Package quote	43	delete_domesticpackagemanualquoteproxy
168	Can view Domestic Package quote	43	view_domesticpackagemanualquoteproxy
169	Can add Last Expense quote	44	add_lastexpensemanualquoteproxy
170	Can change Last Expense quote	44	change_lastexpensemanualquoteproxy
171	Can delete Last Expense quote	44	delete_lastexpensemanualquoteproxy
172	Can view Last Expense quote	44	view_lastexpensemanualquoteproxy
173	Can add Medical quote	42	add_medicalmanualquoteproxy
174	Can change Medical quote	42	change_medicalmanualquoteproxy
175	Can delete Medical quote	42	delete_medicalmanualquoteproxy
176	Can view Medical quote	42	view_medicalmanualquoteproxy
177	Can add Personal Accident quote	45	add_personalaccidentmanualquoteproxy
178	Can change Personal Accident quote	45	change_personalaccidentmanualquoteproxy
179	Can delete Personal Accident quote	45	delete_personalaccidentmanualquoteproxy
180	Can view Personal Accident quote	45	view_personalaccidentmanualquoteproxy
181	Can add Travel quote	46	add_travelmanualquoteproxy
182	Can change Travel quote	46	change_travelmanualquoteproxy
183	Can delete Travel quote	46	delete_travelmanualquoteproxy
184	Can view Travel quote	46	view_travelmanualquoteproxy
185	Can add WIBA quote	47	add_wibamanualquoteproxy
186	Can change WIBA quote	47	change_wibamanualquoteproxy
187	Can delete WIBA quote	47	delete_wibamanualquoteproxy
188	Can view WIBA quote	47	view_wibamanualquoteproxy
189	Can add Agent Performance	48	add_agentperformance
190	Can change Agent Performance	48	change_agentperformance
191	Can delete Agent Performance	48	delete_agentperformance
192	Can view Agent Performance	48	view_agentperformance
193	Can add Agent Commission	49	add_agentcommission
194	Can change Agent Commission	49	change_agentcommission
195	Can delete Agent Commission	49	delete_agentcommission
196	Can view Agent Commission	49	view_agentcommission
197	Can add Monthly Agent Bonus	50	add_monthlyagentbonus
198	Can change Monthly Agent Bonus	50	change_monthlyagentbonus
199	Can delete Monthly Agent Bonus	50	delete_monthlyagentbonus
200	Can view Monthly Agent Bonus	50	view_monthlyagentbonus
201	Can add Commission Settings	51	add_commissionsettings
202	Can change Commission Settings	51	change_commissionsettings
203	Can delete Commission Settings	51	delete_commissionsettings
204	Can view Commission Settings	51	view_commissionsettings
205	Can add Commission Rule	52	add_commissionrule
206	Can change Commission Rule	52	change_commissionrule
207	Can delete Commission Rule	52	delete_commissionrule
208	Can view Commission Rule	52	view_commissionrule
\.


--
-- Data for Name: django_admin_log; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.django_admin_log (id, action_time, object_id, object_repr, action_flag, change_message, content_type_id, user_id) FROM stdin;
1	2025-09-23 22:14:48.893573+03	155e4474-a112-4231-b2b4-29e7f0a675e4	Monarch	1	[{"added": {}}]	15	7ba7e7cd-31c9-46a1-8e9a-3ffe8b223cec
2	2025-09-23 22:15:14.924775+03	d4ee8d63-363f-40e1-a5fc-41748a26ef42	Public Service Vehicles	2	[]	16	7ba7e7cd-31c9-46a1-8e9a-3ffe8b223cec
3	2025-09-23 22:17:32.858888+03	10a2d701-0fb7-4b1b-8ac8-9549032b8889	MotorPricing object (10a2d701-0fb7-4b1b-8ac8-9549032b8889)	1	[{"added": {}}]	20	7ba7e7cd-31c9-46a1-8e9a-3ffe8b223cec
4	2025-09-24 11:29:37.725808+03	771c566f-292a-49f1-97a9-19c2b967335e	Pata underwriter	1	[{"added": {}}]	15	7ba7e7cd-31c9-46a1-8e9a-3ffe8b223cec
5	2025-09-24 11:29:41.83036+03	771c566f-292a-49f1-97a9-19c2b967335e	Pata underwriter	2	[]	15	7ba7e7cd-31c9-46a1-8e9a-3ffe8b223cec
6	2025-09-28 13:42:54.126294+03	f583f370-35af-4c0e-bb13-b403667e8c64	AdditionalFieldPricing object (f583f370-35af-4c0e-bb13-b403667e8c64)	2	[]	22	2e85b1cf-3231-46a8-9678-4a103673e5da
7	2025-09-28 14:00:27.283378+03	02a099fd-e88b-4b61-8f64-0e3eb7ee173f	Private (PRIVATE)	2	[]	16	2e85b1cf-3231-46a8-9678-4a103673e5da
8	2025-09-28 15:55:46.849753+03	771c566f-292a-49f1-97a9-19c2b967335e	Patabima Inc	2	[{"changed": {"fields": ["Name", "Code"]}}]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
9	2025-09-28 16:06:42.29927+03	771c566f-292a-49f1-97a9-19c2b967335e	Patabima Inc	2	[{"changed": {"fields": ["Supported categories", "Supported payment methods", "Features"]}}]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
10	2025-09-28 16:07:14.263325+03	771c566f-292a-49f1-97a9-19c2b967335e	Patabima Inc	2	[{"changed": {"fields": ["Features"]}}]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
11	2025-09-28 16:23:54.011204+03	771c566f-292a-49f1-97a9-19c2b967335e	Patabima Inc	2	[]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
12	2025-09-28 16:42:12.764158+03	771c566f-292a-49f1-97a9-19c2b967335e	Patabima Inc	2	[]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
13	2025-09-28 17:14:20.586566+03	939d71ee-59ed-4f52-aa21-afcdcac0da8c	Private - Private Time On Risk - Patabima Inc - KSh 650.00	2	[{"changed": {"fields": ["Base premium"]}}]	20	2e85b1cf-3231-46a8-9678-4a103673e5da
14	2025-09-28 17:25:16.606683+03	771c566f-292a-49f1-97a9-19c2b967335e	PATABIMA INC	2	[{"changed": {"fields": ["Name"]}}]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
15	2025-09-28 18:03:45.024058+03	aa85d49e-06a2-40ec-9a22-e09b453f8066	Madison Insurance	2	[{"changed": {"fields": ["Features"]}}]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
16	2025-09-28 18:07:34.649654+03	939d71ee-59ed-4f52-aa21-afcdcac0da8c	Private - Private Time On Risk - PATABIMA INC - KSh 600.00	2	[{"changed": {"fields": ["Base premium", "Effective to"]}}]	20	2e85b1cf-3231-46a8-9678-4a103673e5da
17	2025-09-28 18:11:22.728259+03	939d71ee-59ed-4f52-aa21-afcdcac0da8c	Private - Private Third Party Extendible - PATABIMA INC - KSh 3500.00	2	[{"changed": {"fields": ["Subcategory", "Base premium", "Effective from", "Effective to"]}}]	20	2e85b1cf-3231-46a8-9678-4a103673e5da
18	2025-09-28 18:57:16.463102+03	aa85d49e-06a2-40ec-9a22-e09b453f8066	Madison Insurance	2	[]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
19	2025-09-28 18:58:14.801778+03	aa85d49e-06a2-40ec-9a22-e09b453f8066	Madison Insurance	2	[]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
20	2025-09-28 19:27:03.117174+03	aa85d49e-06a2-40ec-9a22-e09b453f8066	Madison Insurance	2	[]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
21	2025-09-28 19:28:01.240314+03	aa85d49e-06a2-40ec-9a22-e09b453f8066	Madison Insurance	2	[]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
22	2025-09-28 19:28:56.581099+03	aa85d49e-06a2-40ec-9a22-e09b453f8066	Madison Insurance	2	[]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
23	2025-09-28 23:10:44.576652+03	93e48481-d1e9-4e9b-8891-9d6a91d5062f	Private - Private Time On Risk - Madison Insurance - KSh 400	2	[{"changed": {"fields": ["Base premium"]}}]	20	2e85b1cf-3231-46a8-9678-4a103673e5da
24	2025-09-28 23:10:44.582734+03	88445284-3776-4303-85c7-cd9da750bd00	Motorcycle - Motorcycle Comprehensive - Madison Insurance - KSh 8000.00	2	[{"changed": {"fields": ["Base premium"]}}]	20	2e85b1cf-3231-46a8-9678-4a103673e5da
25	2025-09-28 23:10:44.585381+03	743609b5-886f-4ea1-9f29-c63dbd9d8564	Private - Private Time On Risk - PATABIMA INC - KSh 600	2	[{"changed": {"fields": ["Base premium"]}}]	20	2e85b1cf-3231-46a8-9678-4a103673e5da
26	2025-09-28 23:37:04.427404+03	fbd8b97b-c4bb-429a-9e5a-52745463b375	Private - Private Third Party - Madison Insurance - KSh 3000.00	2	[]	20	2e85b1cf-3231-46a8-9678-4a103673e5da
27	2025-09-28 23:37:39.479312+03	fbd8b97b-c4bb-429a-9e5a-52745463b375	Private - Private Third Party - Madison Insurance - KSh 1000.00	2	[{"changed": {"fields": ["Base premium"]}}]	20	2e85b1cf-3231-46a8-9678-4a103673e5da
28	2025-09-28 23:38:56.597725+03	fbd8b97b-c4bb-429a-9e5a-52745463b375	Private - Private Third Party - Madison Insurance - KSh 100.00	2	[{"changed": {"fields": ["Base premium"]}}]	20	2e85b1cf-3231-46a8-9678-4a103673e5da
29	2025-09-30 10:45:05.66324+03	aa85d49e-06a2-40ec-9a22-e09b453f8066	Madison Insurance	2	[{"changed": {"fields": ["Features"]}}]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
30	2025-09-30 13:17:19.193371+03	aa85d49e-06a2-40ec-9a22-e09b453f8066	Madison Insurance	2	[{"changed": {"fields": ["Features"]}}]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
31	2025-09-30 13:18:38.958989+03	aa85d49e-06a2-40ec-9a22-e09b453f8066	Madison Insurance	2	[{"changed": {"fields": ["Features"]}}]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
32	2025-09-30 13:19:05.996574+03	771c566f-292a-49f1-97a9-19c2b967335e	PATABIMA INC	2	[{"changed": {"fields": ["Features"]}}]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
33	2025-09-30 13:29:49.956833+03	771c566f-292a-49f1-97a9-19c2b967335e	PATABIMA INC	2	[{"changed": {"fields": ["Features"]}}]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
34	2025-09-30 13:43:00.949238+03	771c566f-292a-49f1-97a9-19c2b967335e	PATABIMA INC	2	[{"changed": {"fields": ["Supported categories"]}}]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
35	2025-09-30 13:43:56.415751+03	155e4474-a112-4231-b2b4-29e7f0a675e4	MONARCH	2	[{"changed": {"fields": ["Name", "Code"]}}]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
36	2025-10-08 09:53:39.39918+03	aa85d49e-06a2-40ec-9a22-e09b453f8066	Madison Insurance	2	[]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
37	2025-10-08 14:59:22.147406+03	aa85d49e-06a2-40ec-9a22-e09b453f8066	Madison Insurance	2	[{"changed": {"fields": ["Features"]}}]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
38	2025-10-08 15:00:12.551931+03	cb192689-b1f2-4afd-b08a-c2bc2e6cc864	UAP Insurance	2	[{"changed": {"fields": ["Supported categories"]}}]	15	2e85b1cf-3231-46a8-9678-4a103673e5da
39	2025-10-10 13:23:59.964922+03	cd3205bc-08b6-4a69-aef1-e3a17f1fc970	MNL-MEDICAL-7152250B (MEDICAL)	2	[{"changed": {"fields": ["Status"]}}]	42	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
40	2025-10-10 23:07:09.224501+03	4c9f1e6f-4150-414d-9050-c641a4cd5769	POL-2025-208149 - PENDING_PAYMENT	2	[]	34	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
41	2025-10-10 23:07:44.964308+03	4c9f1e6f-4150-414d-9050-c641a4cd5769	POL-2025-208149 - ACTIVE	2	[{"changed": {"fields": ["Status"]}}]	34	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
42	2025-10-10 23:07:58.209936+03	89cc0106-7b71-4972-8e23-59e5cdde834b	POL-2025-433825 - ACTIVE	2	[{"changed": {"fields": ["Status"]}}]	34	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
43	2025-10-10 23:08:31.073372+03	a38ff0bd-fd6a-48ad-b735-db6f133662e1	POL-2025-146066 - ACTIVE	2	[{"changed": {"fields": ["Status"]}}]	34	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
44	2025-10-10 23:33:28.339283+03	1	Commission Settings (Default 15.00%)	2	[]	51	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
45	2025-10-10 23:33:57.747549+03	1	Commission Settings (Default 0.5%)	2	[{"changed": {"fields": ["Default commission rate"]}}]	51	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
46	2025-10-10 23:34:06.403923+03	1	Commission Settings (Default 0.50%)	2	[]	51	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
47	2025-10-10 23:34:18.946976+03	2	Commission Settings (Default 4.00%)	1	[{"added": {}}]	51	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
48	2025-10-10 23:54:55.606674+03	2	Commission Settings (Default 4.00%)	2	[]	51	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
49	2025-10-10 23:54:57.603434+03	2	Commission Settings (Default 4.00%)	2	[]	51	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
50	2025-10-10 23:55:31.469776+03	59a9f6e4-f960-4341-a170-6093567dc6c2	kevin@gmail.com - KSh 96.45 (Policy: POL-2025-433825)	2	[]	49	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
51	2025-10-11 01:56:54.984337+03	59a9f6e4-f960-4341-a170-6093567dc6c2	kevin@gmail.com - KSh 64.30 (Policy: POL-2025-433825)	2	[{"changed": {"fields": ["Commission rate"]}}]	49	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
52	2025-10-11 01:57:19.942253+03	5b757fca-2964-4cb1-95ff-3c48fffaaa38	kevin@gmail.com - KSh 30.30 (Policy: POL-2025-208149)	2	[{"changed": {"fields": ["Commission rate"]}}]	49	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
53	2025-10-11 02:01:54.234423+03	89c8d92c-4958-40d7-b3ca-841ac64dbcc0	POL-2025-294874 - ACTIVE	2	[{"changed": {"fields": ["Status"]}}]	34	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
54	2025-10-15 00:55:32.506616+03	95069092-9673-4c6b-a137-19a3f6131272	95069092-9673-4c6b-a137-19a3f6131272	2	[{"changed": {"name": "manual quote", "object": "MNL-MEDICAL-CFF6C0C5 (MEDICAL)", "fields": ["Computed premium", "Status"]}}]	6	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
55	2025-10-15 20:06:21.343328+03	7031a680-8555-4edb-982c-2a32f7aea540	CREATIONS (ACTIVE)	1	[{"added": {}}]	26	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
56	2025-10-15 22:11:02.92875+03	bdf9b379-c1c6-40a1-baf9-5df6441902ac	Medical Campaign (DRAFT)	1	[{"added": {}}]	26	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
57	2025-10-15 22:11:16.825176+03	bdf9b379-c1c6-40a1-baf9-5df6441902ac	Medical Campaign (ACTIVE)	2	[{"changed": {"fields": ["Status"]}}]	26	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
58	2025-10-15 23:09:31.682629+03	7031a680-8555-4edb-982c-2a32f7aea540	CREATIONS (ACTIVE)	3		26	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
59	2025-10-15 23:22:16.178537+03	feca13b7-1ea2-4db2-a8e6-73d11283aed9	vehicle promo (ACTIVE)	1	[{"added": {}}]	26	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
60	2025-10-15 23:31:21.359081+03	3ac76fd0-dfb8-4263-a7ee-959362bd0cdf	Tour promo (ACTIVE)	1	[{"added": {}}]	26	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
61	2025-10-15 23:34:34.86073+03	feca13b7-1ea2-4db2-a8e6-73d11283aed9	vehicle promo (ACTIVE)	2	[{"changed": {"fields": ["Banner image"]}}]	26	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
62	2025-10-15 23:43:55.885107+03	f466680c-3af2-468a-baa6-6e030643c626	Professional campaign (DRAFT)	1	[{"added": {}}]	26	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
63	2025-10-15 23:44:16.28232+03	f466680c-3af2-468a-baa6-6e030643c626	Professional campaign (ACTIVE)	2	[{"changed": {"fields": ["Status"]}}]	26	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
64	2025-10-15 23:45:57.253923+03	bdf9b379-c1c6-40a1-baf9-5df6441902ac	Medical Campaign (ACTIVE)	2	[{"changed": {"fields": ["Banner image"]}}]	26	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
65	2025-10-15 23:53:06.212065+03	f466680c-3af2-468a-baa6-6e030643c626	Professional campaign (ACTIVE)	2	[{"changed": {"fields": ["Banner image"]}}]	26	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
66	2025-10-16 00:01:07.058923+03	59a9f6e4-f960-4341-a170-6093567dc6c2	kevin@gmail.com - KSh 128.60 (Policy: POL-2025-433825)	2	[{"changed": {"fields": ["Commission rate"]}}]	49	4d5b7b8d-d3fd-4cc8-915f-a362a35fc698
\.


--
-- Data for Name: django_content_type; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.django_content_type (id, app_label, model) FROM stdin;
1	admin	logentry
2	auth	permission
3	auth	group
4	contenttypes	contenttype
5	sessions	session
6	app	user
7	app	messagesmodels
8	app	otpmodel
9	app	staffuserprofile
10	app	publicuserprofile
11	app	insurancequotation
12	app	serviceprocessinglog
13	app	motorinsurancedetails
14	app	documentupload
15	app	insuranceprovider
16	app	motorcategory
17	app	vehicleadjustmentfactor
18	app	psvpllprice
19	app	motorsubcategory
20	app	motorpricing
21	app	commercialtonnagepricing
22	app	additionalfieldpricing
23	app	policyextension
24	app	extensionreminder
25	app	extendiblepricing
26	app	campaign
27	app	campaigninteraction
28	app	campaignschedule
29	app	motorcovertype
30	app	psvpllpricing
31	app	additionalcoverage
32	app	mandatorylevy
33	app	underwriter
34	app	motorpolicy
35	app	claimdocument
36	app	claim
37	app	productline
38	app	productconfiguration
39	app	genericquote
40	app	genericpolicy
41	app	manualquote
42	app	medicalmanualquoteproxy
43	app	domesticpackagemanualquoteproxy
44	app	lastexpensemanualquoteproxy
45	app	personalaccidentmanualquoteproxy
46	app	travelmanualquoteproxy
47	app	wibamanualquoteproxy
48	app	agentperformance
49	app	agentcommission
50	app	monthlyagentbonus
51	app	commissionsettings
52	app	commissionrule
\.


--
-- Data for Name: django_migrations; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.django_migrations (id, app, name, applied) FROM stdin;
1	contenttypes	0001_initial	2025-09-23 17:54:09.553388+03
2	app	0001_initial	2025-09-23 17:54:09.607846+03
6	app	0004_alter_user_phone_field	2025-09-23 17:54:09.656516+03
7	app	0005_auto_20250912_0432	2025-09-23 17:54:09.705686+03
8	app	0006_insurancequotation_serviceprocessinglog_and_more	2025-09-23 17:54:09.769231+03
9	app	0007_insuranceprovider_motorcategory_and_more	2025-09-23 17:54:09.904074+03
10	contenttypes	0002_remove_content_type_name	2025-09-23 17:54:09.924839+03
11	auth	0001_initial	2025-09-23 17:54:09.971507+03
12	auth	0002_alter_permission_name_max_length	2025-09-23 17:54:09.981501+03
13	auth	0003_alter_user_email_max_length	2025-09-23 17:54:09.986073+03
14	auth	0004_alter_user_username_opts	2025-09-23 17:54:09.990281+03
15	auth	0005_alter_user_last_login_null	2025-09-23 17:54:09.995766+03
16	auth	0006_require_contenttypes_0002	2025-09-23 17:54:09.997739+03
17	auth	0007_alter_validators_add_error_messages	2025-09-23 17:54:10.003481+03
18	auth	0008_alter_user_username_max_length	2025-09-23 17:54:10.009165+03
19	auth	0009_alter_user_last_name_max_length	2025-09-23 17:54:10.015635+03
20	auth	0010_alter_group_name_max_length	2025-09-23 17:54:10.027596+03
21	auth	0011_update_proxy_permissions	2025-09-23 17:54:10.043953+03
22	auth	0012_alter_user_first_name_max_length	2025-09-23 17:54:10.049134+03
23	sessions	0001_initial	2025-09-23 17:54:10.060536+03
24	admin	0001_initial	2025-09-23 21:47:45.24509+03
25	admin	0002_logentry_remove_auto_add	2025-09-23 21:47:45.256481+03
26	admin	0003_logentry_add_action_flag_choices	2025-09-23 21:47:45.263484+03
27	app	0008_motorsubcategory_extendible_variant_and_more	2025-09-23 22:03:55.370156+03
28	app	0009_campaign_campaignschedule_campaigninteraction	2025-09-23 23:43:43.005691+03
29	app	0010_motor_categories_enhancement	2025-09-26 16:35:59.670622+03
30	app	0010_add_pricing_model_and_rename_tonnage_fields	2025-09-28 13:24:27.14606+03
31	app	0011_merge_20250928_1324	2025-09-28 13:24:27.155534+03
32	app	0012_add_is_complex_to_motorsubcategory	2025-09-28 13:30:37.409782+03
33	app	0013_update_vehicle_adjustment_and_over_limit	2025-09-28 13:34:00.917834+03
34	app	0014_add_motorpricing_missing_fields	2025-09-28 13:45:32.671291+03
37	app	0015_create_psvpllpricing	2025-09-28 14:22:52.482795+03
38	app	0016_align_motorpricing_schema	2025-09-28 17:02:48.500971+03
39	app	0017_cleanup_motorpricing_legacy_columns	2025-09-28 17:11:17.672739+03
40	app	0018_insuranceprovider_code_unique_ci	2025-09-29 00:13:21.89978+03
41	app	0019_add_cover_type_ref_column	2025-09-29 01:29:48.490887+03
42	app	0020_fix_field_validations_default	2025-09-29 01:45:37.773414+03
43	app	0021_default_is_extendible_false	2025-09-29 01:48:11.198268+03
44	app	0022_seed_psv_subcategories	2025-09-29 03:05:54.508928+03
45	app	0023_seed_other_motor_subcategories	2025-09-29 03:12:30.231191+03
46	app	0024_public_flags_motor_subcategory	2025-09-29 10:03:47.414354+03
47	app	0025_populate_public_flags	2025-09-29 10:04:48.809423+03
48	app	0026_remove_cover_type_field_final	2025-09-29 12:37:57.581551+03
49	app	0027_additionalcoverage_mandatorylevy_underwriter_and_more	2025-09-30 17:40:41.559677+03
50	app	0028_docs_fields_only	2025-09-30 17:41:18.046789+03
51	app	0029_merge_20250930_1738	2025-09-30 17:41:33.728591+03
52	app	0030_alter_documentupload_processing_status_motorpolicy	2025-10-02 09:43:16.897048+03
53	app	0031_claim_claimdocument	2025-10-03 00:25:58.020344+03
54	app	0032_add_renewal_extension_fields	2025-10-05 18:47:10.830755+03
55	app	0033_productline_productconfiguration_genericquote_and_more	2025-10-05 20:25:47.570523+03
56	app	0034_seed_product_lines	2025-10-07 09:52:03.252538+03
57	app	0035_seed_product_configurations	2025-10-07 09:52:03.280625+03
58	app	0036_static_catalog_decouple	2025-10-07 10:09:56.174515+03
59	app	0037_remove_multiline_insurance	2025-10-07 11:50:05.995831+03
61	app	0038_manualquote	2025-10-10 09:33:58.650907+03
62	app	0039_remove_genericquote_agent_remove_genericquote_line_and_more	2025-10-10 09:57:57.468116+03
63	app	0040_manualquote_date_created_manualquote_date_updated_and_more	2025-10-10 10:01:31.302612+03
64	app	0041_domesticpackagemanualquoteproxy_and_more	2025-10-10 14:00:11.793765+03
65	app	0042_agentcommission_agentperformance	2025-10-10 14:00:40.551581+03
66	app	0043_monthlyagentbonus_and_more	2025-10-10 14:36:18.356164+03
67	app	0044_commissionsettings_and_more	2025-10-10 22:42:30.817085+03
68	app	0045_commissionrule	2025-10-10 23:50:27.872264+03
69	app	0046_add_display_mode_to_provider	2025-10-13 12:16:09.297961+03
70	app	0047_drop_motorcovertype_model	2025-10-15 01:23:30.061887+03
71	app	0048_campaign_banner_image	2025-10-15 16:03:23.630807+03
\.


--
-- Data for Name: django_session; Type: TABLE DATA; Schema: public; Owner: patabima_user
--

COPY public.django_session (session_key, session_data, expire_date) FROM stdin;
1h569te9s964aqjny7dq6c019yj2bv01	.eJxVzDkOwjAURdG9uCaWx9impGcNkf9EAiiRMlSIvUOkFFC_e95LdXVb-25beO4GUmeVoCZOSI23WJrQVttkLrXxIpzBOY-M6vTLoOKDx93SvY63SeM0rvMAek_0sS76OhE_L0f7d9DXpf9qRm5jW4SETASKxoGLzmcxXsAKkGRHxhoT2Flkn4Jhtq5gCAAlV_X-AI9FQlY:1v18oi:QutRy062cuqNuC1BT-vwhdQaEnbXelfdFgNRtNmVyzg	2025-10-07 22:36:48.932443+03
jleki36a7gopz655tdb4z0qss4xaew2g	.eJxVjksOwjAMBe-SNYkSWjsNS_acoXJimxZQK_WzQtydVuoC1m9m9N6mpXXp2nWWqe3ZXEzNkGNu2HKlbOtSGpsCqKUKz1SBFkyNOf1qmcpTht3lBw330ZVxWKY-ux1xxzq728jyuh7sX6CjudtshIIheEiiIuQxCQCmwEkEI3pBlfP2hEokImSSWsRD9IpIrCGazxdO_0JU:1v77qp:-ejIodetI4b2_ZpyOqPnb1vnL2y5u2p1-FKoYPqDw7U	2025-10-24 10:47:43.521536+03
4z2y5c4531mdsnxr0nwasjzczg9rvk0i	.eJxVjksOwjAMBe-SNYkSWjsNS_acoXJimxZQK_WzQtydVuoC1m9m9N6mpXXp2nWWqe3ZXEzNkGNu2HKlbOtSGpsCqKUKz1SBFkyNOf1qmcpTht3lBw330ZVxWKY-ux1xxzq728jyuh7sX6CjudtshIIheEiiIuQxCQCmwEkEI3pBlfP2hEokImSSWsRD9IpIrCGazxdO_0JU:1v79UP:e-n1h4K6oFwSBwUp5rAJQLXU4m2NVgQrTHMM8Qk_XvE	2025-10-24 12:32:41.474384+03
\.


--
-- Name: app_commissionsettings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: patabima_user
--

SELECT pg_catalog.setval('public.app_commissionsettings_id_seq', 2, true);


--
-- Name: app_messagesmodels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: patabima_user
--

SELECT pg_catalog.setval('public.app_messagesmodels_id_seq', 1, false);


--
-- Name: app_otpmodel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: patabima_user
--

SELECT pg_catalog.setval('public.app_otpmodel_id_seq', 45, true);


--
-- Name: auth_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: patabima_user
--

SELECT pg_catalog.setval('public.auth_group_id_seq', 1, false);


--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: patabima_user
--

SELECT pg_catalog.setval('public.auth_group_permissions_id_seq', 1, false);


--
-- Name: auth_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: patabima_user
--

SELECT pg_catalog.setval('public.auth_permission_id_seq', 208, true);


--
-- Name: django_admin_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: patabima_user
--

SELECT pg_catalog.setval('public.django_admin_log_id_seq', 66, true);


--
-- Name: django_content_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: patabima_user
--

SELECT pg_catalog.setval('public.django_content_type_id_seq', 52, true);


--
-- Name: django_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: patabima_user
--

SELECT pg_catalog.setval('public.django_migrations_id_seq', 71, true);


--
-- Name: app_additionalfieldpricing app_additionalfieldprici_subcategory_id_field_cod_be0d97c5_uniq; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_additionalfieldpricing
    ADD CONSTRAINT app_additionalfieldprici_subcategory_id_field_cod_be0d97c5_uniq UNIQUE (subcategory_id, field_code, effective_from);


--
-- Name: app_additionalfieldpricing app_additionalfieldpricing_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_additionalfieldpricing
    ADD CONSTRAINT app_additionalfieldpricing_pkey PRIMARY KEY (id);


--
-- Name: app_agentcommission app_agentcommission_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_agentcommission
    ADD CONSTRAINT app_agentcommission_pkey PRIMARY KEY (id);


--
-- Name: app_agentperformance app_agentperformance_agent_id_period_43e0fc46_uniq; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_agentperformance
    ADD CONSTRAINT app_agentperformance_agent_id_period_43e0fc46_uniq UNIQUE (agent_id, period);


--
-- Name: app_agentperformance app_agentperformance_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_agentperformance
    ADD CONSTRAINT app_agentperformance_pkey PRIMARY KEY (id);


--
-- Name: app_campaign app_campaign_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_campaign
    ADD CONSTRAINT app_campaign_pkey PRIMARY KEY (id);


--
-- Name: app_campaigninteraction app_campaigninteraction_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_campaigninteraction
    ADD CONSTRAINT app_campaigninteraction_pkey PRIMARY KEY (id);


--
-- Name: app_campaignschedule app_campaignschedule_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_campaignschedule
    ADD CONSTRAINT app_campaignschedule_pkey PRIMARY KEY (id);


--
-- Name: app_claim app_claim_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_claim
    ADD CONSTRAINT app_claim_pkey PRIMARY KEY (id);


--
-- Name: app_claimdocument app_claimdocument_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_claimdocument
    ADD CONSTRAINT app_claimdocument_pkey PRIMARY KEY (id);


--
-- Name: app_commercialtonnagepricing app_commercialtonnagepricing_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_commercialtonnagepricing
    ADD CONSTRAINT app_commercialtonnagepricing_pkey PRIMARY KEY (id);


--
-- Name: app_commissionrule app_commissionrule_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_commissionrule
    ADD CONSTRAINT app_commissionrule_pkey PRIMARY KEY (id);


--
-- Name: app_commissionsettings app_commissionsettings_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_commissionsettings
    ADD CONSTRAINT app_commissionsettings_pkey PRIMARY KEY (id);


--
-- Name: app_documentupload app_documentupload_document_id_key; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_documentupload
    ADD CONSTRAINT app_documentupload_document_id_key UNIQUE (document_id);


--
-- Name: app_documentupload app_documentupload_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_documentupload
    ADD CONSTRAINT app_documentupload_pkey PRIMARY KEY (id);


--
-- Name: app_extendiblepricing app_extendiblepricing_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_extendiblepricing
    ADD CONSTRAINT app_extendiblepricing_pkey PRIMARY KEY (id);


--
-- Name: app_extendiblepricing app_extendiblepricing_subcategory_id_underwrit_9dcb87b4_uniq; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_extendiblepricing
    ADD CONSTRAINT app_extendiblepricing_subcategory_id_underwrit_9dcb87b4_uniq UNIQUE (subcategory_id, underwriter_id);


--
-- Name: app_extensionreminder app_extensionreminder_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_extensionreminder
    ADD CONSTRAINT app_extensionreminder_pkey PRIMARY KEY (id);


--
-- Name: app_insuranceprovider app_insuranceprovider_code_key; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_insuranceprovider
    ADD CONSTRAINT app_insuranceprovider_code_key UNIQUE (code);


--
-- Name: app_insuranceprovider app_insuranceprovider_name_key; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_insuranceprovider
    ADD CONSTRAINT app_insuranceprovider_name_key UNIQUE (name);


--
-- Name: app_insuranceprovider app_insuranceprovider_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_insuranceprovider
    ADD CONSTRAINT app_insuranceprovider_pkey PRIMARY KEY (id);


--
-- Name: app_insurancequotation app_insurancequotation_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_insurancequotation
    ADD CONSTRAINT app_insurancequotation_pkey PRIMARY KEY (id);


--
-- Name: app_insurancequotation app_insurancequotation_quotation_number_key; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_insurancequotation
    ADD CONSTRAINT app_insurancequotation_quotation_number_key UNIQUE (quotation_number);


--
-- Name: app_manualquote app_manualquote_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_manualquote
    ADD CONSTRAINT app_manualquote_pkey PRIMARY KEY (id);


--
-- Name: app_manualquote app_manualquote_reference_key; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_manualquote
    ADD CONSTRAINT app_manualquote_reference_key UNIQUE (reference);


--
-- Name: app_messagesmodels app_messagesmodels_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_messagesmodels
    ADD CONSTRAINT app_messagesmodels_pkey PRIMARY KEY (id);


--
-- Name: app_monthlyagentbonus app_monthlyagentbonus_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_monthlyagentbonus
    ADD CONSTRAINT app_monthlyagentbonus_pkey PRIMARY KEY (id);


--
-- Name: app_motorcategory app_motorcategory_category_code_key; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_motorcategory
    ADD CONSTRAINT app_motorcategory_category_code_key UNIQUE (code);


--
-- Name: app_motorcategory app_motorcategory_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_motorcategory
    ADD CONSTRAINT app_motorcategory_pkey PRIMARY KEY (id);


--
-- Name: app_motorinsurancedetails app_motorinsurancedetails_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_motorinsurancedetails
    ADD CONSTRAINT app_motorinsurancedetails_pkey PRIMARY KEY (id);


--
-- Name: app_motorinsurancedetails app_motorinsurancedetails_quotation_id_key; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_motorinsurancedetails
    ADD CONSTRAINT app_motorinsurancedetails_quotation_id_key UNIQUE (quotation_id);


--
-- Name: app_motorpolicy app_motorpolicy_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_motorpolicy
    ADD CONSTRAINT app_motorpolicy_pkey PRIMARY KEY (id);


--
-- Name: app_motorpolicy app_motorpolicy_policy_number_key; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_motorpolicy
    ADD CONSTRAINT app_motorpolicy_policy_number_key UNIQUE (policy_number);


--
-- Name: app_motorpricing app_motorpricing_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_motorpricing
    ADD CONSTRAINT app_motorpricing_pkey PRIMARY KEY (id);


--
-- Name: app_motorpricing app_motorpricing_subcategory_id_underwrit_f6d5ed92_uniq; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_motorpricing
    ADD CONSTRAINT app_motorpricing_subcategory_id_underwrit_f6d5ed92_uniq UNIQUE (subcategory_id, underwriter_id, effective_from);


--
-- Name: app_motorsubcategory app_motorsubcategory_category_id_subcategory_code_b2c0a90e_uniq; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_motorsubcategory
    ADD CONSTRAINT app_motorsubcategory_category_id_subcategory_code_b2c0a90e_uniq UNIQUE (category_id, subcategory_code);


--
-- Name: app_motorsubcategory app_motorsubcategory_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_motorsubcategory
    ADD CONSTRAINT app_motorsubcategory_pkey PRIMARY KEY (id);


--
-- Name: app_otpmodel app_otpmodel_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_otpmodel
    ADD CONSTRAINT app_otpmodel_pkey PRIMARY KEY (id);


--
-- Name: app_policyextension app_policyextension_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_policyextension
    ADD CONSTRAINT app_policyextension_pkey PRIMARY KEY (id);


--
-- Name: app_policyextension app_policyextension_policy_number_key; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_policyextension
    ADD CONSTRAINT app_policyextension_policy_number_key UNIQUE (policy_number);


--
-- Name: app_psvpllprice app_psvpllprice_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_psvpllprice
    ADD CONSTRAINT app_psvpllprice_pkey PRIMARY KEY (id);


--
-- Name: app_psvpllpricing app_psvpllpricing_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_psvpllpricing
    ADD CONSTRAINT app_psvpllpricing_pkey PRIMARY KEY (id);


--
-- Name: app_psvpllpricing app_psvpllpricing_subcategory_id_underwrit_eed0a16c_uniq; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_psvpllpricing
    ADD CONSTRAINT app_psvpllpricing_subcategory_id_underwrit_eed0a16c_uniq UNIQUE (subcategory_id, underwriter_id, pll_amount, effective_from);


--
-- Name: app_publicuserprofile app_publicuserprofile_idnum_key; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_publicuserprofile
    ADD CONSTRAINT app_publicuserprofile_idnum_key UNIQUE (idnum);


--
-- Name: app_publicuserprofile app_publicuserprofile_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_publicuserprofile
    ADD CONSTRAINT app_publicuserprofile_pkey PRIMARY KEY (id);


--
-- Name: app_publicuserprofile app_publicuserprofile_registration_number_key; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_publicuserprofile
    ADD CONSTRAINT app_publicuserprofile_registration_number_key UNIQUE (registration_number);


--
-- Name: app_publicuserprofile app_publicuserprofile_user_id_key; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_publicuserprofile
    ADD CONSTRAINT app_publicuserprofile_user_id_key UNIQUE (user_id);


--
-- Name: app_serviceprocessinglog app_serviceprocessinglog_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_serviceprocessinglog
    ADD CONSTRAINT app_serviceprocessinglog_pkey PRIMARY KEY (id);


--
-- Name: app_staffuserprofile app_staffuserprofile_agent_code_key; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_staffuserprofile
    ADD CONSTRAINT app_staffuserprofile_agent_code_key UNIQUE (agent_code);


--
-- Name: app_staffuserprofile app_staffuserprofile_idnum_key; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_staffuserprofile
    ADD CONSTRAINT app_staffuserprofile_idnum_key UNIQUE (idnum);


--
-- Name: app_staffuserprofile app_staffuserprofile_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_staffuserprofile
    ADD CONSTRAINT app_staffuserprofile_pkey PRIMARY KEY (id);


--
-- Name: app_staffuserprofile app_staffuserprofile_user_id_key; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_staffuserprofile
    ADD CONSTRAINT app_staffuserprofile_user_id_key UNIQUE (user_id);


--
-- Name: app_user app_user_email_key; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_email_key UNIQUE (email);


--
-- Name: app_user app_user_phonenumber_key; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_phonenumber_key UNIQUE (phonenumber);


--
-- Name: app_user app_user_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_pkey PRIMARY KEY (id);


--
-- Name: app_vehicleadjustmentfactor app_vehicleadjustmentfac_factor_type_factor_key_19997e49_uniq; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_vehicleadjustmentfactor
    ADD CONSTRAINT app_vehicleadjustmentfac_factor_type_factor_key_19997e49_uniq UNIQUE (factor_type, factor_key);


--
-- Name: app_vehicleadjustmentfactor app_vehicleadjustmentfactor_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_vehicleadjustmentfactor
    ADD CONSTRAINT app_vehicleadjustmentfactor_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_name_key; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);


--
-- Name: auth_group_permissions auth_group_permissions_group_id_permission_id_0cd325b0_uniq; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq UNIQUE (group_id, permission_id);


--
-- Name: auth_group_permissions auth_group_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- Name: auth_permission auth_permission_content_type_id_codename_01ab375a_uniq; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq UNIQUE (content_type_id, codename);


--
-- Name: auth_permission auth_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- Name: django_admin_log django_admin_log_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_pkey PRIMARY KEY (id);


--
-- Name: django_content_type django_content_type_app_label_model_76bd3d3b_uniq; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);


--
-- Name: django_content_type django_content_type_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);


--
-- Name: django_migrations django_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);


--
-- Name: django_session django_session_pkey; Type: CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.django_session
    ADD CONSTRAINT django_session_pkey PRIMARY KEY (session_key);


--
-- Name: app_additionalfieldpricing_subcategory_id_4be1051d; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_additionalfieldpricing_subcategory_id_4be1051d ON public.app_additionalfieldpricing USING btree (subcategory_id);


--
-- Name: app_agentco_agent_i_08093f_idx; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_agentco_agent_i_08093f_idx ON public.app_agentcommission USING btree (agent_id, date_created);


--
-- Name: app_agentco_payment_3c2007_idx; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_agentco_payment_3c2007_idx ON public.app_agentcommission USING btree (payment_status, date_created);


--
-- Name: app_agentcommission_agent_id_09cae724; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_agentcommission_agent_id_09cae724 ON public.app_agentcommission USING btree (agent_id);


--
-- Name: app_agentcommission_payment_status_beece6b7; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_agentcommission_payment_status_beece6b7 ON public.app_agentcommission USING btree (payment_status);


--
-- Name: app_agentcommission_payment_status_beece6b7_like; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_agentcommission_payment_status_beece6b7_like ON public.app_agentcommission USING btree (payment_status varchar_pattern_ops);


--
-- Name: app_agentcommission_policy_id_fe0f6179; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_agentcommission_policy_id_fe0f6179 ON public.app_agentcommission USING btree (policy_id);


--
-- Name: app_agentpe_agent_i_f445c6_idx; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_agentpe_agent_i_f445c6_idx ON public.app_agentperformance USING btree (agent_id, period_start DESC);


--
-- Name: app_agentpe_period_8f9e7d_idx; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_agentpe_period_8f9e7d_idx ON public.app_agentperformance USING btree (period);


--
-- Name: app_agentperformance_agent_id_b174672a; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_agentperformance_agent_id_b174672a ON public.app_agentperformance USING btree (agent_id);


--
-- Name: app_agentperformance_period_7cffb9a3; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_agentperformance_period_7cffb9a3 ON public.app_agentperformance USING btree (period);


--
-- Name: app_agentperformance_period_7cffb9a3_like; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_agentperformance_period_7cffb9a3_like ON public.app_agentperformance USING btree (period varchar_pattern_ops);


--
-- Name: app_campaign_created_by_id_72307cf3; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_campaign_created_by_id_72307cf3 ON public.app_campaign USING btree (created_by_id);


--
-- Name: app_campaigninteraction_campaign_id_9021a764; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_campaigninteraction_campaign_id_9021a764 ON public.app_campaigninteraction USING btree (campaign_id);


--
-- Name: app_campaigninteraction_user_id_5393b1f9; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_campaigninteraction_user_id_5393b1f9 ON public.app_campaigninteraction USING btree (user_id);


--
-- Name: app_campaignschedule_campaign_id_a342d3ae; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_campaignschedule_campaign_id_a342d3ae ON public.app_campaignschedule USING btree (campaign_id);


--
-- Name: app_claim_user_id_4a79f9c7; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_claim_user_id_4a79f9c7 ON public.app_claim USING btree (user_id);


--
-- Name: app_claimdocument_claim_id_01d1b616; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_claimdocument_claim_id_01d1b616 ON public.app_claimdocument USING btree (claim_id);


--
-- Name: app_commerc_subcate_e8bd1d_idx; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_commerc_subcate_e8bd1d_idx ON public.app_commercialtonnagepricing USING btree (subcategory_id);


--
-- Name: app_commerc_tonnage_f80068_idx; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_commerc_tonnage_f80068_idx ON public.app_commercialtonnagepricing USING btree (tonnage_from, tonnage_to);


--
-- Name: app_commercialtonnagepricing_subcategory_id_30a5db78; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_commercialtonnagepricing_subcategory_id_30a5db78 ON public.app_commercialtonnagepricing USING btree (subcategory_id);


--
-- Name: app_commercialtonnagepricing_underwriter_id_116b9f3e; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_commercialtonnagepricing_underwriter_id_116b9f3e ON public.app_commercialtonnagepricing USING btree (underwriter_id);


--
-- Name: app_commiss_is_acti_d262b5_idx; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_commiss_is_acti_d262b5_idx ON public.app_commissionrule USING btree (is_active);


--
-- Name: app_commiss_line_ke_29d703_idx; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_commiss_line_ke_29d703_idx ON public.app_commissionrule USING btree (line_key);


--
-- Name: app_commiss_priorit_0bd42b_idx; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_commiss_priorit_0bd42b_idx ON public.app_commissionrule USING btree (priority);


--
-- Name: app_commissionrule_subcategory_id_90bed4ff; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_commissionrule_subcategory_id_90bed4ff ON public.app_commissionrule USING btree (subcategory_id);


--
-- Name: app_commissionrule_underwriter_id_18115eb1; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_commissionrule_underwriter_id_18115eb1 ON public.app_commissionrule USING btree (underwriter_id);


--
-- Name: app_documentupload_quotation_id_5e3edef0; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_documentupload_quotation_id_5e3edef0 ON public.app_documentupload USING btree (quotation_id);


--
-- Name: app_extendiblepricing_subcategory_id_1f18b722; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_extendiblepricing_subcategory_id_1f18b722 ON public.app_extendiblepricing USING btree (subcategory_id);


--
-- Name: app_extendiblepricing_underwriter_id_1be47505; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_extendiblepricing_underwriter_id_1be47505 ON public.app_extendiblepricing USING btree (underwriter_id);


--
-- Name: app_extensionreminder_policy_extension_id_d40081fd; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_extensionreminder_policy_extension_id_d40081fd ON public.app_extensionreminder USING btree (policy_extension_id);


--
-- Name: app_insuranceprovider_code_ceb58e62_like; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_insuranceprovider_code_ceb58e62_like ON public.app_insuranceprovider USING btree (code varchar_pattern_ops);


--
-- Name: app_insuranceprovider_code_ci_uniq; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE UNIQUE INDEX app_insuranceprovider_code_ci_uniq ON public.app_insuranceprovider USING btree (lower((code)::text));


--
-- Name: app_insuranceprovider_name_d099dd13_like; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_insuranceprovider_name_d099dd13_like ON public.app_insuranceprovider USING btree (name varchar_pattern_ops);


--
-- Name: app_insurancequotation_agent_id_1a7848f8; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_insurancequotation_agent_id_1a7848f8 ON public.app_insurancequotation USING btree (agent_id);


--
-- Name: app_insurancequotation_quotation_number_ff10c57a_like; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_insurancequotation_quotation_number_ff10c57a_like ON public.app_insurancequotation USING btree (quotation_number varchar_pattern_ops);


--
-- Name: app_manualquote_agent_id_9e21bd13; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_manualquote_agent_id_9e21bd13 ON public.app_manualquote USING btree (agent_id);


--
-- Name: app_manualquote_line_key_a909f36f; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_manualquote_line_key_a909f36f ON public.app_manualquote USING btree (line_key);


--
-- Name: app_manualquote_line_key_a909f36f_like; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_manualquote_line_key_a909f36f_like ON public.app_manualquote USING btree (line_key varchar_pattern_ops);


--
-- Name: app_manualquote_reference_725f157e_like; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_manualquote_reference_725f157e_like ON public.app_manualquote USING btree (reference varchar_pattern_ops);


--
-- Name: app_manualquote_status_0b1a7eb6; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_manualquote_status_0b1a7eb6 ON public.app_manualquote USING btree (status);


--
-- Name: app_manualquote_status_0b1a7eb6_like; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_manualquote_status_0b1a7eb6_like ON public.app_manualquote USING btree (status varchar_pattern_ops);


--
-- Name: app_monthly_agent_idx; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_monthly_agent_idx ON public.app_monthlyagentbonus USING btree (agent_id, year DESC, month DESC);


--
-- Name: app_monthly_agent_period_uniq; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE UNIQUE INDEX app_monthly_agent_period_uniq ON public.app_monthlyagentbonus USING btree (agent_id, period);


--
-- Name: app_monthly_payment_idx; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_monthly_payment_idx ON public.app_monthlyagentbonus USING btree (payment_status);


--
-- Name: app_monthly_period_idx; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_monthly_period_idx ON public.app_monthlyagentbonus USING btree (period);


--
-- Name: app_motorcategory_category_code_0c9215f6_like; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_motorcategory_category_code_0c9215f6_like ON public.app_motorcategory USING btree (code varchar_pattern_ops);


--
-- Name: app_motorpo_policy__d8cff4_idx; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_motorpo_policy__d8cff4_idx ON public.app_motorpolicy USING btree (policy_number);


--
-- Name: app_motorpo_status_3f966f_idx; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_motorpo_status_3f966f_idx ON public.app_motorpolicy USING btree (status, submitted_at DESC);


--
-- Name: app_motorpo_user_id_a28357_idx; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_motorpo_user_id_a28357_idx ON public.app_motorpolicy USING btree (user_id, submitted_at DESC);


--
-- Name: app_motorpolicy_approved_by_id_d25b9c7b; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_motorpolicy_approved_by_id_d25b9c7b ON public.app_motorpolicy USING btree (approved_by_id);


--
-- Name: app_motorpolicy_original_policy_id_254cb93f; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_motorpolicy_original_policy_id_254cb93f ON public.app_motorpolicy USING btree (original_policy_id);


--
-- Name: app_motorpolicy_policy_number_b819137e_like; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_motorpolicy_policy_number_b819137e_like ON public.app_motorpolicy USING btree (policy_number varchar_pattern_ops);


--
-- Name: app_motorpolicy_status_641114db; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_motorpolicy_status_641114db ON public.app_motorpolicy USING btree (status);


--
-- Name: app_motorpolicy_status_641114db_like; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_motorpolicy_status_641114db_like ON public.app_motorpolicy USING btree (status varchar_pattern_ops);


--
-- Name: app_motorpolicy_user_id_7b4db2e4; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_motorpolicy_user_id_7b4db2e4 ON public.app_motorpolicy USING btree (user_id);


--
-- Name: app_motorpr_effecti_422a7c_idx; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_motorpr_effecti_422a7c_idx ON public.app_motorpricing USING btree (effective_from);


--
-- Name: app_motorpr_subcate_de9e23_idx; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_motorpr_subcate_de9e23_idx ON public.app_motorpricing USING btree (subcategory_id);


--
-- Name: app_motorpr_underwr_d2a02b_idx; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_motorpr_underwr_d2a02b_idx ON public.app_motorpricing USING btree (underwriter_id);


--
-- Name: app_motorpricing_subcategory_id_319b2825; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_motorpricing_subcategory_id_319b2825 ON public.app_motorpricing USING btree (subcategory_id);


--
-- Name: app_motorpricing_underwriter_id_6666551c; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_motorpricing_underwriter_id_6666551c ON public.app_motorpricing USING btree (underwriter_id);


--
-- Name: app_motorsu_product_962074_idx; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_motorsu_product_962074_idx ON public.app_motorsubcategory USING btree (product_type);


--
-- Name: app_motorsu_subcate_2244fe_idx; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_motorsu_subcate_2244fe_idx ON public.app_motorsubcategory USING btree (subcategory_code);


--
-- Name: app_motorsubcategory_category_id_eaad0fa6; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_motorsubcategory_category_id_eaad0fa6 ON public.app_motorsubcategory USING btree (category_id);


--
-- Name: app_motorsubcategory_extendible_variant_id_48ab0615; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_motorsubcategory_extendible_variant_id_48ab0615 ON public.app_motorsubcategory USING btree (extendible_variant_id);


--
-- Name: app_policyextension_policy_number_3f92b892_like; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_policyextension_policy_number_3f92b892_like ON public.app_policyextension USING btree (policy_number varchar_pattern_ops);


--
-- Name: app_policyextension_underwriter_id_1a63cad1; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_policyextension_underwriter_id_1a63cad1 ON public.app_policyextension USING btree (underwriter_id);


--
-- Name: app_psvpllprice_underwriter_id_d99574b5; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_psvpllprice_underwriter_id_d99574b5 ON public.app_psvpllprice USING btree (underwriter_id);


--
-- Name: app_psvpllpricing_subcategory_id_b94b66ee; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_psvpllpricing_subcategory_id_b94b66ee ON public.app_psvpllpricing USING btree (subcategory_id);


--
-- Name: app_psvpllpricing_underwriter_id_3be8f61b; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_psvpllpricing_underwriter_id_3be8f61b ON public.app_psvpllpricing USING btree (underwriter_id);


--
-- Name: app_publicuserprofile_idnum_182ff0a3_like; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_publicuserprofile_idnum_182ff0a3_like ON public.app_publicuserprofile USING btree (idnum varchar_pattern_ops);


--
-- Name: app_publicuserprofile_registration_number_54c15ee1_like; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_publicuserprofile_registration_number_54c15ee1_like ON public.app_publicuserprofile USING btree (registration_number varchar_pattern_ops);


--
-- Name: app_serviceprocessinglog_quotation_id_3af42df7; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_serviceprocessinglog_quotation_id_3af42df7 ON public.app_serviceprocessinglog USING btree (quotation_id);


--
-- Name: app_staffuserprofile_idnum_947b8c2e_like; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_staffuserprofile_idnum_947b8c2e_like ON public.app_staffuserprofile USING btree (idnum varchar_pattern_ops);


--
-- Name: app_user_email_efde8896_like; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_user_email_efde8896_like ON public.app_user USING btree (email varchar_pattern_ops);


--
-- Name: app_user_phonenumber_5920e10d_like; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX app_user_phonenumber_5920e10d_like ON public.app_user USING btree (phonenumber varchar_pattern_ops);


--
-- Name: auth_group_name_a6ea08ec_like; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX auth_group_name_a6ea08ec_like ON public.auth_group USING btree (name varchar_pattern_ops);


--
-- Name: auth_group_permissions_group_id_b120cbf9; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX auth_group_permissions_group_id_b120cbf9 ON public.auth_group_permissions USING btree (group_id);


--
-- Name: auth_group_permissions_permission_id_84c5c92e; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX auth_group_permissions_permission_id_84c5c92e ON public.auth_group_permissions USING btree (permission_id);


--
-- Name: auth_permission_content_type_id_2f476e4b; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX auth_permission_content_type_id_2f476e4b ON public.auth_permission USING btree (content_type_id);


--
-- Name: django_admin_log_content_type_id_c4bce8eb; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX django_admin_log_content_type_id_c4bce8eb ON public.django_admin_log USING btree (content_type_id);


--
-- Name: django_admin_log_user_id_c564eba6; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX django_admin_log_user_id_c564eba6 ON public.django_admin_log USING btree (user_id);


--
-- Name: django_session_expire_date_a5c62663; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX django_session_expire_date_a5c62663 ON public.django_session USING btree (expire_date);


--
-- Name: django_session_session_key_c0390e0f_like; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX django_session_session_key_c0390e0f_like ON public.django_session USING btree (session_key varchar_pattern_ops);


--
-- Name: idx_motorsubcategory_cover_type_ref_id; Type: INDEX; Schema: public; Owner: patabima_user
--

CREATE INDEX idx_motorsubcategory_cover_type_ref_id ON public.app_motorsubcategory USING btree (cover_type_ref_id);


--
-- Name: app_additionalfieldpricing app_additionalfieldp_subcategory_id_4be1051d_fk_app_motor; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_additionalfieldpricing
    ADD CONSTRAINT app_additionalfieldp_subcategory_id_4be1051d_fk_app_motor FOREIGN KEY (subcategory_id) REFERENCES public.app_motorsubcategory(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_agentcommission app_agentcommission_agent_id_09cae724_fk_app_user_id; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_agentcommission
    ADD CONSTRAINT app_agentcommission_agent_id_09cae724_fk_app_user_id FOREIGN KEY (agent_id) REFERENCES public.app_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_agentcommission app_agentcommission_policy_id_fe0f6179_fk_app_motorpolicy_id; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_agentcommission
    ADD CONSTRAINT app_agentcommission_policy_id_fe0f6179_fk_app_motorpolicy_id FOREIGN KEY (policy_id) REFERENCES public.app_motorpolicy(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_agentperformance app_agentperformance_agent_id_b174672a_fk_app_user_id; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_agentperformance
    ADD CONSTRAINT app_agentperformance_agent_id_b174672a_fk_app_user_id FOREIGN KEY (agent_id) REFERENCES public.app_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_campaign app_campaign_created_by_id_72307cf3_fk_app_user_id; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_campaign
    ADD CONSTRAINT app_campaign_created_by_id_72307cf3_fk_app_user_id FOREIGN KEY (created_by_id) REFERENCES public.app_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_campaigninteraction app_campaigninteraction_campaign_id_9021a764_fk_app_campaign_id; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_campaigninteraction
    ADD CONSTRAINT app_campaigninteraction_campaign_id_9021a764_fk_app_campaign_id FOREIGN KEY (campaign_id) REFERENCES public.app_campaign(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_campaigninteraction app_campaigninteraction_user_id_5393b1f9_fk_app_user_id; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_campaigninteraction
    ADD CONSTRAINT app_campaigninteraction_user_id_5393b1f9_fk_app_user_id FOREIGN KEY (user_id) REFERENCES public.app_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_campaignschedule app_campaignschedule_campaign_id_a342d3ae_fk_app_campaign_id; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_campaignschedule
    ADD CONSTRAINT app_campaignschedule_campaign_id_a342d3ae_fk_app_campaign_id FOREIGN KEY (campaign_id) REFERENCES public.app_campaign(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_claim app_claim_user_id_4a79f9c7_fk_app_user_id; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_claim
    ADD CONSTRAINT app_claim_user_id_4a79f9c7_fk_app_user_id FOREIGN KEY (user_id) REFERENCES public.app_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_claimdocument app_claimdocument_claim_id_01d1b616_fk_app_claim_id; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_claimdocument
    ADD CONSTRAINT app_claimdocument_claim_id_01d1b616_fk_app_claim_id FOREIGN KEY (claim_id) REFERENCES public.app_claim(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_commercialtonnagepricing app_commercialtonnag_subcategory_id_30a5db78_fk_app_motor; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_commercialtonnagepricing
    ADD CONSTRAINT app_commercialtonnag_subcategory_id_30a5db78_fk_app_motor FOREIGN KEY (subcategory_id) REFERENCES public.app_motorsubcategory(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_commercialtonnagepricing app_commercialtonnag_underwriter_id_116b9f3e_fk_app_insur; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_commercialtonnagepricing
    ADD CONSTRAINT app_commercialtonnag_underwriter_id_116b9f3e_fk_app_insur FOREIGN KEY (underwriter_id) REFERENCES public.app_insuranceprovider(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_commissionrule app_commissionrule_subcategory_id_90bed4ff_fk_app_motor; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_commissionrule
    ADD CONSTRAINT app_commissionrule_subcategory_id_90bed4ff_fk_app_motor FOREIGN KEY (subcategory_id) REFERENCES public.app_motorsubcategory(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_commissionrule app_commissionrule_underwriter_id_18115eb1_fk_app_insur; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_commissionrule
    ADD CONSTRAINT app_commissionrule_underwriter_id_18115eb1_fk_app_insur FOREIGN KEY (underwriter_id) REFERENCES public.app_insuranceprovider(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_documentupload app_documentupload_quotation_id_5e3edef0_fk_app_insur; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_documentupload
    ADD CONSTRAINT app_documentupload_quotation_id_5e3edef0_fk_app_insur FOREIGN KEY (quotation_id) REFERENCES public.app_insurancequotation(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_extendiblepricing app_extendiblepricin_subcategory_id_1f18b722_fk_app_motor; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_extendiblepricing
    ADD CONSTRAINT app_extendiblepricin_subcategory_id_1f18b722_fk_app_motor FOREIGN KEY (subcategory_id) REFERENCES public.app_motorsubcategory(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_extendiblepricing app_extendiblepricin_underwriter_id_1be47505_fk_app_insur; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_extendiblepricing
    ADD CONSTRAINT app_extendiblepricin_underwriter_id_1be47505_fk_app_insur FOREIGN KEY (underwriter_id) REFERENCES public.app_insuranceprovider(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_extensionreminder app_extensionreminde_policy_extension_id_d40081fd_fk_app_polic; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_extensionreminder
    ADD CONSTRAINT app_extensionreminde_policy_extension_id_d40081fd_fk_app_polic FOREIGN KEY (policy_extension_id) REFERENCES public.app_policyextension(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_insurancequotation app_insurancequotation_agent_id_1a7848f8_fk_app_user_id; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_insurancequotation
    ADD CONSTRAINT app_insurancequotation_agent_id_1a7848f8_fk_app_user_id FOREIGN KEY (agent_id) REFERENCES public.app_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_manualquote app_manualquote_agent_id_9e21bd13_fk_app_user_id; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_manualquote
    ADD CONSTRAINT app_manualquote_agent_id_9e21bd13_fk_app_user_id FOREIGN KEY (agent_id) REFERENCES public.app_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_monthlyagentbonus app_monthlyagentbonus_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_monthlyagentbonus
    ADD CONSTRAINT app_monthlyagentbonus_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.app_user(id) ON DELETE CASCADE;


--
-- Name: app_motorinsurancedetails app_motorinsurancede_quotation_id_3215c25f_fk_app_insur; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_motorinsurancedetails
    ADD CONSTRAINT app_motorinsurancede_quotation_id_3215c25f_fk_app_insur FOREIGN KEY (quotation_id) REFERENCES public.app_insurancequotation(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_motorpolicy app_motorpolicy_approved_by_id_d25b9c7b_fk_app_user_id; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_motorpolicy
    ADD CONSTRAINT app_motorpolicy_approved_by_id_d25b9c7b_fk_app_user_id FOREIGN KEY (approved_by_id) REFERENCES public.app_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_motorpolicy app_motorpolicy_original_policy_id_254cb93f_fk_app_motor; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_motorpolicy
    ADD CONSTRAINT app_motorpolicy_original_policy_id_254cb93f_fk_app_motor FOREIGN KEY (original_policy_id) REFERENCES public.app_motorpolicy(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_motorpolicy app_motorpolicy_user_id_7b4db2e4_fk_app_user_id; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_motorpolicy
    ADD CONSTRAINT app_motorpolicy_user_id_7b4db2e4_fk_app_user_id FOREIGN KEY (user_id) REFERENCES public.app_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_motorpricing app_motorpricing_subcategory_id_319b2825_fk_app_motor; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_motorpricing
    ADD CONSTRAINT app_motorpricing_subcategory_id_319b2825_fk_app_motor FOREIGN KEY (subcategory_id) REFERENCES public.app_motorsubcategory(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_motorpricing app_motorpricing_underwriter_id_6666551c_fk_app_insur; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_motorpricing
    ADD CONSTRAINT app_motorpricing_underwriter_id_6666551c_fk_app_insur FOREIGN KEY (underwriter_id) REFERENCES public.app_insuranceprovider(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_motorsubcategory app_motorsubcategory_category_id_eaad0fa6_fk_app_motor; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_motorsubcategory
    ADD CONSTRAINT app_motorsubcategory_category_id_eaad0fa6_fk_app_motor FOREIGN KEY (category_id) REFERENCES public.app_motorcategory(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_motorsubcategory app_motorsubcategory_extendible_variant_i_48ab0615_fk_app_motor; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_motorsubcategory
    ADD CONSTRAINT app_motorsubcategory_extendible_variant_i_48ab0615_fk_app_motor FOREIGN KEY (extendible_variant_id) REFERENCES public.app_motorsubcategory(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_policyextension app_policyextension_underwriter_id_1a63cad1_fk_app_insur; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_policyextension
    ADD CONSTRAINT app_policyextension_underwriter_id_1a63cad1_fk_app_insur FOREIGN KEY (underwriter_id) REFERENCES public.app_insuranceprovider(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_psvpllprice app_psvpllprice_underwriter_id_d99574b5_fk_app_insur; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_psvpllprice
    ADD CONSTRAINT app_psvpllprice_underwriter_id_d99574b5_fk_app_insur FOREIGN KEY (underwriter_id) REFERENCES public.app_insuranceprovider(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_psvpllpricing app_psvpllpricing_subcategory_id_b94b66ee_fk_app_motor; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_psvpllpricing
    ADD CONSTRAINT app_psvpllpricing_subcategory_id_b94b66ee_fk_app_motor FOREIGN KEY (subcategory_id) REFERENCES public.app_motorsubcategory(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_psvpllpricing app_psvpllpricing_underwriter_id_3be8f61b_fk_app_insur; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_psvpllpricing
    ADD CONSTRAINT app_psvpllpricing_underwriter_id_3be8f61b_fk_app_insur FOREIGN KEY (underwriter_id) REFERENCES public.app_insuranceprovider(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_publicuserprofile app_publicuserprofile_user_id_25fc61f6_fk_app_user_id; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_publicuserprofile
    ADD CONSTRAINT app_publicuserprofile_user_id_25fc61f6_fk_app_user_id FOREIGN KEY (user_id) REFERENCES public.app_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_serviceprocessinglog app_serviceprocessin_quotation_id_3af42df7_fk_app_insur; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_serviceprocessinglog
    ADD CONSTRAINT app_serviceprocessin_quotation_id_3af42df7_fk_app_insur FOREIGN KEY (quotation_id) REFERENCES public.app_insurancequotation(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: app_staffuserprofile app_staffuserprofile_user_id_6b52dccf_fk_app_user_id; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.app_staffuserprofile
    ADD CONSTRAINT app_staffuserprofile_user_id_6b52dccf_fk_app_user_id FOREIGN KEY (user_id) REFERENCES public.app_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissio_permission_id_84c5c92e_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissions_group_id_b120cbf9_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_permission auth_permission_content_type_id_2f476e4b_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_content_type_id_c4bce8eb_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_user_id_c564eba6_fk_app_user_id; Type: FK CONSTRAINT; Schema: public; Owner: patabima_user
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_app_user_id FOREIGN KEY (user_id) REFERENCES public.app_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO patabima_user;


--
-- PostgreSQL database dump complete
--

\unrestrict SF2Gzf5U8m3uCaP065hChbpiJQKX3UlosDRSaqk0KgAHlOx2K4VaIotTeazsqF8

