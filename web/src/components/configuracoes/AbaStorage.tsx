"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Field, Input } from "@/components/ui";
import { Switch } from "@/components/ui";

type ProvedorStorage = "local" | "s3";

export function AbaStorage() {
  const [provedor, setProvedor] = useState<ProvedorStorage>("local");

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-zinc-700">Provedor de armazenamento</h3>
          <p className="mt-1 text-xs text-zinc-400">
            Arquivos já enviados antes da troca não são migrados automaticamente.
          </p>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setProvedor("local")}
              className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors ${
                provedor === "local"
                  ? "border-sky-300 bg-sky-50"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <span className={`text-sm font-medium ${provedor === "local" ? "text-sky-700" : "text-zinc-800"}`}>
                Disco do servidor
              </span>
              <span className="text-xs text-zinc-400">
                Padrão. Arquivos salvos no servidor de hospedagem. Sem custo adicional.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setProvedor("s3")}
              className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors ${
                provedor === "s3"
                  ? "border-sky-300 bg-sky-50"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <span className={`text-sm font-medium ${provedor === "s3" ? "text-sky-700" : "text-zinc-800"}`}>
                S3-compatible externo
              </span>
              <span className="text-xs text-zinc-400">
                AWS S3 ou Cloudflare R2. Maior escala e CDN de entrega.
              </span>
            </button>
          </div>
        </CardBody>
      </Card>

      {provedor === "s3" && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-zinc-700">Configuração S3</h3>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Bucket" required>
                <Input name="s3Bucket" placeholder="meu-bucket" />
              </Field>
              <Field label="Região" required>
                <Input name="s3Regiao" placeholder="us-east-1" />
              </Field>
              <Field label="Access Key ID" required>
                <Input name="s3AccessKey" placeholder="AKIA..." />
              </Field>
              <Field label="Secret Access Key" required>
                <Input name="s3SecretKey" type="password" placeholder="••••••••••••" />
              </Field>
              <Field
                label="Endpoint customizado"
                hint="Deixe em branco para AWS S3. Para Cloudflare R2 use https://<account>.r2.cloudflarestorage.com"
                className="sm:col-span-2"
              >
                <Input name="s3Endpoint" placeholder="https://..." />
              </Field>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              Teste a conexão antes de salvar para garantir que o bucket está acessível com as credenciais informadas.
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">Testar conexão</Button>
              <Button size="sm">Salvar configuração</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {provedor === "local" && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-zinc-700">Configuração local</h3>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <Field label="Caminho de upload" hint="Relativo à raiz do projeto. Padrão: uploads/">
              <Input name="uploadPath" defaultValue="uploads/" />
            </Field>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-500">
              A pasta <code className="font-mono">uploads/</code> está no <code className="font-mono">.gitignore</code> — arquivos enviados em produção nunca entram no controle de versão.
            </div>
            <div className="flex justify-end">
              <Button size="sm">Salvar configuração</Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
