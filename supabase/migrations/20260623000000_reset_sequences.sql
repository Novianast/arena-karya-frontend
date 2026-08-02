-- Reset sequence untuk package_payments
SELECT setval(
  pg_get_serial_sequence('public.package_payments', 'payment_id'),
  COALESCE(max(payment_id), 0) + 1,
  false
) FROM public.package_payments;

-- Reset sequence untuk packages
SELECT setval(
  pg_get_serial_sequence('public.packages', 'package_id'),
  COALESCE(max(package_id), 0) + 1,
  false
) FROM public.packages;

-- Reset sequence untuk roles
SELECT setval(
  pg_get_serial_sequence('public.roles', 'role_id'),
  COALESCE(max(role_id), 0) + 1,
  false
) FROM public.roles;

-- Reset sequence untuk organizers
SELECT setval(
  pg_get_serial_sequence('public.organizers', 'organizer_id'),
  COALESCE(max(organizer_id), 0) + 1,
  false
) FROM public.organizers;

-- Reset sequence untuk events
SELECT setval(
  pg_get_serial_sequence('public.events', 'event_id'),
  COALESCE(max(event_id), 0) + 1,
  false
) FROM public.events;

-- Reset sequence untuk competitions
SELECT setval(
  pg_get_serial_sequence('public.competitions', 'competition_id'),
  COALESCE(max(competition_id), 0) + 1,
  false
) FROM public.competitions;
