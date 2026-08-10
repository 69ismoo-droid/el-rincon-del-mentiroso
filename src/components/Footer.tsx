import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Flag, FileText, Lock } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0f172a] border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-12">
          {/* Sección Superior - Marca */}
          <div className="flex-1 max-w-md">
            <div className="mb-4">
              <h3 className="text-2xl font-black text-white tracking-tighter uppercase">
                Foro COAR
              </h3>
              <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-red-500 rounded-full mt-2"></div>
            </div>
            <p className="text-[#94a3b8] text-sm leading-relaxed">
              Plataforma independiente desarrollada para la comunidad estudiantil. No posee afiliación oficial con instituciones educativas o gubernamentales.
            </p>
          </div>

          {/* Sección Central - Enlaces */}
          <div className="flex-1">
            <h4 className="text-white font-bold uppercase tracking-wider text-sm mb-4">
              Enlaces Rápidos
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/terminos"
                  className="flex items-center gap-2 text-[#94a3b8] hover:text-[#38bdf8] transition-colors text-sm group"
                >
                  <FileText size={16} className="group-hover:scale-110 transition-transform" />
                  <span>Términos y Condiciones</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/privacidad"
                  className="flex items-center gap-2 text-[#94a3b8] hover:text-[#38bdf8] transition-colors text-sm group"
                >
                  <Lock size={16} className="group-hover:scale-110 transition-transform" />
                  <span>Política de Privacidad</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/reglas"
                  className="flex items-center gap-2 text-[#94a3b8] hover:text-[#38bdf8] transition-colors text-sm group"
                >
                  <Shield size={16} className="group-hover:scale-110 transition-transform" />
                  <span>Reglamento de la Comunidad</span>
                </Link>
              </li>
              <li>
                <button
                  onClick={() => window.open('mailto:foro2026coar@outlook.com?subject=Reporte de Contenido', '_blank')}
                  className="flex items-center gap-2 text-[#94a3b8] hover:text-red-400 transition-colors text-sm group"
                >
                  <Flag size={16} className="group-hover:scale-110 transition-transform" />
                  <span>Reportar Contenido</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Sección Inferior - Copyright */}
          <div className="flex-1 md:text-right">
            <div className="mb-4">
              <h4 className="text-white font-bold uppercase tracking-wider text-sm mb-4">
                Información Legal
              </h4>
              <p className="text-[#94a3b8] text-xs leading-relaxed">
                El uso de esta plataforma implica la aceptación de nuestros términos y condiciones. Los usuarios son responsables exclusivos del contenido que publican.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/50">
              <p className="text-[#94a3b8] text-xs">
                © {currentYear} Foro COAR · Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra inferior decorativa */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500"></div>
    </footer>
  );
}
