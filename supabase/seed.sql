insert into public.players (name, role, batting_stats_json, bowling_stats_json, fielding_stats_json, career_stats_json, recent_form_json, consistency_score)
values
('Arjun Verma', 'BAT', '{"matches":120,"runs":4890,"highScore":142,"strikeRate":138.3,"fours":420,"sixes":142,"fifties":31,"hundreds":8,"average":42.8}', '{}', '{"catches":62}', '{"summary":"Top-order power batter"}', '[55,62,44,71,66,59,83,47,64,69]', 79),
('Mihir Khan', 'BOWL', '{}', '{"wickets":210,"average":24.8,"economy":6.7,"bestFigures":"5/21","maidens":18,"overs":845}', '{"catches":38}', '{"summary":"Strike pacer"}', '[40,38,52,48,57,61,44,50,49,63]', 76),
('Rahul Das', 'AR', '{"matches":98,"runs":2920,"highScore":97,"strikeRate":131.4,"fours":252,"sixes":96,"fifties":18,"hundreds":0,"average":34.5}', '{"wickets":124,"average":28.2,"economy":7.1,"bestFigures":"4/19","maidens":7,"overs":610}', '{"catches":45}', '{"summary":"Balanced all-rounder"}', '[52,60,55,65,48,67,69,57,71,62]', 82),
('Nitin Rao', 'WK', '{"matches":88,"runs":2510,"highScore":111,"strikeRate":136.8,"fours":220,"sixes":75,"fifties":15,"hundreds":2,"average":36.4}', '{}', '{"catches":90,"stumpings":34,"dismissals":124}', '{"summary":"Aggressive wicketkeeper"}', '[46,70,58,55,63,60,72,68,64,59]', 74)
on conflict do nothing;

insert into public.teams (name, squad_player_ids, approved)
select 'Neon Strikers', array(select id from public.players limit 4), true
where not exists (select 1 from public.teams where name='Neon Strikers');

insert into public.tournaments (name, format, teams, standings_json)
select 'Premier Sim League', 'T20', array(select id from public.teams limit 1), '[]'::jsonb
where not exists (select 1 from public.tournaments where name='Premier Sim League');
