import http.server
import json
import sqlite3
import traceback
import re
import sys
import os
from datetime import datetime

DB_PATH = "slots.db"

if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

os.chdir(BASE_DIR)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tb_usuario (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT,
                data_nascimento INTEGER,
                telefone TEXT,
                email TEXT,
                saldo INTEGER,
                nome_usuario TEXT UNIQUE
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tb_movimentacoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                valor INTEGER,
                data_transacao INTEGER,
                fk_usuario INTEGER,
                FOREIGN KEY (fk_usuario) REFERENCES tb_usuario(id)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tb_jogada (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                balanco INTEGER,
                data_jogo INTEGER,
                fk_movimentacoes INTEGER,
                FOREIGN KEY (fk_movimentacoes) REFERENCES tb_movimentacoes(id)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tb_jogos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT,
                saldo INTEGER
            )
        """)
        cur = conn.execute("SELECT id FROM tb_jogos WHERE nome = ?", ("slots",))
        if not cur.fetchone():
            conn.execute("INSERT INTO tb_jogos (nome, saldo) VALUES (?, ?)", ("slots", 0))
        conn.commit()

def executar_sql(sql, params=()):
    # (mantida toda a função original, sem alterações)
    with get_db() as conn:
        sql_upper = sql.strip().upper()
        if sql_upper == "SELECT 1":
            conn.execute("SELECT 1")
            return {"rows": []}
        if re.match(r"SELECT\s+creditos\s+FROM\s+tb_usuario\s+WHERE\s+user\s*=\s*\?", sql, re.IGNORECASE):
            nome = params[0]
            cur = conn.execute("SELECT saldo FROM tb_usuario WHERE nome_usuario = ?", (nome,))
            row = cur.fetchone()
            if row:
                return {"rows": [{"creditos": row["saldo"]}]}
            else:
                return {"rows": []}
        if re.match(r"INSERT\s+INTO\s+tb_usuario\s*\(\s*user\s*,\s*creditos\s*\)\s*VALUES\s*\(\s*\?\s*,\s*\?\s*\)", sql, re.IGNORECASE):
            nome = params[0]
            saldo = params[1]
            cur = conn.execute("SELECT id, saldo FROM tb_usuario WHERE nome_usuario = ?", (nome,))
            row = cur.fetchone()
            if not row:
                conn.execute("INSERT INTO tb_usuario (nome_usuario, saldo) VALUES (?, ?)", (nome, 1000))
            else:
                antigo = row["saldo"]
                conn.execute("UPDATE tb_usuario SET saldo = ? WHERE nome_usuario = ?", (saldo, nome))
                variacao = saldo - antigo
                atualizar_saldo_jogo(conn, variacao)
            return {"rows": []}
        if re.match(r"INSERT\s+INTO\s+tb_usuario\s*\(\s*user\s*,\s*creditos\s*\)\s*VALUES\s*\(\s*\?\s*,\s*\?\s*\)\s+ON\s+CONFLICT", sql, re.IGNORECASE):
            nome = params[0]
            saldo = params[1]
            cur = conn.execute("SELECT id, saldo FROM tb_usuario WHERE nome_usuario = ?", (nome,))
            row = cur.fetchone()
            if not row:
                conn.execute("INSERT INTO tb_usuario (nome_usuario, saldo) VALUES (?, ?)", (nome, saldo))
            else:
                antigo = row["saldo"]
                conn.execute("UPDATE tb_usuario SET saldo = ? WHERE nome_usuario = ?", (saldo, nome))
                variacao = saldo - antigo
                atualizar_saldo_jogo(conn, variacao)
            return {"rows": []}
        if re.match(r"SELECT\s+nome\s*,\s*win\s*,\s*data\s+FROM\s+ranking\s+ORDER\s+BY\s+win\s+DESC\s+LIMIT\s+10", sql, re.IGNORECASE):
            cur = conn.execute("""
                SELECT u.nome_usuario AS nome, m.valor AS win, m.data_transacao AS data
                FROM tb_movimentacoes m
                JOIN tb_usuario u ON m.fk_usuario = u.id
                WHERE m.valor > 0
                ORDER BY m.valor DESC
                LIMIT 10
            """)
            rows = [dict(row) for row in cur.fetchall()]
            return {"rows": rows}
        if re.match(r"INSERT\s+INTO\s+ranking\s*\(\s*nome\s*,\s*win\s*,\s*data\s*\)\s*VALUES\s*\(\s*\?\s*,\s*\?\s*,\s*\?\s*\)", sql, re.IGNORECASE):
            nome = params[0]
            win = params[1]
            data_ts = params[2]
            cur = conn.execute("SELECT id FROM tb_usuario WHERE nome_usuario = ?", (nome,))
            row = cur.fetchone()
            if not row:
                conn.execute("INSERT INTO tb_usuario (nome_usuario, saldo) VALUES (?, ?)", (nome, 1000))
                cur = conn.execute("SELECT id FROM tb_usuario WHERE nome_usuario = ?", (nome,))
                row = cur.fetchone()
            user_id = row["id"]
            conn.execute("INSERT INTO tb_movimentacoes (valor, data_transacao, fk_usuario) VALUES (?, ?, ?)", (win, data_ts, user_id))
            return {"rows": []}
        if sql_upper.startswith("SELECT"):
            cur = conn.execute(sql, params)
            rows = [dict(row) for row in cur.fetchall()]
            return {"rows": rows}
        else:
            conn.execute(sql, params)
            conn.commit()
            return {"rows": []}

def atualizar_saldo_jogo(conn, variacao_usuario):
    lucro_banca = -variacao_usuario
    conn.execute("UPDATE tb_jogos SET saldo = saldo + ? WHERE nome = ?", (lucro_banca, "slots"))

class TursoProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/api/ping":
            try:
                executar_sql("SELECT 1")
                self.send_json(200, {"status": "ok"})
            except Exception as e:
                self.send_json(500, {"error": str(e)})
            return

        if self.path == "/api/diagnose":
            try:
                tables = executar_sql("SELECT name FROM sqlite_master WHERE type='table'")
                user_count = executar_sql("SELECT COUNT(*) AS cnt FROM tb_usuario")
                jogos_saldo = executar_sql("SELECT nome, saldo FROM tb_jogos")
                self.send_json(200, {
                    "status": "ok",
                    "tables": [r["name"] for r in tables["rows"]],
                    "user_count": user_count["rows"][0]["cnt"] if user_count["rows"] else 0,
                    "jogos": jogos_saldo.get("rows", [])
                })
            except Exception as e:
                self.send_json(500, {"error": str(e)})
            return

        if self.path == "/api/jogo/saldo":
            try:
                result = executar_sql("SELECT saldo FROM tb_jogos WHERE nome = ?", ("slots",))
                saldo = result["rows"][0]["saldo"] if result.get("rows") else 0
                self.send_json(200, {"jogo": "slots", "saldo": saldo})
            except Exception as e:
                self.send_json(500, {"error": str(e)})
            return

        # NOVO ENDPOINT DE SINCRONIZAÇÃO ÚNICA
        if self.path == "/api/sync":
            length = int(self.headers['Content-Length'])
            body = self.rfile.read(length)
            try:
                data = json.loads(body)
                user = data.get("user")
                credits = int(data.get("credits", 0))
                win = int(data.get("win", 0))

                if not user:
                    self.send_json(400, {"error": "Campo 'user' obrigatório"})
                    return

                with get_db() as conn:
                    # 1. Usuário: upsert e atualizar saldo do jogo
                    cur = conn.execute("SELECT id, saldo FROM tb_usuario WHERE nome_usuario = ?", (user,))
                    row = cur.fetchone()
                    if not row:
                        conn.execute("INSERT INTO tb_usuario (nome_usuario, saldo) VALUES (?, ?)", (user, credits))
                        user_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
                    else:
                        user_id = row["id"]
                        old_credits = row["saldo"]
                        conn.execute("UPDATE tb_usuario SET saldo = ? WHERE id = ?", (credits, user_id))
                        variacao = credits - old_credits
                        atualizar_saldo_jogo(conn, variacao)

                    # 2. Registrar vitória (se houver)
                    if win > 0:
                        now_ts = int(datetime.utcnow().timestamp())
                        conn.execute(
                            "INSERT INTO tb_movimentacoes (valor, data_transacao, fk_usuario) VALUES (?, ?, ?)",
                            (win, now_ts, user_id)
                        )

                    conn.commit()
                self.send_json(200, {"status": "ok"})
            except Exception as e:
                traceback.print_exc()
                self.send_json(500, {"error": str(e)})
            return

        if self.path == "/api/":
            length = int(self.headers['Content-Length'])
            body = self.rfile.read(length)
            try:
                data = json.loads(body)
                sql = data.get("sql", "")
                params = data.get("params", [])
                result = executar_sql(sql, params)
                self.send_json(200, result)
            except Exception as e:
                traceback.print_exc()
                self.send_json(500, {"error": str(e)})
            return

        self.send_response(404)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/ping":
            try:
                executar_sql("SELECT 1")
                self.send_json(200, {"status": "ok"})
            except Exception as e:
                self.send_json(500, {"error": str(e)})
            return
        if self.path == "/api/diagnose":
            try:
                tables = executar_sql("SELECT name FROM sqlite_master WHERE type='table'")
                user_count = executar_sql("SELECT COUNT(*) AS cnt FROM tb_usuario")
                jogos_saldo = executar_sql("SELECT nome, saldo FROM tb_jogos")
                self.send_json(200, {
                    "status": "ok",
                    "tables": [r["name"] for r in tables["rows"]],
                    "user_count": user_count["rows"][0]["cnt"] if user_count["rows"] else 0,
                    "jogos": jogos_saldo.get("rows", [])
                })
            except Exception as e:
                self.send_json(500, {"error": str(e)})
            return
        if self.path == "/api/jogo/saldo":
            try:
                result = executar_sql("SELECT saldo FROM tb_jogos WHERE nome = ?", ("slots",))
                saldo = result["rows"][0]["saldo"] if result.get("rows") else 0
                self.send_json(200, {"jogo": "slots", "saldo": saldo})
            except Exception as e:
                self.send_json(500, {"error": str(e)})
            return
        if self.path.startswith('/img/'):
            try:
                with open(self.path[1:], 'rb') as f:
                    data = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'image/png')  # Ajuste conforme necessário
                self.send_header('Cache-Control', 'public, max-age=86400')  # 1 dia
                self.end_headers()
                self.wfile.write(data)
                return
            except:
                pass

        super().do_GET()

    def send_json(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

if __name__ == "__main__":
    init_db()
    PORT = int(os.environ.get("PORT", 8080))
    print(f"🔥 Servidor rodando em http://localhost:{PORT}")
    print("📊 Saldo do jogo 'slots' é atualizado automaticamente a cada giro (lucro da banca).")
    print(f"👉 Para ver o lucro atual: http://localhost:{PORT}/api/jogo/saldo")
    print("✅ Usuários são criados automaticamente ao fazer login.")
    server = http.server.HTTPServer(("0.0.0.0", PORT), TursoProxyHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Servidor encerrado.")
        server.server_close()