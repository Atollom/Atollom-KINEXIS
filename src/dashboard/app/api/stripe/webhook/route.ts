import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-02-24.acacia',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenant_id;
        const planType = session.metadata?.plan_type;

        if (!tenantId) {
          console.error('[Webhook] Missing tenant_id in metadata');
          break;
        }

        const subscriptionId = session.subscription as string;

        // Actualizar tenant con nuevo plan
        await supabase
          .from('tenants')
          .update({
            plan_id: planType || 'growth',
            stripe_subscription_id: subscriptionId,
          })
          .eq('id', tenantId);

        // Actualizar módulos activos según el plan
        const modulesMap: Record<string, string[]> = {
          growth: ['ecommerce'],
          pro: ['ecommerce', 'erp'],
          enterprise: ['ecommerce', 'erp', 'crm'],
        };

        await supabase
          .from('tenant_profiles')
          .update({ active_modules: modulesMap[planType || 'growth'] })
          .eq('tenant_id', tenantId);

        console.log(`[Webhook] Tenant ${tenantId} upgraded to ${planType}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata?.tenant_id;

        if (!tenantId) break;

        // Actualizar status según el estado de la suscripción
        const statusMap: Record<Stripe.Subscription.Status, string> = {
          active: 'active',
          past_due: 'past_due',
          canceled: 'canceled',
          unpaid: 'past_due',
          trialing: 'trialing',
          paused: 'paused',
          incomplete: 'pending',
          incomplete_expired: 'expired',
        };

        const newPlan = subscription.items.data[0]?.price.id;
        // Map price ID to plan type
        const planMap: Record<string, string> = {
          [process.env.STRIPE_GROWTH_PRICE_ID || 'price_growth_monthly']: 'growth',
          [process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly']: 'pro',
          [process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly']: 'enterprise',
        };

        if (newPlan && planMap[newPlan]) {
          await supabase
            .from('tenants')
            .update({ plan_id: planMap[newPlan] })
            .eq('id', tenantId);
        }

        console.log(`[Webhook] Subscription updated for tenant ${tenantId}: ${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata?.tenant_id;

        if (!tenantId) break;

        // Downgrade a free/growth
        await supabase
          .from('tenants')
          .update({
            plan_id: 'growth',
            stripe_subscription_id: null,
          })
          .eq('id', tenantId);

        await supabase
          .from('tenant_profiles')
          .update({ active_modules: ['ecommerce'] })
          .eq('tenant_id', tenantId);

        console.log(`[Webhook] Subscription cancelled for tenant ${tenantId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const tenantId = invoice.metadata?.tenant_id;

        if (!tenantId) break;

        // Notificar al usuario de fallo de pago
        break;
      }

      default:
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}