import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTranslation } from '../i18n/useTranslation';
import { Award, CheckCircle2, Share2, ShieldCheck, Check, Copy, X } from 'lucide-react';
import type { Credential } from '../types';

export const CredentialsPage = () => {
  const credentials = useAppStore((state) => state.credentials);
  const { t } = useTranslation();
  const [selectedCred, setSelectedCred] = useState<Credential | null>(null);
  const [copiedProof, setCopiedProof] = useState(false);

  const handleShareProof = (cred: Credential) => {
    setSelectedCred(cred);
    setCopiedProof(false);
  };

  const handleCopyProofPayload = () => {
    if (!selectedCred) return;
    const proofPayload = JSON.stringify(
      {
        "@context": ["https://www.w3.org/2018/credentials/v1", "https://openvyapar.in/contexts/v1"],
        id: selectedCred.id,
        type: ["VerifiableCredential", selectedCred.type.replace(/\s+/g, '')],
        issuer: selectedCred.issuer,
        issuanceDate: selectedCred.issuedOn,
        expirationDate: selectedCred.expiresOn,
        credentialSubject: {
          id: "OV-4471",
          documentNumber: selectedCred.docNumber,
          status: selectedCred.status,
        },
        proof: {
          type: "Ed25519Signature2020",
          created: new Date().toISOString(),
          proofPurpose: "assertionMethod",
          verificationMethod: `did:ov:${selectedCred.id}#key-1`,
          jws: "eyJhbGciOiJFZERTQSI...9b82c",
        },
      },
      null,
      2
    );
    navigator.clipboard.writeText(proofPayload);
    setCopiedProof(true);
    setTimeout(() => setCopiedProof(false), 2000);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.credentials.title}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t.credentials.subtitle}
        </p>
      </div>

      {/* Primary: Credential Cards Grid (2 columns max on desktop for legibility) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {credentials.map((cred) => (
          <div
            key={cred.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6 hover:border-slate-300 transition-all"
          >
            <div className="space-y-4">
              {/* Header with Title and Status Badge */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-700 shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-slate-900 leading-snug">
                      {cred.type}
                    </h2>
                    <span className="text-xs text-slate-500">{cred.issuer}</span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t.credentials.activeBadge}
                </span>
              </div>

              {/* Credential Data Attributes */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs font-mono border border-slate-100">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400 font-sans">{t.credentials.docRef}</span>
                  <span className="font-bold text-slate-900">{cred.docNumber}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400 font-sans">{t.credentials.issuedDate}</span>
                  <span className="text-slate-700">{cred.issuedOn}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400 font-sans">{t.credentials.validityPeriod}</span>
                  <span className="text-slate-700">{cred.expiresOn}</span>
                </div>
              </div>
            </div>

            {/* Single Clean Share Action */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {t.credentials.w3cStandard}
              </span>

              <button
                onClick={() => handleShareProof(cred)}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.credentials.shareProof}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Share Proof Modal / Cryptographic Disclosure Drawer */}
      {selectedCred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                <h3 className="font-display text-base font-bold text-slate-900">
                  {t.credentials.modalTitle}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCred(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-600">
                {t.credentials.modalDesc}
              </p>

              <div className="bg-slate-950 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800 space-y-1">
                <div className="text-amber-400 font-bold">// Cryptographic Attestation Envelope</div>
                <div>ID: did:openvyapar:{selectedCred.id}</div>
                <div>Doc: {selectedCred.docNumber}</div>
                <div>Issuer: {selectedCred.issuer}</div>
                <div>Proof: ed25519-sig-0x78a9c8...4f</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedCred(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                {t.credentials.close}
              </button>
              <button
                onClick={handleCopyProofPayload}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                {copiedProof ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.credentials.proofCopied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.credentials.copyProofToken}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
