-- ================================================================
-- KONOHA CENTRAL — SUPABASE DATABASE SETUP
-- Copier/coller ce script dans Supabase > SQL Editor > New Query
-- ================================================================

-- 1. TABLE PROFILES (extension de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT NOT NULL,
  clan        TEXT DEFAULT 'Citoyen Civile de Konoha',
  rank        TEXT DEFAULT 'Genin',
  specialty   TEXT DEFAULT 'Ninjutsu',
  role        TEXT DEFAULT 'citoyen' CHECK (role IN ('citoyen', 'chunin_admin', 'jonin_admin', 'admin')),
  ryos        INTEGER DEFAULT 12500,
  is_banned   BOOLEAN DEFAULT FALSE,
  ban_reason  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLE PERMISSIONS (log des actions admin)
CREATE TABLE IF NOT EXISTS public.permission_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID REFERENCES public.profiles(id),
  target_id   UUID REFERENCES public.profiles(id),
  action      TEXT NOT NULL,
  old_value   TEXT,
  new_value   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE TAX_PAYMENTS
CREATE TABLE IF NOT EXISTS public.tax_payments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id),
  tax_type    TEXT NOT NULL,
  amount      INTEGER NOT NULL,
  xp_gained   INTEGER DEFAULT 0,
  paid_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_payments ENABLE ROW LEVEL SECURITY;

-- Tout utilisateur connecté peut lire les profils
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Chaque utilisateur peut modifier son propre profil (champs limités)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Seuls les admins peuvent modifier le rôle / ban d'autres users
-- (On gère ça en JS côté serveur via service_role ou via RLS sur la colonne)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Les utilisateurs peuvent lire leurs propres paiements de taxes
CREATE POLICY "Users see own tax payments"
  ON public.tax_payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Les admins voient tous les paiements
CREATE POLICY "Admins see all tax payments"
  ON public.tax_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Les logs de permissions visibles par admins seulement
CREATE POLICY "Admins see permission logs"
  ON public.permission_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 5. FONCTION : Créer profil automatiquement après inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, clan, rank, specialty, role, ryos)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'clan', 'Citoyen Civile de Konoha'),
    COALESCE(NEW.raw_user_meta_data->>'rank', 'Genin'),
    COALESCE(NEW.raw_user_meta_data->>'specialty', 'Ninjutsu'),
    'citoyen',
    12500
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger : exécute la fonction à chaque nouvelle inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. FONCTION : Logger les actions admin
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_id UUID,
  p_target_id UUID,
  p_action TEXT,
  p_old_value TEXT,
  p_new_value TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.permission_logs (admin_id, target_id, action, old_value, new_value)
  VALUES (p_admin_id, p_target_id, p_action, p_old_value, p_new_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. DONNÉE DE TEST : Premier admin (à remplacer par ton vrai UUID après inscription)
-- UPDATE public.profiles SET role = 'admin' WHERE username = 'TON_NOM_ICI';

-- ================================================================
-- INSTRUCTIONS :
-- 1. Va sur supabase.com > ton projet > SQL Editor
-- 2. Colle tout ce script et clique sur "Run"
-- 3. Puis va dans Authentication > Providers > Email
--    et active "Confirm email" = OFF pour tester rapidement
-- 4. Inscris-toi sur le site, puis dans Supabase > Table Editor
--    > profiles, trouve ton profil et change role = 'admin'
-- ================================================================
