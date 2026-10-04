-- Privacy purge: keep only jishnu.roni@gmail.com (u_31febb26ad867c73)
-- and events they own (6VMJLR5M, 78B8WSEE). Irreversible.

DELETE FROM auth_sessions
WHERE user_id != 'u_31febb26ad867c73';

DELETE FROM user_devices
WHERE user_id != 'u_31febb26ad867c73'
   OR event_id NOT IN ('evt_40ec6ecc6aa44892', 'evt_db62abd577a25e4f');

DELETE FROM buzz_scores
WHERE user_id != 'u_31febb26ad867c73'
   OR event_id NOT IN ('evt_40ec6ecc6aa44892', 'evt_db62abd577a25e4f');

DELETE FROM buzz_points_ledger
WHERE user_id != 'u_31febb26ad867c73'
   OR (event_id IS NOT NULL AND event_id NOT IN ('evt_40ec6ecc6aa44892', 'evt_db62abd577a25e4f'));

DELETE FROM buzz_play
WHERE event_id NOT IN ('evt_40ec6ecc6aa44892', 'evt_db62abd577a25e4f');

DELETE FROM notifications
WHERE event_id NOT IN ('evt_40ec6ecc6aa44892', 'evt_db62abd577a25e4f')
   OR (target_user_id IS NOT NULL AND target_user_id != 'u_31febb26ad867c73');

DELETE FROM contact_invites
WHERE event_id NOT IN ('evt_40ec6ecc6aa44892', 'evt_db62abd577a25e4f');

DELETE FROM event_invites
WHERE event_id NOT IN ('evt_40ec6ecc6aa44892', 'evt_db62abd577a25e4f');

DELETE FROM memberships
WHERE user_id IS NULL
   OR user_id != 'u_31febb26ad867c73'
   OR event_id NOT IN ('evt_40ec6ecc6aa44892', 'evt_db62abd577a25e4f');

DELETE FROM wedding_access
WHERE code NOT IN ('6VMJLR5M', '78B8WSEE');

DELETE FROM wedding_invites
WHERE wedding_code NOT IN ('6VMJLR5M', '78B8WSEE');

DELETE FROM weddings_v2
WHERE code NOT IN ('6VMJLR5M', '78B8WSEE');

DELETE FROM weddings
WHERE code NOT IN ('6VMJLR5M', '78B8WSEE');

DELETE FROM events
WHERE owner_id != 'u_31febb26ad867c73';

DELETE FROM users
WHERE id != 'u_31febb26ad867c73';

DELETE FROM claim_attempts;
