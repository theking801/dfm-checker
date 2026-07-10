-- Seed data — DFM Checker
-- Exécute cette migration dans le SQL Editor de Supabase pour avoir des données de test
-- Exemple : psql $SUPABASE_CONNECTION_STRING -f supabase/seed.sql

-- Pour réinitialiser les données avant le seed (décommenter si besoin) :
-- TRUNCATE analytics, errors, feedbacks RESTART IDENTITY CASCADE;

-- ── Analytics ──
INSERT INTO analytics (date, material, problems_count, high_count, medium_count, low_count, error, file_size_kb) VALUES
('2026-07-04', 'PLA',  5, 1, 2, 2, false, 1240.5),
('2026-07-04', 'PETG', 2, 0, 1, 1, false, 890.2),
('2026-07-05', 'PLA',  8, 3, 3, 2, false, 3420.0),
('2026-07-05', 'ABS',  3, 1, 1, 1, false, 560.8),
('2026-07-06', 'PLA',  1, 0, 1, 0, false, 210.3),
('2026-07-06', 'PLA',  12, 5, 4, 3, false, 5210.7),
('2026-07-06', 'PETG', 0, 0, 0, 0, false, 180.1),
('2026-07-07', 'ABS',  6, 2, 2, 2, false, 2890.4),
('2026-07-07', 'PLA',  4, 1, 1, 2, false, 1560.9),
('2026-07-07', 'PLA',  7, 2, 3, 2, false, 4100.2),
('2026-07-08', 'PETG', 3, 1, 1, 1, false, 920.5),
('2026-07-08', 'PLA',  9, 4, 3, 2, false, 3840.6),
('2026-07-08', 'ABS',  1, 0, 0, 1, false, 340.0),
('2026-07-09', 'PLA',  0, 0, 0, 0, false, 150.2),
('2026-07-09', 'PETG', 11, 4, 4, 3, false, 6720.3),
('2026-07-09', 'PLA',  4, 1, 2, 1, false, 2100.8),
('2026-07-10', 'ABS',  6, 2, 2, 2, false, 3050.5),
('2026-07-10', 'PLA',  3, 1, 1, 1, false, 780.4),
('2026-07-10', 'PETG', 7, 2, 3, 2, false, 4510.2),
('2026-07-10', 'PLA',  5, 2, 2, 1, false, 2680.9);

-- ── Errors ──
INSERT INTO errors (timestamp, type, message, details, severity, resolved) VALUES
('2026-07-04 09:15:00+00', 'upload',   'Fichier corrompu',             'Le fichier STL contient des données invalides (header tronqué)',                       'high',   true),
('2026-07-04 14:30:00+00', 'analysis', 'Mesh non refermé',            'Le modèle comporte des trous dans le maillage — 12 faces manquantes',                   'medium', true),
('2026-07-05 08:00:00+00', 'api',      'Timeout serveur',              'POST /analyze — 120s dépassé pour un fichier de 48 MB',                                 'high',   true),
('2026-07-05 16:45:00+00', 'upload',   'Extension non supportée',      'Tentative d upload fichier .3mf au lieu de .stl',                                       'low',    true),
('2026-07-06 11:20:00+00', 'system',   'Backend redémarré',            'Mise à jour de configuration appliquée — downtime 12s',                                'low',    true),
('2026-07-06 22:10:00+00', 'analysis', 'Mémoire insuffisante',         'Le mesh de 128 MB dépasse la limite de 50 MB — rejeté',                                'high',   true),
('2026-07-07 07:30:00+00', 'api',      'Erreur 500 interne',           'Exception non gérée dans detect_aspect_ratio — face_index invalide',                    'high',   false),
('2026-07-07 19:15:00+00', 'upload',   'Fichier vide',                 'Le fichier fait 0 octets — rejeté',                                                     'low',    true),
('2026-07-08 10:00:00+00', 'analysis', 'Matériau non supporté',        'Requête avec matériau NYLON qui n est pas dans la liste supportée',                    'low',    true),
('2026-07-08 15:40:00+00', 'api',      'Erreur CORS',                  'Requête depuis un domaine non autorisé (localhost:3000)',                               'medium', true),
('2026-07-09 12:00:00+00', 'analysis', 'Mesh sans faces',              'Le fichier STL contient un mesh vide (0 faces)',                                       'medium', false),
('2026-07-09 18:30:00+00', 'api',      'Format de réponse invalide',   'Le backend a retourné un JSON malformé — parsing échoué',                               'high',   false),
('2026-07-10 08:45:00+00', 'system',   'Base de données inaccessible', 'Connexion PostgreSQL perdue — recovery automatique après 5s',                          'high',   false),
('2026-07-10 14:20:00+00', 'upload',   'Limite de taille dépassée',    'Fichier de 67 MB rejeté — max 50 MB',                                                   'medium', false);

-- ── Feedbacks ──
INSERT INTO feedbacks (date, message, email, status) VALUES
('2026-07-04', 'Super outil ! Est-ce que vous prévoyez d ajouter le support des matériaux comme le Nylon ou le TPU ?',                     'maker@example.com',    'new'),
('2026-07-05', 'Bug : quand j importe un fichier avec des caractères spéciaux dans le nom, l analyse plante.',                             'paul.d@email.fr',      'new'),
('2026-07-06', 'Le rendu 3D est super fluide, bravo ! Les couleurs des zones à problème pourraient être plus contrastées.',                 '',                     'read'),
('2026-07-07', 'Idée : ajouter un mode batch pour analyser plusieurs fichiers à la fois. Très utile pour les fab labs.',                   'fablab@example.org',   'read'),
('2026-07-08', 'L export PDF ne fonctionne pas sur Firefox. Le bouton reste bloqué après le clic.',                                        'user@firefox.com',     'archived'),
('2026-07-09', 'Est-ce que vous comptez ajouter le format 3MF en plus du STL ? Ce serait top pour les couleurs !',                        'designer@example.com', 'new'),
('2026-07-10', 'Génial pour valider mes pièces avant impression. Une suggestion : ajouter un historique des analyses pour suivre les progrès.', 'student@example.edu',  'new');

-- ── Créer un admin Supabase Auth ──
-- Les RLS policies exigent auth.role() = 'authenticated' pour les écritures.
-- Il faut créer un utilisateur dans Auth pour que le backend puisse écrire.
--
-- Méthode 1 — Via le Dashboard Supabase :
--   1. Va dans Authentication > Users > Invite user
--   2. Email : admin@dfmchecker.app
--   3. Le user recevra un email d'invitation
--
-- Méthode 2 — Via la CLI Supabase (si installée) :
--   supabase auth create-user --email admin@dfmchecker.app --password dfmchecker2024 --auto-confirm
--
-- Méthode 3 — Via l'API REST Supabase :
--   Attention : nécessite de désactiver la confirmation d'email dans
--   Authentication > Settings (Disable "Confirm email")
--   curl -X POST https://<projet>.supabase.co/auth/v1/signup \
--     -H "apikey: <VITE_SUPABASE_ANON_KEY>" \
--     -H "Content-Type: application/json" \
--     -d '{"email":"admin@dfmchecker.app","password":"dfmchecker2024"}'
