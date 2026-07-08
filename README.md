# 🐢 Tartaruga Sortuda - Slots Ultimate

[![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)]()
[![Python](https://img.shields.io/badge/Python-3.6%2B-blue)](https://www.python.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3-lightgrey)](https://www.sqlite.org/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Um jogo de caça‑níqueis (slot machine) com tema de tartaruga, desenvolvido em **HTML, CSS, JavaScript** (frontend) e **Python** (backend).  
O jogo utiliza um banco de dados **SQLite** local para armazenar dados de usuários, saldo, ranking e lucro da banca, sem necessidade de serviços externos.

---

## 🎮 Funcionalidades

- **Sistema de Login**: qualquer nome de usuário é aceito; saldo inicial: 1000 créditos.
- **Slots com 7 símbolos**: tartaruga (maior valor), trevo, diamante, estrela, concha, onda e melancia.
- **Linha do meio (3 rolos)**: combinações especiais (3 tartarugas, 2 tartarugas + trevo, etc.) geram bônus.
- **Multiplicador de vitórias consecutivas**: aumenta até 3× após 3 vitórias seguidas.
- **Acúmulo de tartarugas**: ao coletar 20 tartarugas, ganha um bônus extra.
- **Rodadas grátis**: ao conseguir 3 trevos, você ganha 2 rodadas grátis.
- **Jackpot**: acumula uma pequena porcentagem das apostas e vitórias; estoura ao conseguir 3 tartarugas.
- **Sistema de nível e XP**: cada vitória gera XP; a cada 100 XP, sobe de nível e ganha 500 créditos.
- **Missões diárias**: 4 missões diárias (girar 10 vezes, ganhar 3 seguidas, acumular 5 tartarugas, ganhar >500 em uma rodada) que recompensam com créditos.
- **Ranking**: exibe as 10 maiores vitórias.
- **Controle de aposta**: ajuste de aposta, botões de +100, -100, MAX e giro automático (5 ou 10 giros).
- **Efeitos visuais**: animações de vitória, confetes, shake na tela e destaque da linha do meio.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Python 3 (`http.server`, `sqlite3`)
- **Banco de Dados**: SQLite (local)
- **Ferramentas adicionais**: Git, Docker (opcional), PyInstaller (para gerar executável)

---

## 📦 Estrutura do Projeto

```bash
/
├── server.py          # Servidor HTTP com API e SQLite
├── index.html         # Página principal do jogo
├── game.js            # Lógica do jogo (frontend)
├── style.css          # Estilos e animações
├── img/               # Imagens do jogo (símbolos, logo, tartaruga, etc.)
├── requirements.txt   # Dependências (para pyinstaller, opcional)
├── Dockerfile         # Para containerização (opcional)
├── .gitignore         # Arquivos e pastas ignorados pelo Git
└── README.md          # Este arquivo
```

---

## 🚀 Como Executar o Projeto

### ✅ Pré‑requisitos

- Python 3.6 ou superior instalado.
- Navegador moderno (Chrome, Firefox, Edge, etc.).

### 🔧 Passo a Passo

1. **Clone o repositório** (ou baixe os arquivos):

```bash
git clone https://github.com/seu-usuario/tartaruga-slots.git
cd tartaruga-slots
```

2. **Execute o servidor Python**:

```bash
python server.py
```

O servidor iniciará na porta `8080` (padrão) e criará automaticamente o banco de dados `slots.db` na primeira execução.

3. **Acesse o jogo no navegador**:

- Abra `http://localhost:8080`
- Digite um nome de usuário (qualquer nome) e clique em **Entrar**.
- O saldo inicial será de **1000 créditos**.

4. **Divirta‑se!** 🎰

---

### 🐳 Docker (Opcional)

Se preferir rodar com Docker:

```bash
docker build -t tartaruga-slots .
docker run -p 8080:8080 tartaruga-slots
```

Acesse `http://localhost:8080` da mesma forma.

---

### 🏗️ Gerar Executável (.exe) com PyInstaller

Caso queira distribuir o jogo como um único executável para Windows:

1. Instale o PyInstaller:

```bash
pip install pyinstaller
```

2. Execute o comando:

```bash
pyinstaller --onefile --add-data "index.html;." --add-data "style.css;." --add-data "game.js;." --add-data "img;img" server.py
```

O executável estará em `dist/server.exe`. Copie‑o para a pasta desejada (não precisa dos demais arquivos, pois eles foram embutidos).  
Lembre‑se de que o banco de dados SQLite será criado na mesma pasta do executável.

---

## 🗃️ Banco de Dados (SQLite)

O arquivo `slots.db` é criado automaticamente e contém as seguintes tabelas:

- `tb_usuario`: usuários (id, nome_usuario, saldo, etc.)
- `tb_movimentacoes`: registro de vitórias (valor, data, fk_usuario)
- `tb_jogos`: saldo do jogo (lucro da banca) – tabela usada para controle financeiro.

Para resetar os dados, basta excluir o arquivo `slots.db` e reiniciar o servidor.

---

## 🤝 Contribuição

Contribuições são bem‑vindas! Para sugerir melhorias, reportar bugs ou enviar pull requests, sinta‑se à vontade.

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas alterações (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é de uso livre para fins educacionais e de estudo. Modifique e compartilhe à vontade.

---

## 👨‍💻 Autor

Desenvolvido como projeto de sala de aula.  
**Tartaruga Sortuda - Slots Ultimate** 🐢✨

## 👥 Equipe

Projeto desenvolvido de forma colaborativa para fins acadêmicos:

| [<img src="https://github.com/douglasbecker404.png" width=115><br><sub>**douglasbecker404**</sub>](https://github.com/douglasbecker404) | [<img src="https://github.com/Guspelepe.png" width=115><br><sub>**Guspelepe**</sub>](https://github.com/Guspelepe) | [<img src="https://github.com/ronaldokaras.png" width=115><br><sub>**Ronaldo Karas**</sub>](https://github.com/ronaldokaras) |
| :---: | :---: | :---: |
| **Desenvolvedor** | **Desenvolvedor** | **Desenvolvedor** |


Divirta‑se e boa sorte! 🍀
```
