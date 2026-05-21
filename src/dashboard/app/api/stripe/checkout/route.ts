import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

const PLANS = {
  starter: {
    name: 'KINEXIS Starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID || '',
    modules: ['ecommerce'],
  },
  growth: {
    name: 'KINEXIS Growth',
    priceId: process.env.STRIPE_GROWTH_PRICE_ID || '',
    modules: ['ecommerce', 'crm'],
  },
  pro: {
    name: 'KINEXIS Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    modules: ['ecommerce', 'erp', 'crm'],
  },
} as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan_type, email: bodyEmail, success_url, cancel_url } = body;

    if (!plan_type || !(plan_type in PLANS)) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    const plan = PLANS[plan_type as keyof typeof PLANS];

    if (!plan.priceId) {
      return NextResponse.json(
        { error: `Price ID para ${plan_type} no configurado en variables de entorno` },
        { status: 500 }
      );
    }

    // Auth check: support both registered tenants and new users (pre-onboarding)
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado — inicia sesión primero' }, { status: 401 });
    }

    const customerEmail = bodyEmail || user.email || '';
    let customerId: string | undefined;
    let tenantId: string | undefined;

    // Try to get existing tenant & stripe customer (optional — may not exist yet)
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('supabase_user_id', user.id)
        .maybeSingle();

      if (profile?.tenant_id) {
        tenantId = profile.tenant_id;
        const { data: tenant } = await supabase
          .from('tenants')
          .select('stripe_customer_id')
          .eq('id', tenantId)
          .maybeSingle();
        customerId = tenant?.stripe_customer_id ?? undefined;
      }
    } catch {
      // User not in users table yet (pre-onboarding) — proceed without tenant context
    }

    // Create Stripe customer if we don't have one yet
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          supabase_user_id: user.id,
          ...(tenantId ? { tenant_id: tenantId } : {}),
        },
      });
      customerId = customer.id;

      // Save back to tenant if we have one
      if (tenantId) {
        await supabase
          .from('tenants')
          .update({ stripe_customer_id: customerId })
          .eq('id', tenantId);
      }
    }

    const origin = req.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      metadata: {
        plan_type,
        supabase_user_id: user.id,
        ...(tenantId ? { tenant_id: tenantId } : {}),
      },
      success_url: success_url || `${origin}/onboarding?plan=${plan_type}&checkout=ok`,
      cancel_url: cancel_url || `${origin}/onboarding/plans`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[Stripe Checkout]', error);
    return NextResponse.json(
      { error: 'Error al crear sesión de pago. Verifica la configuración de Stripe.' },
      { status: 500 }
    );
  }
}
