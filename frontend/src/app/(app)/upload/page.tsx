'use client';

import { Suspense, useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Upload, FileText, FileSpreadsheet, X, AlertCircle, Loader2 } from 'lucide-react';
import { api, uploadFile, type Category, type CreditCardConfig, type UploadResponse } from '@/lib/api';
import UploadPreview from '@/components/Upload/UploadPreview';

type Stage = 'idle' | 'uploading' | 'preview' | 'error';

const ACCEPTED_EXTENSIONS = ['.pdf', '.xlsx', '.xls'];
const ACCEPTED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isValidFile(file: File): boolean {
  const nameLower = file.name.toLowerCase();
  const extOk = ACCEPTED_EXTENSIONS.some(ext => nameLower.endsWith(ext));
  const mimeOk = !file.type || ACCEPTED_MIME.includes(file.type) || file.type === 'application/octet-stream';
  return extOk && mimeOk;
}

function UploadPageInner() {
  const searchParams = useSearchParams();
  const uploadType = searchParams.get('type');
  const cardIdParam = searchParams.get('cardId');
  const cardId = cardIdParam ? Number(cardIdParam) : null;
  const isCreditCardType = uploadType === 'credit_card';
  const [stage, setStage] = useState<Stage>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [card, setCard] = useState<CreditCardConfig | null>(null);
  const [cards, setCards] = useState<CreditCardConfig[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // ── Seleção de arquivo ──────────────────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    if (!isValidFile(file)) {
      setErrorMessage(`Tipo de arquivo não suportado: "${file.name}". Use PDF ou Excel (.xlsx).`);
      setStage('error');
      return;
    }
    setSelectedFile(file);
    setErrorMessage('');
    setStage('idle');
  }, []);

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

  // ── Upload ──────────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!selectedFile) return;
    setStage('uploading');
    setErrorMessage('');

    try {
      const result = await uploadFile(selectedFile);
      setUploadResult(result);
      setStage('preview');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido ao processar o arquivo.';
      setErrorMessage(msg);
      setStage('error');
    }
  };

  // ── Preview concluído (após importação confirmada) ──────────────────────────

  const handleImportDone = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setStage('idle');
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (stage === 'preview' && uploadResult) {
    return (
      <UploadPreview
        result={uploadResult}
        card={card}
        cards={cards}
        categories={categories}
        uploadType={uploadType}
        onBack={clearFile}
        onImportDone={handleImportDone}
      />
    );
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
          Importar extrato
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          {isCreditCardType && card
            ? `Envie a fatura do cartão ${card.name} para revisar e importar os lançamentos.`
            : isCreditCardType
            ? 'Envie a fatura do cartão de crédito. Você selecionará o cartão na próxima etapa.'
            : 'Envie um extrato bancário (PDF) ou planilha (Excel) para extrair e revisar os lançamentos antes de salvar.'
          }
        </p>
      </div>

      {/* Drop zone */}
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
          padding: '48px 32px',
          textAlign: 'center',
          cursor: selectedFile ? 'default' : 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />

        {!selectedFile ? (
          /* Estado inicial — nenhum arquivo */
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
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              {dragOver ? 'Solte o arquivo aqui' : 'Arraste o arquivo ou clique para selecionar'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              PDF ou Excel (.xlsx) — extratos Nubank, Itaú, Mercado Pago, Fatura Nubank
            </p>
          </>
        ) : (
          /* Arquivo selecionado */
          <>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: selectedFile.name.endsWith('.pdf')
                ? 'rgba(229,62,62,0.15)'
                : 'rgba(56,161,105,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              {selectedFile.name.endsWith('.pdf')
                ? <FileText size={24} color="var(--red-400)" />
                : <FileSpreadsheet size={24} color="var(--green-400)" />
              }
            </div>

            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              {selectedFile.name}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 0 }}>
              {formatBytes(selectedFile.size)}
              {' · '}
              {selectedFile.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Excel'}
            </p>

            {/* Botão limpar */}
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

      {/* Mensagem de erro */}
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

      {/* Botão de processar */}
      {selectedFile && stage !== 'uploading' && (
        <button
          onClick={handleUpload}
          style={{
            marginTop: 20,
            width: '100%',
            padding: '13px 24px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #3182ce 0%, #2c7a7b 100%)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Upload size={16} />
          Processar arquivo
        </button>
      )}

      {/* Loading */}
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

      {/* Formatos suportados */}
      <div style={{ marginTop: 32 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Formatos suportados
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            'Nubank PF (extrato)',
            'Nubank PJ (extrato)',
            'Fatura Cartão Nubank',
            'Itaú Uniclass',
            'Mercado Pago',
          ].map(label => (
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
