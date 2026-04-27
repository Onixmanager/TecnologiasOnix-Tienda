// api/create-checkout-session.js
import Stripe from 'stripe';

// Crea una instancia de Stripe usando la clave secreta configurada en las variables de entorno de Vercel
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { items } = req.body;
    // Convierte los items a line_items según lo que Stripe requiere
    const line_items = items.map(item => ({
      price_data: {
        // Actualizado a EUR para que coincida con el precio en euros
        currency: 'eur',
        product_data: {
          name: item.name
        },
        unit_amount: item.price, // Se asume que el precio viene en céntimos (por ejemplo, 1999 para 19,99€)
      },
      quantity: item.quantity
    }));

    // Construye la URL base según el protocolo y host del request
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const baseURL = `${protocol}://${host}`;

    // Crea la sesión de Checkout en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${baseURL}/success`,
      cancel_url: `${baseURL}/cancel`
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error creating session' });
  }
}
