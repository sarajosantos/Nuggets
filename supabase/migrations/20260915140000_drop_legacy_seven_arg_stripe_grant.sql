-- Production retained a seven-argument grant from financial reporting.
-- The live webhook supplies payment_intent (eight arguments); this obsolete
-- version cannot record it for refunds. Drop only that exact unused signature.
drop function if exists public.grant_stripe_credits(text, uuid, integer, text, text, integer, text);
