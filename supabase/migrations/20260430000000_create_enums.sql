CREATE TYPE education_level_enum AS ENUM ('elementary_school', 'middle_school', 'high_school', 'college');

CREATE TYPE upload_format_enum AS ENUM ('doc_img', 'doc_img_vid', 'all');

CREATE TYPE organizer_status_enum AS ENUM ('pending', 'active', 'inactive', 'blocked');

CREATE TYPE judge_last_education_enum AS ENUM ('diploma', 'bachelor', 'master', 'phd');

CREATE TYPE event_status_enum AS ENUM ('draft', 'queue', 'active', 'end', 'cancelled');

CREATE TYPE competition_type_enum AS ENUM ('individual', 'team');

CREATE TYPE competition_status_enum AS ENUM ('draft', 'ready', 'active', 'end', 'cancelled');

CREATE TYPE payment_status_enum AS ENUM ('pending', 'success', 'verified', 'used', 'rejected');

CREATE TYPE stage_status_enum AS ENUM ('not_started', 'ongoing', 'completed');

CREATE TYPE invitation_status_enum AS ENUM ('pending', 'accepted', 'rejected');

CREATE TYPE entry_type_enum AS ENUM ('individual', 'team');

CREATE TYPE entry_member_role_enum AS ENUM ('leader', 'member');

CREATE TYPE qualification_status_enum AS ENUM ('pending', 'qualified', 'eliminated');

CREATE TYPE entry_payment_status_enum AS ENUM ('pending', 'success', 'verified', 'rejected');

CREATE TYPE country_enum AS ENUM ('indonesia', 'overseas');

CREATE TYPE stage_type_enum AS ENUM ('registration', 'submission', 'final');

CREATE TYPE timeline_type_enum AS ENUM ('registration', 'submission', 'presentation', 'judging', 'announcement', 'award');

CREATE TYPE public.assignment_status_enum AS ENUM ('active', 'completed', 'cancelled');