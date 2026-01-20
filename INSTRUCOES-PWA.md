# 📱 Configuração PWA - Sistema de Expedição

## ✅ O que foi configurado:

1. **Manifest.json** - Configurações do app instalável
2. **Service Worker** - Cache offline e performance
3. **Metadata** - Tags para instalação no iOS e Android
4. **Registro automático** - Service Worker se registra automaticamente

---

## 📋 Próximo passo: Criar ícones

Você precisa criar 2 ícones PNG:

### **1. icon-192.png** (192x192 pixels)
- Ícone pequeno para Android
- Fundo amarelo (#FFD700)
- Ícone de pacote/caixa no centro

### **2. icon-512.png** (512x512 pixels)
- Ícone grande para splash screen
- Fundo amarelo (#FFD700)
- Ícone de pacote/caixa no centro

**Salve em:** `public/icon-192.png` e `public/icon-512.png`

---

## 🎨 Como criar os ícones:

### **Opção 1: Usar Canva/Figma**
1. Criar quadrado 512x512
2. Fundo amarelo (#FFD700)
3. Adicionar ícone de pacote/caixa
4. Exportar como PNG
5. Redimensionar para 192x192 (versão pequena)

### **Opção 2: Usar gerador online**
- https://www.pwabuilder.com/imageGenerator
- Upload logo
- Gerar ícones automaticamente

---

## 📱 Como instalar o PWA:

### **No Desktop (Chrome/Edge):**
1. Acesse o site
2. Clique no ícone de instalação na barra de endereço
3. Clique em "Instalar"

### **No Android:**
1. Acesse o site no Chrome
2. Menu → "Adicionar à tela inicial"
3. Confirmar

### **No iOS:**
1. Acesse o site no Safari
2. Botão compartilhar
3. "Adicionar à Tela de Início"

---

## ✅ Funcionalidades PWA ativas:

- ✅ Instalável como app
- ✅ Funciona offline (cache básico)
- ✅ Ícone na tela inicial
- ✅ Tela cheia (sem barra do navegador)
- ✅ Splash screen automática
- ✅ Notificações (preparado para futuro)

---

## 🚀 Testar:

1. Faça deploy (push para `dev`)
2. Acesse `expedi-ao-git-dev.vercel.app`
3. Abra DevTools → Application → Manifest
4. Verifique se o manifest está carregado
5. Tente instalar o app

---

**Após criar os ícones, faça commit e push para testar!**
