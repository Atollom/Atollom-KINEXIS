import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Términos y Condiciones — KINEXIS',
  description: 'Términos y Condiciones de uso de la plataforma KINEXIS by Atollom Labs.',
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#040f1b] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <h1 className="text-4xl font-bold mb-2">Términos y Condiciones</h1>
        <p className="text-white/40 text-sm mb-12">Última actualización: Mayo 2026</p>

        <div className="space-y-10 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Aceptación de Términos</h2>
            <p>
              Al acceder y utilizar KINEXIS (el "Servicio"), operado por Atollom Labs S. de R.L. de C.V.
              ("Nosotros", "Nuestro"), usted acepta estar sujeto a estos Términos y Condiciones. Si no
              está de acuerdo con alguna parte de estos términos, no podrá acceder al Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Descripción del Servicio</h2>
            <p>
              KINEXIS es una plataforma SaaS de automatización y gestión para empresas de e-commerce
              en México, que integra inteligencia artificial, gestión de inventario, CRM omnicanal,
              facturación electrónica (CFDI 4.0) y automatización de operaciones a través de 43 agentes
              de IA especializados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Licencia de Uso</h2>
            <p className="mb-3">
              Le otorgamos una licencia limitada, no exclusiva, intransferible y revocable para
              acceder y usar el Servicio de acuerdo con el plan contratado.
            </p>
            <p>Usted se compromete a no:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Copiar, modificar o distribuir el software del Servicio</li>
              <li>Realizar ingeniería inversa del Servicio</li>
              <li>Usar el Servicio para actividades ilegales o no autorizadas</li>
              <li>Compartir credenciales de acceso con terceros no autorizados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Privacidad y Datos</h2>
            <p>
              El tratamiento de sus datos personales se rige por nuestro{' '}
              <Link href="/privacidad" className="text-[#CCFF00]/80 hover:text-[#CCFF00]">
                Aviso de Privacidad
              </Link>{' '}
              y la Ley Federal de Protección de Datos Personales en Posesión de los Particulares
              (LFPDPPP). Sus datos empresariales están aislados mediante Row Level Security por
              inquilino (tenant).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Facturación y Pagos</h2>
            <p className="mb-3">
              Los planes se facturan mensualmente. Los precios están expresados en MXN e incluyen IVA
              cuando aplica. El servicio puede ser cancelado en cualquier momento; los cargos ya
              realizados no son reembolsables salvo error de nuestra parte.
            </p>
            <p>
              Los timbres CFDI no utilizados dentro de un periodo no se acumulan al siguiente mes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Propiedad Intelectual</h2>
            <p>
              Todo el contenido, software, código, diseños, marcas, logotipos y agentes de IA son
              propiedad exclusiva de Atollom Labs S. de R.L. de C.V. Quedan reservados todos los
              derechos no expresamente otorgados en estos Términos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Disponibilidad del Servicio</h2>
            <p>
              Nos comprometemos a mantener una disponibilidad del 99.9% mensual (SLA). Las ventanas
              de mantenimiento programado se notificarán con al menos 24 horas de anticipación. No
              somos responsables por interrupciones causadas por terceros (proveedores de nube,
              APIs externas, SAT, etc.).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Limitación de Responsabilidad</h2>
            <p>
              El Servicio se proporciona "tal cual". No garantizamos resultados comerciales específicos.
              En ningún caso nuestra responsabilidad total excederá el monto pagado en los últimos
              3 meses de suscripción. No somos responsables por daños indirectos, pérdida de datos
              o lucro cesante.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos Términos en cualquier momento. Los cambios
              materiales se notificarán por email con al menos 15 días de anticipación. El uso
              continuado del Servicio después de dicha notificación implica aceptación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Jurisdicción y Ley Aplicable</h2>
            <p>
              Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier
              controversia se someterá a la jurisdicción de los tribunales competentes de la ciudad
              de Puebla, Puebla, México, renunciando a cualquier otro fuero que pudiera corresponder.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Contacto</h2>
            <p>
              Para cualquier consulta relacionada con estos Términos:
            </p>
            <div className="mt-3 p-4 rounded-xl bg-white/5 border border-white/10 text-sm">
              <p className="font-medium text-white">Atollom Labs S. de R.L. de C.V.</p>
              <p className="mt-1">Email: <a href="mailto:contacto@atollom.com" className="text-[#CCFF00]/80 hover:text-[#CCFF00]">contacto@atollom.com</a></p>
              <p>Puebla, Puebla, México</p>
            </div>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
