-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION register_participant TO authenticated;
GRANT EXECUTE ON FUNCTION register_judge TO authenticated;
GRANT EXECUTE ON FUNCTION register_organizer TO authenticated;