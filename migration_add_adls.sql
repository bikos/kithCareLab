-- Migration: Add ADL columns to daily_care_logs

ALTER TABLE daily_care_logs 
ADD COLUMN adl_bathing text CHECK (adl_bathing IN ('independent', 'assisted', 'dependent', 'not_applicable')),
ADD COLUMN adl_dressing text CHECK (adl_dressing IN ('independent', 'assisted', 'dependent', 'not_applicable')),
ADD COLUMN adl_toileting text CHECK (adl_toileting IN ('independent', 'assisted', 'dependent', 'not_applicable')),
ADD COLUMN adl_mobility text CHECK (adl_mobility IN ('independent', 'assisted', 'dependent', 'not_applicable')),
ADD COLUMN adl_feeding text CHECK (adl_feeding IN ('independent', 'assisted', 'dependent', 'not_applicable'));
