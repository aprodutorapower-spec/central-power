-- Uma única chamada devolve o perfil de quem está logado (deixa as telas
-- mais rápidas: substitui a conferência do usuário + a consulta do perfil).
create function public.meu_perfil()
returns table (id uuid, nome text, papel text, ativo boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.nome, p.papel, p.ativo
  from public.perfis p
  where p.user_id = (select auth.uid());
$$;

revoke execute on function public.meu_perfil() from public, anon;
grant execute on function public.meu_perfil() to authenticated;
