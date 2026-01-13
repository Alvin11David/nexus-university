SELECT raw_user_meta_data FROM auth.users WHERE email LIKE \
%@registrar.com\ ORDER BY created_at DESC LIMIT 1;
