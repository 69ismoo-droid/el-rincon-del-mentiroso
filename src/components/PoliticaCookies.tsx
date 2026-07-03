import React from 'react';
import { ArrowLeft, Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PoliticaCookies() {
  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} />
          <span className="font-bold text-sm uppercase tracking-widest">Volver al inicio</span>
        </Link>

        <div className="bg-slate-900 rounded-[3rem] border border-slate-800 p-8 md:p-12 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Cookie size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
                Política de Cookies
              </h1>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2">
                Foro-COAR · Última actualización: Mayo 2026
              </p>
            </div>
          </div>

          <div className="space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                1. ¿Qué son las Cookies?
              </h2>
              <p className="leading-relaxed">
                Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Se utilizan para recordar tus preferencias y mejorar tu experiencia de navegación.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                2. Tipos de Cookies que Utilizamos
              </h2>
              
              <div className="space-y-6">
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                  <h3 className="text-lg font-bold text-indigo-400 mb-3">
                    Cookies Esenciales
                  </h3>
                  <p className="leading-relaxed">
                    Necesarias para el funcionamiento básico del sitio. Incluyen cookies de sesión para mantener tu inicio de sesión y recordar tus preferencias básicas.
                  </p>
                </div>

                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                  <h3 className="text-lg font-bold text-green-400 mb-3">
                    Cookies de Funcionalidad
                  </h3>
                  <p className="leading-relaxed">
                    Ayudan a recordar tus preferencias personalizadas, como tu año de ingreso y configuraciones del perfil.
                  </p>
                </div>

                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                  <h3 className="text-lg font-bold text-yellow-400 mb-3">
                    Cookies de Analítica
                  </h3>
                  <p className="leading-relaxed">
                    Nos ayudan a entender cómo interactúas con la plataforma para mejorarla. No recopilan información personal identificable.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                3. Cómo Gestionar las Cookies
              </h2>
              <p className="leading-relaxed mb-4">
                Puedes controlar y/o eliminar las cookies como desees. Para más información, consulta aboutcookies.org.
              </p>
              <ul className="space-y-3 list-disc list-inside">
                <li>Puedes eliminar todas las cookies que ya están en tu dispositivo.</li>
                <li>Puedes configurar la mayoría de los navegadores para evitar que coloquen cookies.</li>
                <li>Si haces esto, es posible que tengas que ajustar manualmente algunas preferencias cada vez que visites el sitio.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                4. Cookies de Terceros
              </h2>
              <p className="leading-relaxed">
                En algunos casos, podemos utilizar cookies de proveedores de servicios de confianza para mejorar la funcionalidad de la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                5. Más Información
              </h2>
              <p className="leading-relaxed">
                Si tienes preguntas sobre nuestra política de cookies, no dudes en contactarnos a través de los canales oficiales del COAR.
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
