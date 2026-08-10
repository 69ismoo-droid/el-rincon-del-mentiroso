import React from 'react';
import { ArrowLeft, FileText, Shield, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TerminosCondiciones() {
  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} />
          <span className="font-bold text-sm uppercase tracking-widest">Volver al inicio</span>
        </Link>

        <div className="bg-slate-900 rounded-[3rem] border border-slate-800 p-8 md:p-12 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-700 to-red-700 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">
                Términos y Condiciones de Uso
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-bold uppercase tracking-widest mt-2">
                Reglamento Legal y Exención Total de Responsabilidad — FORO COAR
              </p>
              <p className="text-slate-600 text-xs mt-1">
                Última actualización: 10 de agosto de 2026
              </p>
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-400 shrink-0 mt-1" size={20} />
              <p className="text-red-300 text-sm leading-relaxed">
                <strong>AVISO IMPORTANTE:</strong> Al acceder, registrarse, navegar o hacer cualquier uso de la plataforma digital FORO COAR, usted acepta expresamente y sin reservas quedar vinculado por el presente contrato legal. Si no está de acuerdo con la totalidad de los términos, condiciones, limitaciones y exenciones aquí establecidos, debe abandonar y abstenerse de utilizar la Plataforma de forma inmediata.
              </p>
            </div>
          </div>

          <div className="space-y-8 text-slate-300">
            <section>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-4 flex items-center gap-3">
                <Shield className="text-blue-400" size={24} />
                ARTÍCULO 1: NATURALEZA DEL SERVICIO E INDEPENDENCIA INSTITUCIONAL
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Carácter Independiente</h3>
                  <p className="leading-relaxed text-sm md:text-base">
                    La Plataforma es un proyecto tecnológico, independiente y privado, diseñado exclusivamente como un espacio de intercambio de información, debate, libre expresión y esparcimiento para la comunidad estudiantil.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Desvinculación Oficial</h3>
                  <p className="leading-relaxed text-sm md:text-base">
                    La Plataforma, sus creadores, desarrolladores, administradores y colaboradores no poseen ningún tipo de relación jurídica, afiliación, patrocinio, alianza, representación ni respaldo institucional con los Colegios de Alto Rendimiento (COAR), el Ministerio de Educación de la República del Perú (MINEDU), ni ninguna otra entidad gubernamental, educativa o privada.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-4 flex items-center gap-3">
                <Shield className="text-red-400" size={24} />
                ARTÍCULO 2: EXENCIÓN ABSOLUTA DE RESPONSABILIDAD POR CONTENIDO GENERADO POR USUARIOS
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Intermediario Tecnológico Pasivo</h3>
                  <p className="leading-relaxed text-sm md:text-base">
                    La Plataforma opera únicamente como un intermediario técnico pasivo de almacenamiento e infraestructura (hosting de foro). La administración no realiza control editorial previo, filtro ni revisión sistemática de los contenidos antes de su publicación.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Responsabilidad Exclusiva del Emisor</h3>
                  <p className="leading-relaxed text-sm md:text-base">
                    Todo mensaje, comentario, opinión, acusación, afirmación, rumor, dato personal, archivo, enlace o imagen publicado en la Plataforma —sea presente, pasado o futuro— es de la exclusiva, personal, penal, civil y administrativa responsabilidad del usuario que redactó o transmitió dicha información.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Inmunidad por Difamación, Calumnia e Injurias</h3>
                  <p className="leading-relaxed text-sm md:text-base">
                    La Plataforma y sus desarrolladores quedan totalmente exonerados e inmunes de cualquier responsabilidad derivada de declaraciones difamatorias, calumniosas, injuriosas, de ciberacoso (cyberbullying), violación al honor, la intimidad personal o familiar, la propia imagen o la confidencialidad realizadas por terceros en el foro.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-4 flex items-center gap-3">
                <Shield className="text-yellow-400" size={24} />
                ARTÍCULO 3: RENUNCIA GLOBAL A RECLAMACIONES Y LIMITACIÓN EXTREMA DE DAÑOS
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Renuncia Irrevocable</h3>
                  <p className="leading-relaxed text-sm md:text-base">
                    Al utilizar la Plataforma, el Usuario y cualquier tercero afectado renuncian de forma expresa, explícita e irrevocable a interponer cualquier acción legal, demanda civil, denuncia penal, reclamo administrativo o solicitud de indemnización contra los desarrolladores, administradores u operadores del sitio web por actos u opiniones emitidas por usuarios de la Plataforma.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Exclusión de Daños</h3>
                  <p className="leading-relaxed text-sm md:text-base">
                    En la máxima medida permitida por la ley, los administradores y desarrolladores no asumirán responsabilidad por ningún daño directo, indirecto, incidental, consecuente, punitivo o especial (incluyendo daño reputacional, pérdida de datos o interrupción del servicio) que surja del uso o de la imposibilidad de uso de la Plataforma.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-4 flex items-center gap-3">
                <Shield className="text-orange-400" size={24} />
                ARTÍCULO 4: EXCLUSIÓN DE GARANTÍAS ("TAL CUAL" / "AS IS")
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Disponibilidad</h3>
                  <p className="leading-relaxed text-sm md:text-base">
                    El servicio se proporciona "TAL CUAL" (AS IS) y "SEGÚN DISPONIBILIDAD" (AS AVAILABLE), sin garantías de ningún tipo, explícitas o implícitas.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Riesgos Tecnológicos</h3>
                  <p className="leading-relaxed text-sm md:text-base">
                    La Plataforma no garantiza ser ininterrumpida, libre de errores, virus, fallas de código, accesos no autorizados, ataques informáticos o filtraciones de datos (hackeos). El Usuario asume bajo su propio riesgo el uso de la infraestructura digital.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-4 flex items-center gap-3">
                <Shield className="text-purple-400" size={24} />
                ARTÍCULO 5: OBLIGACIÓN DE INDEMNIZACIÓN POR PARTE DEL USUARIO
              </h2>
              <p className="leading-relaxed text-sm md:text-base mb-4">
                El Usuario acepta defender, indemnizar y mantener indemne a los desarrolladores, administradores y colaboradores de la Plataforma ante cualquier reclamo, demanda, sanción, costo o gasto (incluidos honorarios de abogados) que surja de:
              </p>
              <ul className="space-y-2 list-disc list-inside text-sm md:text-base">
                <li>Su incumplimiento o violación de estos Términos y Condiciones.</li>
                <li>Las publicaciones, comentarios o contenidos que el Usuario haya subido a la Plataforma.</li>
                <li>La infracción de derechos de terceros, incluidos derechos de autor, marcas, honor, intimidad o datos personales.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-4 flex items-center gap-3">
                <Shield className="text-green-400" size={24} />
                ARTÍCULO 6: MECANISMO DE RETIRO Y DERECHO DE MODERACIÓN
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Procedimiento de Reporte y Retiro (Notice and Takedown)</h3>
                  <p className="leading-relaxed text-sm md:text-base">
                    Si un tercero considera que un comentario o publicación vulnera sus derechos, el único mecanismo de subsanación acordado es el envío de una solicitud formal de retiro mediante las herramientas de reporte del foro. La responsabilidad de los administradores se limita únicamente a evaluar y, de corresponder, remover el contenido reportado en un plazo razonable. El retiro del contenido no constituye en ningún caso una admisión de culpa o complicidad por parte de la Plataforma.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Derecho Reserva de Administración</h3>
                  <p className="leading-relaxed text-sm md:text-base">
                    La Plataforma se reserva la facultad absoluta de eliminar, moderar o editar cualquier publicación, así como suspender o expulsar a cualquier usuario en cualquier momento y sin previo aviso ni obligación de indemnizar.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-4 flex items-center gap-3">
                <Shield className="text-cyan-400" size={24} />
                ARTÍCULO 7: LEY APLICABLE Y JURISDICCIÓN
              </h2>
              <p className="leading-relaxed text-sm md:text-base">
                Los presentes términos se regirán e interpretarán conforme a las leyes de la República del Perú. Para cualquier controversia no cubierta por el presente acuerdo, las partes se someten a los tribunales competentes de la jurisdicción peruana.
              </p>
            </section>

            <div className="pt-8 border-t border-slate-800">
              <p className="text-slate-500 text-sm text-center">
                © 2026 FORO COAR · Todos los derechos reservados
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
