import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Laptop,
  MonitorDown,
  Share,
  Smartphone,
  X,
} from 'lucide-react';
import type { InstallPlatform } from '../hooks/usePWAInstall';

interface AppInstallModalProps {
  isInstalled: boolean;
  isInstallable: boolean;
  detectedPlatform: InstallPlatform;
  isOpen: boolean;
  onClose: () => void;
  onInstallNative: () => Promise<boolean>;
  onMarkInstalled: () => void;
}

export const AppInstallModal: React.FC<AppInstallModalProps> = ({
  isInstalled,
  isInstallable,
  detectedPlatform,
  isOpen,
  onClose,
  onInstallNative,
  onMarkInstalled,
}) => {
  const [activeTab, setActiveTab] = useState<InstallPlatform>(detectedPlatform);
  const [completionNotice, setCompletionNotice] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(detectedPlatform);
  }, [detectedPlatform]);

  // Completely disappear once downloaded/installed or running in standalone mode
  if (isInstalled || !isOpen) {
    return null;
  }

  const originParam =
    typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : '';

  const finishAndHide = (message: string) => {
    setCompletionNotice(message);
    window.setTimeout(() => {
      onMarkInstalled();
      onClose();
    }, 1100);
  };

  const handleNativeInstall = async () => {
    const accepted = await onInstallNative();
    if (accepted) {
      finishAndHide('Aplicación instalada correctamente. Ocultando esta ventana...');
    }
  };

  return (
    <aside
      role="dialog"
      aria-labelledby="install-app-title"
      className="fixed bottom-20 left-3 right-3 z-40 sm:bottom-5 sm:left-auto sm:right-5 sm:w-full sm:max-w-md"
    >
      <div className="w-full rounded-xl border border-[#D4D7DD] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#E2E4E8] px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#B26337]">
              Compañía Minera Las Bravas
            </p>
            <h2 id="install-app-title" className="mt-0.5 text-sm font-bold text-[#23272E] sm:text-base">
              Descargar e Instalar Aplicativo
            </h2>
            <p className="mt-0.5 text-xs text-[#5C626D]">
              Instálalo en Windows PC, Android o Apple. Al instalar, esta ventana desaparecerá.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Minimizar ventana de descarga"
            className="rounded-lg p-1.5 text-[#5C626D] hover:bg-[#EFEFF1] hover:text-[#23272E] cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Platform Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1.5 border-b border-[#E2E4E8] bg-[#F7F7F8] p-2">
          <button
            type="button"
            onClick={() => setActiveTab('windows')}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'windows'
                ? 'bg-white text-[#B26337] border border-[#E6CDBE]'
                : 'text-[#5C626D] hover:text-[#23272E]'
            }`}
          >
            <Laptop className="h-3.5 w-3.5 shrink-0" />
            <span>Windows PC</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'android'
                ? 'bg-white text-[#B26337] border border-[#E6CDBE]'
                : 'text-[#5C626D] hover:text-[#23272E]'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5 shrink-0" />
            <span>Android</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apple')}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'apple'
                ? 'bg-white text-[#B26337] border border-[#E6CDBE]'
                : 'text-[#5C626D] hover:text-[#23272E]'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5 shrink-0" />
            <span>Apple iOS/Mac</span>
          </button>
        </div>

        {/* Platform Instructions & Direct Action */}
        <div className="space-y-4 p-5">
          {completionNotice ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-[#D2E3D8] bg-[#F2F7F4] p-4 text-sm font-medium text-[#3D7A5A]">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{completionNotice}</span>
            </div>
          ) : (
            <>
              {activeTab === 'windows' && (
                <div className="space-y-3">
                  <p className="text-sm text-[#23272E]">
                    Crea un programa de escritorio independiente en <strong>Windows 10 / 11</strong> (con acceso en el Escritorio y Menú Inicio, sin barra de navegador).
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {isInstallable && (
                      <button
                        type="button"
                        onClick={handleNativeInstall}
                        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#23272E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3A404B] transition-colors cursor-pointer"
                      >
                        <MonitorDown className="h-4 w-4 shrink-0" />
                        <span>Instalar App Directo en Windows</span>
                      </button>
                    )}

                    <a
                      href={`/api/download/windows-installer${originParam ? `?url=${originParam}` : ''}`}
                      download
                      onClick={() =>
                        finishAndHide(
                          'Instalador Windows PC descargado. Ejecuta el archivo .cmd; ocultando esta ventana...'
                        )
                      }
                      className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#B26337] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#99522B] transition-colors"
                    >
                      <Download className="h-4 w-4 shrink-0" />
                      <span>Descargar Instalador Windows PC (.cmd)</span>
                    </a>
                  </div>
                </div>
              )}

              {activeTab === 'android' && (
                <div className="space-y-3">
                  <p className="text-sm text-[#23272E]">
                    Instala el aplicativo móvil de <strong>Compañía Minera Las Bravas</strong> directamente en tu celular Android sin pasar por tiendas externas.
                  </p>

                  {isInstallable ? (
                    <button
                      type="button"
                      onClick={handleNativeInstall}
                      className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#B26337] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#99522B] transition-colors cursor-pointer"
                    >
                      <Download className="h-4 w-4 shrink-0" />
                      <span>Descargar e Instalar en Android</span>
                    </button>
                  ) : (
                    <ol className="space-y-1.5 rounded-lg border border-[#E2E4E8] bg-[#F7F7F8] p-3.5 text-xs leading-relaxed text-[#23272E]">
                      <li>1. Abre esta pantalla en <strong>Google Chrome</strong> en tu celular Android.</li>
                      <li>2. Toca el menú de tres puntos (<strong>⋮</strong>) arriba a la derecha.</li>
                      <li>3. Elige <strong>Instalar aplicación</strong> o <strong>Agregar a la pantalla principal</strong>.</li>
                    </ol>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      finishAndHide('Instalación en Android confirmada. Ocultando ventana...')
                    }
                    className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg border border-[#D4D7DD] bg-white px-4 py-2 text-xs font-semibold text-[#23272E] hover:bg-[#EFEFF1] cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#B26337]" />
                    <span>Ya lo instalé en Android (ocultar ventana)</span>
                  </button>
                </div>
              )}

              {activeTab === 'apple' && (
                <div className="space-y-3">
                  <p className="text-sm text-[#23272E]">
                    Agrega <strong>Compañía Minera Las Bravas</strong> como aplicación nativa en tu <strong>iPhone, iPad o Mac</strong> mediante Safari.
                  </p>
                  <ol className="space-y-1.5 rounded-lg border border-[#E2E4E8] bg-[#F7F7F8] p-3.5 text-xs leading-relaxed text-[#23272E]">
                    <li className="flex items-center gap-1.5">
                      <span>1. En Safari, toca el botón</span>
                      <Share className="inline h-3.5 w-3.5 text-[#B26337]" />
                      <strong>Compartir</strong>.
                    </li>
                    <li>
                      2. Selecciona <strong>Agregar a inicio</strong> (iPhone/iPad) o <strong>Agregar al Dock</strong> (Mac).
                    </li>
                    <li>3. Confirma <strong>Agregar</strong> para usar la app en pantalla completa.</li>
                  </ol>
                  <button
                    type="button"
                    onClick={() =>
                      finishAndHide('Instalación en Apple confirmada. Ocultando ventana...')
                    }
                    className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-[#B26337] px-4 py-2 text-sm font-semibold text-white hover:bg-[#99522B] transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Ya lo instalé en Apple (ocultar ventana)</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
