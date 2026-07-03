import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TerminosCondiciones() {
  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} />
          <span className="font-bold text-sm uppercase tracking-widest">Volver al inicio</span>
        </Link>

        <div className="bg-slate-900 rounded-[3rem] border border-slate-800 p-8 md:p-12 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
                Términos y Condiciones
              </h1>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">
                Foro-COAR · Última actualización: Mayo 2026
              </p>
            </div>
          </div>

          <div className="space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                1. Aceptación de los Términos
              </h2>
              <p className="leading-relaxed">
                Al acceder y utilizar el Foro-COAR, aceptas cumplir con estos términos y condiciones. Si no estás de acuerdo con alguna parte, por favor no utilices la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                2. Uso de la Plataforma
              </h2>
              <ul className="space-y-3 list-disc list-inside">
                <li>Solo estudiantes del COAR Cusco con correo institucional válido pueden registrarse.</li>
                <li>Eres responsable de mantener la confidencialidad de tu cuenta y contraseña.</li>
                <li>No compartas tu cuenta con otras personas.</li>
                <li>Utiliza la plataforma de manera respetuosa y constructiva.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                3. Contenido del Usuario
              </h2>
              <p className="leading-relaxed mb-4">
                Al publicar contenido en el foro, declaras que:
              </p>
              <ul className="space-y-3 list-disc list-inside">
                <li>Eres el propietario del contenido o tienes derecho a publicarlo.</li>
                <li>El contenido no viola los derechos de terceros.</li>
                <li>El contenido no es difamatorio, obsceno, amenazante ni ilegal.</li>
              </ul>
              <p className="leading-relaxed mt-4">
                El equipo de moderación se reserva el derecho de eliminar cualquier contenido que considere inapropiado.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                4. Créditos y Apuestas
              </h2>
              <ul className="space-y-3 list-disc list-inside">
                <li>Los créditos son virtuales y no tienen valor monetario real.</li>
                <li>Los créditos se pueden ganar participando en la comunidad.</li>
                <li>Las apuestas son solo para entretenimiento.</li>
                <li>No hay premios reales ni recompensas monetarias.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                5. Privacidad
              </h2>
              <p className="leading-relaxed">
                Tu privacidad es importante para nosotros. Consulta nuestra Política de Privacidad para entender cómo recopilamos, usamos y protegemos tu información.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                6. Suspensión y Terminación
              </h2>
              <p className="leading-relaxed">
                Nos reservamos el derecho de suspender o terminar tu acceso a la plataforma en cualquier momento, sin previo aviso, por violación de estos términos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                7. Modificaciones
              </h2>
              <p className="leading-relaxed">
                Podemos actualizar estos términos periódicamente. Te notificaremos de cambios importantes a través de la plataforma.
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
