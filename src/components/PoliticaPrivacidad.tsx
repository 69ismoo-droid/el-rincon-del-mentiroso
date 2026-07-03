import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PoliticaPrivacidad() {
  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} />
          <span className="font-bold text-sm uppercase tracking-widest">Volver al inicio</span>
        </Link>

        <div className="bg-slate-900 rounded-[3rem] border border-slate-800 p-8 md:p-12 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
                Política de Privacidad
              </h1>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">
                Foro-COAR · Última actualización: Mayo 2026
              </p>
            </div>
          </div>

          <div className="space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                1. Introducción
              </h2>
              <p className="leading-relaxed">
                En Foro-COAR, valoramos tu privacidad y nos comprometemos a proteger tu información personal. Esta política explica cómo recopilamos, usamos y compartimos tu información cuando utilizas nuestra plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                2. Información que Recopilamos
              </h2>
              <ul className="space-y-3 list-disc list-inside">
                <li><strong>Información de cuenta:</strong> Correo electrónico, nombre completo y año de ingreso.</li>
                <li><strong>Contenido del usuario:</strong> Publicaciones, comentarios y mensajes que creas.</li>
                <li><strong>Datos de uso:</strong> Información sobre cómo interactúas con la plataforma.</li>
                <li><strong>Cookies:</strong> Utilizamos cookies para mejorar tu experiencia.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                3. Cómo Usamos Tu Información
              </h2>
              <ul className="space-y-3 list-disc list-inside">
                <li>Para proporcionar y mantener la plataforma.</li>
                <li>Para mejorar y personalizar tu experiencia.</li>
                <li>Para comunicarte sobre actualizaciones y cambios.</li>
                <li>Para moderar el contenido y mantener la seguridad.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                4. Compartir Información
              </h2>
              <p className="leading-relaxed mb-4">
                No vendemos tu información personal. Podemos compartirla en las siguientes situaciones:
              </p>
              <ul className="space-y-3 list-disc list-inside">
                <li>Con tu consentimiento explícito.</li>
                <li>Para cumplir con obligaciones legales.</li>
                <li>Con proveedores de servicios que ayudan a operar la plataforma.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                5. Seguridad de los Datos
              </h2>
              <p className="leading-relaxed">
                Implementamos medidas de seguridad apropiadas para proteger tu información personal contra acceso no autorizado, alteración o destrucción.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                6. Tus Derechos
              </h2>
              <ul className="space-y-3 list-disc list-inside">
                <li>Acceder a tu información personal.</li>
                <li>Corregir información incorrecta.</li>
                <li>Solicitar la eliminación de tu cuenta.</li>
                <li>Retirar tu consentimiento.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                7. Anonimato en el Foro
              </h2>
              <p className="leading-relaxed">
                Tu identidad se mantiene anónima en las publicaciones del foro. Tu nombre real no se muestra a otros usuarios.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                8. Cambios en esta Política
              </h2>
              <p className="leading-relaxed">
                Podemos actualizar esta política periódicamente. Te notificaremos de cambios importantes a través de la plataforma.
              </p>
            </section>

            <div className="pt-8 border-t border-slate-800">
              <p className="text-slate-500 text-sm text-center">
                © 2026 Foro-COAR · Todos los derechos reservados
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
