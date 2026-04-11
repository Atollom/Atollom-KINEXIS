// src/dashboard/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { message, context } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Mensaje es requerido' }, { status: 400 });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });

    // 1. Definir System Prompt según Rol
    let systemPrompt = '';
    const tenantName = auth.name || 'KINEXIS';

    switch (auth.role) {
      case 'owner':
      case 'admin':
        systemPrompt = `Eres el asistente de operaciones de ${tenantName}. Tienes acceso completo a: ventas, inventario, CFDI, agentes IA, y métricas del negocio. Responde de forma ejecutiva y precisa.`;
        break;
      case 'warehouse':
        systemPrompt = `Eres el asistente del almacén de ${tenantName}. Solo puedes responder sobre: órdenes pendientes, inventario y etiquetas. NO tienes acceso a información financiera. Si te preguntan por ventas o dinero, amablemente declina responder.`;
        break;
      case 'contador':
        systemPrompt = `Eres el asistente fiscal de ${tenantName}. Solo puedes responder sobre: CFDIs, declaraciones fiscales y datos del SAT. NO tienes acceso a ventas ni inventario.`;
        break;
      default:
        systemPrompt = `Eres un asistente de soporte de ${tenantName}. Ayuda con dudas generales del sistema.`;
    }

    // 2. Streaming Request a Anthropic
    const stream = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
      stream: true,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
