interface EmailTemplateProps {
  firstName: string;
  title: string;
  description: string;
  imageUrl: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
  title,
  description,
  imageUrl,
}) => (
  <div>
    <h1>Hallo, {firstName}!</h1>
    <p>Du hast dich für folgenden Event angemeldet:</p>
    <p>{title}</p>
  </div>
);
