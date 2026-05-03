import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Aviso de Privacidad — KINEXIS',
  description: 'Aviso de Privacidad de KINEXIS by Atollom Labs. Protección de datos conforme a la LFPDPPP.',
}

export default function PrivacidadPage() {
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

        <h1 className="text-4xl font-bold mb-2">Aviso de Privacidad</h1>
        <p className="text-white/40 text-sm mb-12">
          Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los
          Particulares (LFPDPPP) · Última actualización: Mayo 2026
        </p>

        <div className="space-y-10 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Identidad del Responsable</h2>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm">
              <p className="font-medium text-white">Atollom Labs S. de R.L. de C.V.</p>
              <p className="mt-1">Puebla, Puebla, México</p>
              <p>Email: <a href="mailto:privacidad@atollom.com" className="text-[#CCFF00]/80 hover:text-[#CCFF00]">privacidad@atollom.com</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Datos Personales Recabados</h2>
            <p className="mb-3">Para la prestación del Servicio, recabamos los siguientes datos:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nombre completo y datos de identificación</li>
              <li>Dirección de correo electrónico</li>
              <li>Número de teléfono</li>
              <li>Nombre y RFC de la empresa</li>
              <li>Datos de facturación y pago (procesados por Stripe — no almacenamos datos de tarjeta)</li>
              <li>Datos de uso de la plataforma (logs de actividad, métricas de operación)</li>
              <li>Contenido ingresado en la plataforma (órdenes, inventario, mensajes de clientes)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Finalidades del Tratamiento</h2>
            <p className="mb-3 font-medium text-white/80">Finalidades primarias (necesarias para el Servicio):</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Proveer, mantener y mejorar el Servicio KINEXIS</li>
              <li>Procesar facturación y pagos</li>
              <li>Soporte técnico y atención al cliente</li>
              <li>Cumplimiento de obligaciones fiscales y legales</li>
            </ul>
            <p className="mb-3 font-medium text-white/80">Finalidades secundarias (puede oponerse):</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Envío de comunicaciones sobre nuevas funcionalidades y actualizaciones</li>
              <li>Análisis estadístico para mejora del producto</li>
              <li>Estudios de mercado</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Derechos ARCO</h2>
            <p className="mb-3">
              Usted tiene derecho a <strong className="text-white">Acceder</strong>,{' '}
              <strong className="text-white">Rectificar</strong>,{' '}
              <strong className="text-white">Cancelar</strong> u{' '}
              <strong className="text-white">Oponerse</strong> al tratamiento de sus datos
              personales (derechos ARCO).
            </p>
            <p>
              Para ejercer estos derechos, envíe un correo a{' '}
              <a href="mailto:privacidad@atollom.com" className="text-[#CCFF00]/80 hover:text-[#CCFF00]">
                privacidad@atollom.com
              </a>{' '}
              con: nombre completo, descripción de la solicitud y copia de identificación oficial.
              Responderemos en un plazo máximo de 20 días hábiles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Transferencias de Datos</h2>
            <p className="mb-3">Sus datos pueden ser compartidos con los siguientes terceros:</p>
            <div className="space-y-3">
              {[
                { name: 'Supabase / PostgreSQL', purpose: 'Base de datos y autenticación', country: 'Estados Unidos' },
                { name: 'Railway', purpose: 'Infraestructura backend', country: 'Estados Unidos' },
                { name: 'Vercel', purpose: 'Hosting frontend', country: 'Estados Unidos' },
                { name: 'Stripe', purpose: 'Procesamiento de pagos', country: 'Estados Unidos' },
                { name: 'Google / Gemini AI', purpose: 'Procesamiento de lenguaje natural', country: 'Estados Unidos' },
                { name: 'Anthropic / Claude AI', purpose: 'Procesamiento de lenguaje natural (opcional)', country: 'Estados Unidos' },
              ].map(t => (
                <div key={t.name} className="flex items-start gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#CCFF00]/60 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="text-white/80 font-medium">{t.name}</span>
                    <span className="text-white/50"> — {t.purpose} ({t.country})</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm">
              Todos los proveedores están sujetos a acuerdos de procesamiento de datos y políticas
              de privacidad compatibles con la LFPDPPP.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Seguridad de los Datos</h2>
            <p>
              Implementamos medidas técnicas, físicas y administrativas para proteger sus datos:
              cifrado en tránsito (TLS 1.3), cifrado en reposo (AES-256), aislamiento por inquilino
              mediante Row Level Security (RLS), control de acceso basado en roles (RBAC) con
              5 niveles, y auditoría de todas las acciones de agentes de IA.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Cookies y Tecnologías de Rastreo</h2>
            <p>
              Utilizamos cookies de sesión estrictamente necesarias para el funcionamiento del
              Servicio (autenticación Supabase). No utilizamos cookies de rastreo publicitario
              de terceros en el dashboard de la aplicación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Retención de Datos</h2>
            <p>
              Conservamos sus datos mientras su cuenta esté activa o sea necesario para prestar
              el Servicio. Tras la cancelación de su cuenta, los datos se eliminan en un plazo
              máximo de 90 días, salvo que la ley exija una retención mayor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Cambios al Aviso de Privacidad</h2>
            <p>
              Nos reservamos el derecho de modificar este Aviso en cualquier momento. Los cambios
              se publicarán en esta página con la fecha de actualización. Para cambios materiales,
              notificaremos por correo electrónico con al menos 15 días de anticipación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Contacto y INAI</h2>
            <p className="mb-3">
              Para ejercer sus derechos o presentar quejas sobre el tratamiento de sus datos:
            </p>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm">
              <p>Email: <a href="mailto:privacidad@atollom.com" className="text-[#CCFF00]/80 hover:text-[#CCFF00]">privacidad@atollom.com</a></p>
            </div>
            <p className="mt-4 text-sm">
              Si considera que su solicitud no fue atendida correctamente, puede acudir al{' '}
              <a
                href="https://www.inai.org.mx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#CCFF00]/80 hover:text-[#CCFF00]"
              >
                Instituto Nacional de Transparencia, Acceso a la Información y Protección de
                Datos Personales (INAI)
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
          <Link
            href="/terminos"
            className="text-sm text-white/40 hover:text-white transition-colors"
          >
            Términos y Condiciones →
          </Link>
        </div>
      </div>
    </div>
  )
}
