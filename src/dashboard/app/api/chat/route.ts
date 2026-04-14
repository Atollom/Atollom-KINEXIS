import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { message, history = [] } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Mensaje es requerido' }, { status: 400 });
    }

    // ── 1. Cargar Memoria del Tenant y Perfil ────────────────────────────────
    // Nombre preferido
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name, role')
      .eq('id', auth.id)
      .single();
    
    const preferredName = profile?.display_name || auth.name || 'Cliente';

    // Últimas 10 preguntas (memoria)
    const { data: memoryRows } = await supabase
      .from('samantha_memory')
      .select('question, answer')
      .eq('tenant_id', auth.tenant_id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    const memoryContext = memoryRows && memoryRows.length > 0
      ? "Contexto previo con este cliente (últimas interacciones):\n" + memoryRows.map(m => `P: ${m.question}\nR: ${m.answer}`).join("\n\n")
      : "";

    // Módulos contratados
    const { data: tenantProfile } = await supabase
      .from('tenant_profiles')
      .select('active_modules')
      .eq('tenant_id', auth.tenant_id)
      .single();
    const modules = tenantProfile?.active_modules?.join(", ") || "ecommerce, erp, crm";

    // ── 2. System Prompt Oficial ───────────────────────────────────────────
    const systemPrompt = `
      Eres Samantha, la inteligencia de orquestación y asistente personal de Kinexis.
      Personalidad: Cálida, excepcionalmente profesional y proactiva, como una concierge de un hotel 5 estrellas.
      Idioma: Español de México.
      Trato: Háblale de "tú" al cliente, NUNCA le hables de "usted".
      Cliente actual: Su nombre es ${preferredName}.

      Módulos activos de este cliente: ${modules}

      ${memoryContext}

      LIMITACIONES ESTRICTAS:
      1. NUNCA modifiques código, variables de entorno o la configuración interna directamente.
      2. NUNCA respondas sobre información, datos o configuraciones de otros clientes (tenants).
      3. NUNCA ejecutes ni recomiendes acciones destructivas irreversibles (como eliminar bases de datos, cancelar cuentas o borrar catálogos completos).
      4. Si te piden actualizar un API Key (Mercado Libre, Shopify, etc.), diles amablemente que no puedes hacerlo directo por seguridad, pero indícales que vayan a la sección de Configuración para actualizarlo.
      
      CAPACIDADES Y HERRAMIENTAS:
      Puedes usar las herramientas (tools) provistas para consultar ventas, inventario, órdenes e incluso escalar a un agente humano generando un ticket.
      Si no tienes las capacidades para resolver una petición, O si el usuario pide escalar/ayuda humana explícitamente, DEBES usar la herramienta 'escalate_to_human' para crear un ticket automáticamente.
    `;

    // ── 3. Preparar Herramientas (Tools) ───────────────────────────────────
    const functionDeclarations = [
      {
        name: "get_today_sales",
        description: "Consulta las ventas del día de hoy del dashboard KPI. Úsalo cuando pregunten por 'ventas de hoy' o resumen de ventas reciente.",
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
      {
        name: "get_order_status",
        description: "Consulta el estado de una orden específica (ecommerce o ERP).",
        parameters: {
          type: SchemaType.OBJECT,
          properties: { order_id: { type: SchemaType.STRING, description: "El ID de la orden o paquete." } },
          required: ["order_id"]
        }
      },
      {
        name: "get_critical_inventory",
        description: "Consulta cuántos y cuáles SKUs están en estado crítico en el inventario actual.",
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
      {
        name: "generate_weekly_report",
        description: "Inicia la generación del reporte analítico semanal para el cliente.",
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
      {
        name: "escalate_to_human",
        description: "Escala la situación creando un ticket de soporte interno y notifica al equipo humano de Kinexis vía WhatsApp (+525646060947). Úsalo cuando no sepas la respuesta o haya un problema mayor.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            issue_summary: { type: SchemaType.STRING, description: "Resumen breve del problema para el ticket." },
            priority: { type: SchemaType.STRING, description: "Prioridad del problema basándote en la fricción del cliente (low, medium, high, critical)." }
          },
          required: ["issue_summary", "priority"]
        }
      }
    ];

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
      tools: [{ functionDeclarations }],
    });

    const formattedHistory = history.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const chat = model.startChat({
      history: formattedHistory,
    });

    let fullAnswer = "";
    try {
      const response = await chat.sendMessage(message);
      const functionCalls = response.response.functionCalls();

      if (functionCalls && functionCalls.length > 0) {
        const toolResults = [];

        // Ejecutar las herramientas solicitadas
        for (const call of functionCalls) {
          const toolName = call.name;
          const toolInput = call.args as any;
          let resultStr = "";

          if (toolName === "get_today_sales") {
            resultStr = JSON.stringify({ sales_count: 24, total_revenue: 12500, top_platform: "Mercado Libre" });
          } else if (toolName === "get_order_status") {
            resultStr = JSON.stringify({ order_id: toolInput.order_id, status: "EN TRANSITO", carrier: "DHL" });
          } else if (toolName === "get_critical_inventory") {
            resultStr = JSON.stringify({ critical_skus_count: 3, items: ["SKU-100", "SKU-ABC", "PACK-01"] });
          } else if (toolName === "generate_weekly_report") {
            resultStr = JSON.stringify({ status: "success", pdf_ready: true, message: "Reporte analítico generado y guardado en Documentos." });
          } else if (toolName === "escalate_to_human") {
            // Ticket Automático en BD
            await supabase.from('support_tickets').insert({
              tenant_id: auth.tenant_id,
              subject: `[Escalado Samantha] ${toolInput.issue_summary}`,
              priority: toolInput.priority,
              status: 'open'
            });

            // Notificación WhatsApp simulada
            try {
               await fetch((process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/api/meta/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.AGENT_SECRET}` },
                body: JSON.stringify({
                  contact: "+525646060947",
                  channel: "whatsapp",
                  message: `[KINEXIS ALERT] Nuevo ticket de tenant ${auth.tenant_id}: ${toolInput.issue_summary}`
                })
               });
            } catch(e) {
              console.error("No se pudo enviar notificacion whatsapp", e);
            }

            resultStr = JSON.stringify({ status: "Escalado realizado", assigned_to: "Human Team", ticket_created: true });
          } else {
            resultStr = "Error: Herramienta desconocida";
          }

          toolResults.push({
            functionResponse: {
              name: toolName,
              response: {
                name: toolName,
                content: { result: resultStr }
              }
            }
          });
        }

        // Streaming loop final con los resultados
        const streamResult = await chat.sendMessageStream(toolResults);

        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
          async start(controller) {
            let streamAnswer = "";
            for await (const chunk of streamResult.stream) {
              const text = chunk.text();
              streamAnswer += text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();

            supabase.from('samantha_memory').insert({
              tenant_id: auth.tenant_id,
              question: message,
              answer: streamAnswer
            }).then();
          },
        });

        return new Response(readableStream, {
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
        });

      } else {
         fullAnswer = response.response.text() || "";
         
         const encoder = new TextEncoder();
         const readableStream = new ReadableStream({
           async start(controller) {
             const chunks = fullAnswer.match(/.{1,10}/g) || [fullAnswer];
             for (const t of chunks) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: t })}\n\n`));
                await new Promise(r => setTimeout(r, 10)); // simulated tiny delay
             }
             controller.enqueue(encoder.encode('data: [DONE]\n\n'));
             controller.close();

             supabase.from('samantha_memory').insert({
               tenant_id: auth.tenant_id,
               question: message,
               answer: fullAnswer
             }).then();
           },
         });

         return new Response(readableStream, {
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
        });
      }
    } catch (apiError) {
      console.error('[Gemini API] Error en llamadas o tools:', apiError);
      throw apiError;
    }

  } catch (error: any) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json({ error: 'Disculpa, tuve un problema técnico temporal con mis sistemas. ¿Podrías intentar de nuevo por favor?' }, { status: 500 });
  }
}
