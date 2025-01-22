import { Resend } from 'resend';

import { EmailTemplate } from '@/components/email-template';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const body = await request.json();
  const { firstName, subject, toEmail, title, description, imageUrl } = body;
  console.log(body);
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM_ADDRESS || 'hello@resend.eoss.ch',
      to: [toEmail],
      subject: subject,
      react: EmailTemplate({ firstName, title, description, imageUrl }),
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
