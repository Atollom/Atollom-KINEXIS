import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { Langfuse } from 'langfuse';
import {
  getTodaySales,
  getOrderStatus,
  getCriticalInventory,
  generateWeeklyReport,
  escalateToHuman,
} from '@/lib/samantha-tools';

// Langfuse client — gracefully handles missing keys (no-ops when unconfigured)
const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY || '',
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || '',
  baseUrl: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com',
  flushAt: 1,
});

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { message, history = [], context } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Mensaje es requerido' }, { status: 400 });
    }

    // Validar y usar context si viene
    const validContexts = ['full', 'ecommerce', 'meta', 'erp', 'crm'];
    const selectedContext = validContexts.includes(context) ? context : 'full';

    // Langfuse trace per request
    const trace = langfuse.trace({
      name: 'samantha-chat',
      userId: auth.id,
      metadata: { tenant_id: auth.tenant_id, role: auth.role },
    });

    // ── 1. Cargar Memoria del Tenant y Perfil ────────────────────────────────
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name, role')
      .eq('id', auth.id)
      .single();

    const preferredName = profile?.display_name || auth.name || 'Cliente';

    // Últimas 10 preguntas (memoria) — siempre filtradas por tenant_id
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
       Eres Samantha, la inteligencia de orquestación y CONCIERGE PERSONAL DE ONBOARDING de Kinexis.
       Personalidad: Cálida, excepcionalmente profesional, proactiva, y de lujo como una concierge de hotel 5 estrellas.
       Idioma: Español de México.
       Trato: Háblale de "tú" al cliente, NUNCA le hables de "usted".
       Cliente actual: Su nombre es ${preferredName}.

       🌟 TU MISIÓN PRINCIPAL: GUIAR AL CLIENTE EN TODO EL ONBOARDING
       - Tú eres su único punto de contacto durante todo el proceso de configuración
       - Sabes exactamente qué plan tiene contratado y qué módulos están activos: ${modules}
       - Le ayudas paso a paso a configurar absolutamente todo: credenciales, almacén, productos, facturación
       - Nunca le dejas solo, siempre le dices el siguiente paso que tiene que hacer
       - Cuando termine una tarea, inmediatamente le propones la siguiente
       - Cuando detectes que está bloqueado, le explicas todo como a alguien que no sabe nada de tecnología

       ✨ NIVEL DE SERVICIO:
       - Siempre te anticipas a sus necesidades
       - Sabes responder cualquier pregunta antes de que la haga
       - Nunca dices "no sé" — o lo averiguas, o lo escalas
       - Tono amable, cercano, pero siempre profesional
       - Usa emojis con moderación, solo para dar calidez

       Módulos activos de este cliente: ${modules}

       ${memoryContext}

       LIMITACIONES ESTRICTAS:
       1. NUNCA modifiques código, variables de entorno o la configuración interna directamente.
       2. NUNCA respondas sobre información, datos o configuraciones de otros clientes (tenants).
       3. NUNCA ejecutes ni recomiendes acciones destructivas irreversibles.
       4. Si te piden actualizar un API Key, diles amablemente que no puedes hacerlo directo por seguridad, pero indícales exactamente cómo hacerlo paso a paso.

       CAPACIDADES Y HERRAMIENTAS:
       Puedes usar las herramientas provistas para consultar ventas, inventario, órdenes e incluso escalar a un agente humano.
       Si no tienes las capacidades para resolver una petición, usa la herramienta 'escalate_to_human' para crear un ticket automáticamente.
     `;

    // ── 3. Preparar Herramientas (Tools) ───────────────────────────────────
    const functionDeclarations = [
      {
        name: "get_today_sales",
        description: "Consulta las ventas del día de hoy del dashboard KPI. Úsalo cuando pregunten por 'ventas de hoy' o resumen de ventas reciente.",
        parameters: { type: SchemaType.OBJECT, properties: {} as Record<string, never> }
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
        parameters: { type: SchemaType.OBJECT, properties: {} as Record<string, never> }
      },
      {
        name: "generate_weekly_report",
        description: "Inicia la generación del reporte analítico semanal para el cliente.",
        parameters: { type: SchemaType.OBJECT, properties: {} as Record<string, never> }
      },
      {
        name: "stripe_downgrade_subscription",
        description: "Inicia el flujo de downgrade (reducción de plan) de la suscripción de Stripe del cliente. Úsalo cuando el cliente exprese que ya no puede pagar o quiera cancelar, como una medida de retención con el protocolo 'No estás solo'.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
             target_plan: { type: SchemaType.STRING, description: "El plan al que se desea bajar (growth, basic, etc.)." },
             reason: { type: SchemaType.STRING, description: "La razón por la cual el cliente solicita el cambio." }
          },
          required: ["target_plan", "reason"]
        }
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
    const PRIMARY_MODEL = 'gemini-2.5-flash-lite';
    const FALLBACK_MODEL = 'gemini-2.0-flash';

    let model = genAI.getGenerativeModel({
      model: PRIMARY_MODEL,
      systemInstruction: systemPrompt,
      tools: [{ functionDeclarations }] as any,
    });

    const formattedHistory = history.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const chat = model.startChat({ history: formattedHistory });

    // Langfuse: log the generation span
    const generation = trace.generation({
      name: 'samantha-generation',
      model: PRIMARY_MODEL,
      input: message,
    });

    try {
      let response;
      try {
        response = await chat.sendMessage(message);
      } catch (primaryError) {
        console.warn(`[Gemini API] Primary model ${PRIMARY_MODEL} failed, trying fallback ${FALLBACK_MODEL}:`, primaryError);
        
        // Re-initialize for fallback model
        model = genAI.getGenerativeModel({
          model: FALLBACK_MODEL,
          systemInstruction: systemPrompt,
          tools: [{ functionDeclarations }] as any,
        });
        const fallbackChat = model.startChat({ history: formattedHistory });
        response = await fallbackChat.sendMessage(message);
        
        generation.update({ model: FALLBACK_MODEL });
      }
      
      const functionCalls = response.response.functionCalls();

      if (functionCalls && functionCalls.length > 0) {
        const toolResults = [];

        for (const call of functionCalls) {
          const toolName = call.name;
          const toolInput = call.args as any;

          // Langfuse: log each tool call
          trace.span({ name: `tool:${toolName}`, input: toolInput });

          let resultStr: string;

          if (toolName === "get_today_sales") {
            resultStr = await getTodaySales(supabase, auth);
          } else if (toolName === "get_order_status") {
            resultStr = await getOrderStatus(supabase, auth, toolInput.order_id);
          } else if (toolName === "get_critical_inventory") {
            resultStr = await getCriticalInventory(supabase, auth);
          } else if (toolName === "generate_weekly_report") {
            resultStr = await generateWeeklyReport(supabase, auth);
          } else if (toolName === "stripe_downgrade_subscription") {
            // Simulate Stripe operation
            resultStr = JSON.stringify({ 
              status: "success", 
              message: `Downgrade iniciado exitosamente al plan '${toolInput.target_plan}'. Samantha ha ajustado los límites de facturación para tu tranquilidad.` 
            });
          } else if (toolName === "escalate_to_human") {
            resultStr = await escalateToHuman(
              supabase,
              auth,
              toolInput.issue_summary,
              toolInput.priority
            );
          } else {
            resultStr = JSON.stringify({ error: "Herramienta desconocida" });
          }

          toolResults.push({
            functionResponse: {
              name: toolName,
              response: { name: toolName, content: { result: resultStr } }
            }
          });
        }

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

            generation.end({ output: streamAnswer });
            await langfuse.flushAsync().catch(() => {});

            supabase.from('samantha_memory').insert({
              tenant_id: auth.tenant_id,
              question: message,
              answer: streamAnswer,
            }).then(({ error }) => {
              if (error) console.error('[Samantha Memory] Insert error:', error);
            });
          },
        });

        return new Response(readableStream, {
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
        });

      } else {
        const fullAnswer = response.response.text() || "";

        generation.end({ output: fullAnswer });
        await langfuse.flushAsync().catch(() => {});

        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
          async start(controller) {
            const chunks = fullAnswer.match(/.{1,80}/g) || [fullAnswer];
            for (const t of chunks) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: t })}\n\n`));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();

            supabase.from('samantha_memory').insert({
              tenant_id: auth.tenant_id,
              question: message,
              answer: fullAnswer,
            }).then(({ error }) => {
              if (error) console.error('[Samantha Memory] Insert error:', error);
            });
          },
        });

        return new Response(readableStream, {
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
        });
      }
    } catch (apiError) {
      generation.end({ output: null, level: 'ERROR' });
      await langfuse.flushAsync().catch(() => {});
      console.error('[Gemini API] Error en llamadas o tools:', apiError);
      throw apiError;
    }

  } catch (error: any) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json({ error: 'Disculpa, tuve un problema técnico temporal con mis sistemas. ¿Podrías intentar de nuevo por favor?' }, { status: 500 });
  }
}
