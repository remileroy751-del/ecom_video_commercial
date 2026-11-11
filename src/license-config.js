// Configuration de la licence (valeurs publiques : la clé « publishable » de Supabase est faite pour être embarquée dans un logiciel).
// Les clés de licence et les statistiques sont protégées côté Supabase (voir ecom-supabase-schema.sql).
module.exports = {
  SUPABASE_URL: "https://kmusovomtivrxvqmeipn.supabase.co",
  SUPABASE_KEY: "sb_publishable_pnAgeFzqzlm_jy5x4eDgIw_gS_GGeaY",
  TRIAL_DAYS: 14,          // essai gratuit (la durée réelle est décidée par le serveur)
  OFFLINE_GRACE_DAYS: 7    // jours sans vérification en ligne tolérés pour une licence active
};
