import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-02-24.acacia',
});

// Planes disponibles con precios en MXN (centavos)
const PLANS = {
  growth: {
    name: 'Ecommerce Manager',
    price: 9900, // $99.00 MXN/mes
    modules: ['ecommerce'],
    priceId: process.env.STRIPE_GROWTH_PRICE_ID || 'price_growth_monthly',
  },
  pro: {
    name: 'Ecommerce + ERP',
    price: 19900, // $199.00 MXN/mes
    modules: ['ecommerce', 'erp'],
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
  },
  enterprise: {
    name: 'Full Suite',
    price: 34900, // $349.00 MXN/mes
    modules: ['ecommerce', 'erp', 'crm'],
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly',
  },
};

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { plan_type, success_url, cancel_url } = await req.json();

    if (!plan_type || !PLANS[plan_type as keyof typeof PLANS]) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    const plan = PLANS[plan_type as keyof typeof PLANS];

    // Obtener o crear Customer en Stripe
    let { data: tenant } = await supabase
      .from('tenants')
      .select('stripe_customer_id')
      .eq('id', auth.tenant_id)
      .single();

    let customerId = tenant?.stripe_customer_id;

    if (!customerId) {
      // Crear customer nuevo
      const customer = await stripe.customers.create({
        email: auth.email,
        metadata: {
          tenant_id: auth.tenant_id,
          kinexis_tenant_name: auth.tenant_name || 'Unknown',
        },
      });
      customerId = customer.id;

      // Guardar en BD
      await supabase
        .from('tenants')
        .update({ stripe_customer_id: customerId })
        .eq('id', auth.tenant_id);
    }

    // Crear Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        tenant_id: auth.tenant_id,
        plan_type,
      },
      success_url: success_url || `${req.nextUrl.origin}/settings/billing?success=true`,
      cancel_url: cancel_url || `${req.nextUrl.origin}/settings/billing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[Stripe Checkout]', error);
    return NextResponse.json(
      { error: 'Error al crear sesión de pago' },
      { status: 500 }
    );
  }
}