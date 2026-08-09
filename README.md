# Site (GitHub Pages) — Imersão Igreja

Publicado em: **https://elizandra-tfrm.github.io/imersao-igreja/**
(repositório: [elizandra-tfrm/imersao-igreja](https://github.com/elizandra-tfrm/imersao-igreja))

Front estático (HTML/CSS/JS puro, sem build) que fala com o backend em Google Apps Script
via `fetch`. Veja o backend completo em [`../apps-script`](../apps-script).

## Arquivos

| Arquivo | Papel |
|---|---|
| `index.html` | Formulário de inscrição |
| `sucesso.html` | Página de confirmação (fica dando polling no status até o webhook do PagBank confirmar o pagamento) |
| `comprovante.html` | Baixa o comprovante em PDF gerado pelo backend |
| `styles.css` | Estilo compartilhado pelas 3 páginas |
| `config.js` | **Único arquivo que precisa ser editado** — a URL do deployment do Apps Script |
| `api.js` | Helpers de `fetch` (GET/POST) para chamar a API do Apps Script |

## Configuração obrigatória antes de publicar

1. Publique o Apps Script como Web App (veja `../apps-script/README.md`, seção 4) e copie a URL `/exec`.
2. Edite `config.js` e cole a URL na constante `WEBAPP_URL`.
3. No menu **⛪ Imersão Igreja** da planilha, rode **"5. Configurar URL do site (GitHub Pages)"** e cole `https://elizandra-tfrm.github.io/imersao-igreja` — isso faz o PagBank redirecionar de volta para cá (e não mais para a página antiga do Apps Script) depois do pagamento.
4. Publique uma nova versão do deployment do Apps Script (Manage deployments → New version) para a mudança do passo 3 valer.

## Por que isso existe (em vez de servir tudo pelo Apps Script)

Web Apps do Apps Script abertos anonimamente mostram um aviso do Google
("Este aplicativo foi criado por um usuário do Google Apps Script") no topo da
página — inofensivo, mas não é uma boa primeira impressão logo antes de pedir
para a pessoa pagar. Hospedando o front no GitHub Pages, a pessoa nunca navega
direto para uma URL `script.google.com`: só o `fetch` de bastidores fala com
ela. O Apps Script continua sendo o único lugar com o token do PagBank e o
acesso à planilha/Drive — nunca exposto no código deste site.
