'use client';

import { Suspense, useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Upload, FileText, FileSpreadsheet, X, AlertCircle, Loader2 } from 'lucide-react';
import {
  api,
  uploadFile,
  type BankAccountConfig,
  type Category,
  type CreditCardConfig,
  type ImportKind,
  type UploadResponse,
} from '@/lib/api';
import UploadPreview from '@/components/Upload/UploadPreview';
import { useIsMobile } from '@/hooks/useIsMobile';
import Link from 'next/link';

type Stage = 'idle' | 'uploading' | 'preview' | 'error' | 'already_imported';

const ACCEPT_CARD = ['.pdf', '.xlsx', '.xls'];
const ACCEPT_BANK_STATEMENT = ['.ofx', '.qfx'];
const ACCEPTED_MIME_CARD = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatImportedAtPt(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function UploadPageInner() {
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const uploadType = searchParams.get('type');
  const cardIdParam = searchParams.get('cardId');
  const bankIdParam = searchParams.get('bankAccountId');
  const cardId = cardIdParam ? Number(cardIdParam) : null;
  const bankAccountIdPreset = bankIdParam ? Number(bankIdParam) : null;

  const isCreditCardType = uploadType === 'credit_card';
  const isBankStatementType = uploadType === 'bank_statement';

  const [stage, setStage] = useState<Stage>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [card, setCard] = useState<CreditCardConfig | null>(null);
  const [cards, setCards] = useState<CreditCardConfig[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountConfig[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedBank = bankAccounts.find(b => b.id === selectedBankId) ?? null;

  useEffect(() => {
    if (!isCreditCardType) return;
    void Promise.all([
      api.listCards(),
      api.listCategories('credit_card'),
    ])
      .then(([cardsData, categoryData]) => {
        setCards(cardsData);
        setCategories(categoryData);
        if (cardId != null && Number.isFinite(cardId)) {
          const preSelected = cardsData.find(c => c.id === cardId) ?? null;
          setCard(preSelected);
        }
      })
      .catch(err => {
        setErrorMessage(err instanceof Error ? err.message : 'Erro ao carregar dados do cartão.');
        setStage('error');
      });
  }, [isCreditCardType, cardId]);

  useEffect(() => {
    if (!isBankStatementType) return;
    void Promise.all([
      api.listBankAccounts(false),
      api.listCategories('bank'),
    ])
      .then(([banksData, categoryData]) => {
        const active = banksData.filter(b => b.is_active);
        setBankAccounts(active);
        setCategories(categoryData);
        if (bankAccountIdPreset != null && Number.isFinite(bankAccountIdPreset)) {
          const pre = active.find(b => b.id === bankAccountIdPreset);
          if (pre) setSelectedBankId(pre.id);
        }
      })
      .catch(err => {
        setErrorMessage(err instanceof Error ? err.message : 'Erro ao carregar contas.');
        setStage('error');
      });
  }, [isBankStatementType, bankAccountIdPreset]);

  const isValidFile = useCallback((file: File): boolean => {
    const nameLower = file.name.toLowerCase();
    if (isBankStatementType) {
      const extOk = ACCEPT_BANK_STATEMENT.some(ext => nameLower.endsWith(ext));
      return extOk;
    }
    const extOk = ACCEPT_CARD.some(ext => nameLower.endsWith(ext));
    const mimeOk = !file.type || ACCEPTED_MIME_CARD.includes(file.type) || file.type === 'application/octet-stream';
    return extOk && mimeOk;
  }, [isBankStatementType]);

  const handleFile = useCallback((file: File) => {
    if (!isValidFile(file)) {
      if (isBankStatementType) {
        setErrorMessage(`Use um arquivo OFX (.ofx ou .qfx). Recebido: "${file.name}".`);
      } else {
        setErrorMessage(`Tipo de arquivo não suportado: "${file.name}". Use PDF ou Excel (.xlsx).`);
      }
      setStage('error');
      return;
    }
    setSelectedFile(file);
    setErrorMessage('');
    setStage('idle');
  }, [isValidFile, isBankStatementType]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setErrorMessage('');
    setStage('idle');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (isBankStatementType && !selectedBankId) return;
    setStage('uploading');
    setErrorMessage('');

    try {
      const importKind: ImportKind | undefined = isBankStatementType
        ? 'bank_statement'
        : isCreditCardType
          ? 'credit_card_invoice'
          : undefined;
      const result = await uploadFile(selectedFile, {
        importKind,
        bankAccountId:
          isBankStatementType && selectedBankId != null ? selectedBankId : undefined,
      });
      setUploadResult(result);
      if (isBankStatementType && result.already_imported) {
        setStage('already_imported');
      } else {
        setStage('preview');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido ao processar o arquivo.';
      setErrorMessage(msg);
      setStage('error');
    }
  };

  const handleImportDone = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setStage('idle');
  };

  const fileAccept = isBankStatementType ? ACCEPT_BANK_STATEMENT.join(',') : ACCEPT_CARD.join(',');

  if (
    stage === 'already_imported' &&
    uploadResult?.already_imported &&
    uploadResult.existing_import_batch &&
    isBankStatementType
  ) {
    const ex = uploadResult.existing_import_batch;
    return (
      <div style={{
        padding: isMobile ? '20px 16px 28px' : '32px 40px',
        maxWidth: 560,
        margin: '0 auto',
        width: '100%',
      }}>
        <div style={{
          borderRadius: 14,
          border: '1px solid rgba(214,158,46,0.35)',
          background: 'rgba(214,158,46,0.08)',
          padding: isMobile ? 18 : 22,
          display: 'flex',
          gap: 14,
          alignItems: 'flex-start',
        }}>
          <AlertCircle size={22} style={{ flexShrink: 0, marginTop: 2, color: 'var(--amber-400)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: isMobile ? 17 : 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              Este arquivo já foi importado para esta conta
            </h2>
            <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Não é possível importar novamente o mesmo arquivo OFX já processado nesta conta.
              Use outro período/outro arquivo ou outra conta bancária.
            </p>
            <ul style={{
              margin: '0 0 18px',
              paddingLeft: 18,
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
            }}>
              <li><strong>Arquivo:</strong> {ex.file_name}</li>
              <li><strong>Importado em:</strong> {formatImportedAtPt(ex.imported_at)}</li>
              <li><strong>Importados:</strong> {ex.imported_count}</li>
              <li><strong>Ignorados:</strong> {ex.skipped_count}</li>
            </ul>
            <button
              type="button"
              onClick={clearFile}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                border: '1px solid var(--border-default)',
                background: 'var(--surface-card)',
                color: 'var(--text-primary)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'preview' && uploadResult && !uploadResult.already_imported) {
    return (
      <UploadPreview
        result={uploadResult}
        card={card}
        cards={cards}
        categories={categories}
        uploadType={uploadType}
        importKind={isBankStatementType ? 'bank_statement' : undefined}
        bankAccount={selectedBank}
        onBack={clearFile}
        onImportDone={handleImportDone}
      />
    );
  }

  return (
    <div style={{
      padding: isMobile ? '20px 16px 28px' : '32px 40px',
      maxWidth: 680,
      margin: '0 auto',
      width: '100%',
    }}>
      <div style={{ marginBottom: isMobile ? 20 : 32 }}>
        <h1 style={{
          fontSize: isMobile ? 19 : 22,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 6,
        }}>
          {isBankStatementType ? 'Importar extrato bancário' : 'Importar extrato'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: isMobile ? 13 : 14, lineHeight: 1.45 }}>
          {isBankStatementType
            ? 'Selecione a conta bancária e envie o arquivo OFX exportado pelo seu banco. Os lançamentos serão revisados antes de salvar.'
            : isCreditCardType && card
              ? `Envie a fatura do cartão ${card.name} para revisar e importar os lançamentos.`
              : isCreditCardType
                ? 'Envie a fatura do cartão de crédito. Você selecionará o cartão na próxima etapa.'
                : 'Envie um extrato bancário (PDF) ou planilha (Excel) para extrair e revisar os lançamentos antes de salvar.'}
        </p>
      </div>

      {isBankStatementType && (
        <div style={{
          marginBottom: 18,
          padding: '14px 16px',
          borderRadius: 12,
          border: '1px solid var(--border-subtle)',
          background: 'var(--surface-card)',
        }}>
          <label style={{ display: 'grid', gap: 6, fontSize: 13 }}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Conta bancária</span>
            {bankAccounts.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Nenhuma conta ativa. Cadastre uma conta para importar o extrato.
                <div style={{ marginTop: 10 }}>
                  <Link
                    href="/contas"
                    style={{
                      display: 'inline-flex',
                      padding: '8px 14px',
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 13,
                      textDecoration: 'none',
                    }}
                  >
                    Cadastrar conta bancária
                  </Link>
                </div>
              </div>
            ) : (
              <select
                value={selectedBankId ?? ''}
                onChange={e => setSelectedBankId(e.target.value ? Number(e.target.value) : null)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${!selectedBankId ? 'rgba(229,62,62,0.45)' : 'var(--border-default)'}`,
                  background: 'var(--surface-panel)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                }}
              >
                <option value="">Selecione a conta</option>
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}{b.institution ? ` — ${b.institution}` : ''}
                  </option>
                ))}
              </select>
            )}
            {bankAccounts.length > 0 && !selectedBankId && (
              <span style={{ fontSize: 12, color: 'var(--red-400)' }}>Obrigatório para continuar.</span>
            )}
          </label>
        </div>
      )}

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !selectedFile && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--blue-500)' : selectedFile ? 'var(--green-500)' : 'var(--border-default)'}`,
          borderRadius: 16,
          background: dragOver
            ? 'rgba(49,130,206,0.06)'
            : selectedFile
              ? 'rgba(56,161,105,0.05)'
              : 'var(--surface-panel)',
          padding: isMobile ? '32px 20px' : '48px 32px',
          textAlign: 'center',
          cursor: selectedFile ? 'default' : 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative',
          opacity: isBankStatementType && bankAccounts.length === 0 ? 0.55 : 1,
          pointerEvents: isBankStatementType && bankAccounts.length === 0 ? 'none' : undefined,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={fileAccept}
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />

        {!selectedFile ? (
          <>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'rgba(49,130,206,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Upload size={24} color="var(--blue-400)" />
            </div>
            <p style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              {dragOver
                ? 'Solte o arquivo aqui'
                : isMobile
                  ? 'Toque para selecionar arquivo'
                  : 'Arraste o arquivo ou clique para selecionar'}
            </p>
            <p style={{ fontSize: isMobile ? 12 : 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {isBankStatementType
                ? 'Arquivo OFX (.ofx ou .qfx)'
                : isMobile
                  ? 'PDF ou Excel (.xlsx)'
                  : 'PDF ou Excel (.xlsx) — extratos Nubank, Itaú, Mercado Pago, Fatura Nubank'}
            </p>
          </>
        ) : (
          <>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: /\.(ofx|qfx)$/i.test(selectedFile.name)
                ? 'rgba(49,130,206,0.18)'
                : selectedFile.name.toLowerCase().endsWith('.pdf')
                  ? 'rgba(229,62,62,0.15)'
                  : 'rgba(56,161,105,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              {/\.(ofx|qfx)$/i.test(selectedFile.name)
                ? <FileText size={24} color="var(--blue-400)" />
                : selectedFile.name.toLowerCase().endsWith('.pdf')
                  ? <FileText size={24} color="var(--red-400)" />
                  : <FileSpreadsheet size={24} color="var(--green-400)" />}
            </div>

            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              {selectedFile.name}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 0 }}>
              {formatBytes(selectedFile.size)}
              {' · '}
              {isBankStatementType ? 'OFX' : selectedFile.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Excel'}
            </p>

            <button
              onClick={e => { e.stopPropagation(); clearFile(); }}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '1px solid var(--border-default)',
                background: 'var(--surface-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
            >
              <X size={14} />
            </button>
          </>
        )}
      </div>

      {stage === 'error' && errorMessage && (
        <div style={{
          marginTop: 16,
          padding: '12px 16px',
          borderRadius: 10,
          background: 'rgba(229,62,62,0.1)',
          border: '1px solid rgba(229,62,62,0.25)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          color: 'var(--red-400)',
          fontSize: 13,
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {selectedFile && stage !== 'uploading' && (
        <button
          onClick={handleUpload}
          disabled={isBankStatementType && (!selectedBankId || bankAccounts.length === 0)}
          style={{
            marginTop: 20,
            width: '100%',
            padding: '13px 24px',
            borderRadius: 10,
            border: 'none',
            background: isBankStatementType && (!selectedBankId || bankAccounts.length === 0)
              ? 'var(--surface-card)'
              : 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
            color: isBankStatementType && (!selectedBankId || bankAccounts.length === 0)
              ? 'var(--text-muted)'
              : '#fff',
            fontSize: 15,
            fontWeight: 600,
            cursor: isBankStatementType && (!selectedBankId || bankAccounts.length === 0)
              ? 'not-allowed'
              : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'opacity 0.15s',
          }}
        >
          <Upload size={16} />
          Continuar
        </button>
      )}

      {stage === 'uploading' && (
        <div style={{
          marginTop: 20,
          width: '100%',
          padding: '13px 24px',
          borderRadius: 10,
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-secondary)',
          fontSize: 15,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          Processando arquivo...
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Formatos suportados
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(isBankStatementType
            ? ['OFX genérico (extrato)']
            : [
                'Nubank PF (extrato)',
                'Nubank PJ (extrato)',
                'Fatura Cartão Nubank',
                'Itaú Uniclass',
                'Mercado Pago',
              ]
          ).map(label => (
            <span key={label} style={{
              padding: '4px 10px',
              borderRadius: 6,
              background: 'var(--surface-card)',
              border: '1px solid var(--border-subtle)',
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}>
              {label}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32, color: 'var(--text-muted)' }}>Carregando...</div>}>
      <UploadPageInner />
    </Suspense>
  );
}
