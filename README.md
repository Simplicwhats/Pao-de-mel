# Pão de Mel Artesanal + Supabase

## Arquivos

- `index.html` — página pública + estrutura do painel.
- `style.css` — visual/responsividade.
- `app.js` — lógica, carrinho, WhatsApp, Supabase e painel.
- `supabase.sql` — tabelas e políticas de segurança.

## 1. Criar o banco

No Supabase:
1. Crie um projeto.
2. Abra **SQL Editor**.
3. Cole o conteúdo de `supabase.sql`.
4. Execute.

## 2. Criar o administrador

No Supabase:
1. Vá em **Authentication > Users**.
2. Crie um usuário com e-mail e senha.
3. Esse usuário poderá entrar no painel administrativo.

## 3. Configurar o front-end

Abra `app.js` e substitua:

```js
const SUPABASE_URL = "COLE_SUA_SUPABASE_URL_AQUI";
const SUPABASE_ANON_KEY = "COLE_SUA_SUPABASE_ANON_KEY_AQUI";
```

pelos dados de **Project Settings > API**.

Use somente a chave pública `anon`/`publishable`.
NUNCA coloque `service_role`/secret key no JavaScript do site.

## 4. Publicar no GitHub

Suba estes arquivos no repositório:

```text
index.html
style.css
app.js
supabase.sql
README.md
```

Ative GitHub Pages em **Settings > Pages**.

## 5. Painel administrativo

Acesse:

```text
https://SEU-SITE/?admin=true
```

O parâmetro apenas abre a tela de login. A proteção real vem do Supabase Auth + RLS.

## O que já está incluído

- Layout responsivo e visual mais premium.
- Fotos dos produtos por URL.
- Carrinho com +/−.
- Resumo de subtotal, entrega e total.
- Entrega ou retirada.
- Endereço, data e observação.
- Pedido salvo no Supabase.
- Pedido enviado para o WhatsApp com mensagem pronta.
- Dashboard com hoje/7 dias/30 dias.
- Status: pendente, confirmado, preparando, saiu para entrega, entregue e cancelado.
- Filtro de pedidos.
- Cadastro/edição/exclusão de produtos.
- Configurações do negócio pelo painel.
- Avaliações com aprovação antes de aparecerem no site.
- Produtos mais pedidos.
- Login administrativo.
- Sem dependência de localStorage para dados do negócio.

## Observação sobre imagens

O painel aceita URL de imagem. Para uma versão futura, pode-se adicionar upload direto para o Supabase Storage.
