import { Markdown } from '@react-email/markdown';

interface EmailTemplateProps {
  firstName: string;
  title: string;
  description: string;
  imageUrl?: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
  title,
  description,
}) => (
  <div>
    <h1>Hallo, {firstName}!</h1>
    <p>Du hast dich für folgenden Event angemeldet:</p>
    <Markdown
      markdownCustomStyles={{
        h1: { color: 'red' },
        h2: { color: 'blue' },
      }}
      markdownContainerStyles={{
        padding: '12px',
        border: 'solid 1px black',
      }}
    >{`# ${title}`}</Markdown>
    <p>{description}</p>
  </div>
);
