import * as React from 'react';
import { 
  Html, 
  Head, 
  Body, 
  Container, 
  Section, 
  Text, 
  Button, 
  Heading, 
  Hr,
  Link
} from '@react-email/components';

interface WaitlistEmailProps {
  email?: string;
}

export const WaitlistEmail: React.FC<WaitlistEmailProps> = ({ email = 'subscriber@example.com' }) => {
  const surveyUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScWpvzsmZF1tHhZrKWzJS_ezRWhP2iouIHV5v9sL1bd-318pg/viewform?embedded=true';

  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>Welcome to FreelanceShield!</Heading>
          
          <Text style={paragraphStyle}>
            Thank you for joining our waitlist. We're building the future of freelance protection on Solana, and we're excited to have you on board!
          </Text>
          
          <Section style={calloutStyle}>
            <Text style={calloutTextStyle}>
              <strong>To help us tailor FreelanceShield to your needs, please complete our brief survey:</strong>
            </Text>
          </Section>
          
          <Button style={buttonStyle} href={surveyUrl}>
            Complete Our Survey
          </Button>
          
          <Text style={paragraphStyle}>
            The survey will help us understand your specific needs as a freelancer and how we can better protect your work and income.
          </Text>
          
          <Text style={paragraphStyle}>
            We'll keep you updated on our progress and you'll be among the first to know when we launch!
          </Text>
          
          <Hr style={hrStyle} />
          
          <Text style={footerStyle}>
            The FreelanceShield Team
          </Text>
          
          <Text style={unsubscribeStyle}>
            <Link href={`mailto:unsubscribe@freelanceshield.xyz?subject=Unsubscribe ${email}`} style={linkStyle}>
              Unsubscribe
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const bodyStyle = {
  backgroundColor: 'rgb(10, 10, 24)',
  color: 'rgb(255, 255, 255)',
  fontFamily: '"Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
  margin: '0',
  padding: '0',
};

const containerStyle = {
  maxWidth: '700px',
  margin: '0 auto',
  padding: '30px',
  backgroundColor: 'rgb(10, 10, 24)',
  color: 'rgb(255, 255, 255)',
  borderRadius: '12px',
  border: '2px solid rgb(153, 69, 255)',
};

const headingStyle = {
  fontFamily: '"Arial", sans-serif',
  color: 'rgb(153, 69, 255)',
  fontSize: '36px',
  marginBottom: '24px',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
};

const paragraphStyle = {
  fontSize: '18px',
  lineHeight: '1.6',
  margin: '20px 0',
};

const calloutStyle = {
  padding: '20px',
  borderRadius: '8px',
  margin: '24px 0',
  borderLeft: '4px solid rgb(0, 191, 255)',
};

const calloutTextStyle = {
  fontSize: '18px',
  margin: '0',
  color: 'rgb(0, 191, 255)',
};

const buttonStyle = {
  display: 'inline-block',
  background: 'linear-gradient(to right, rgb(153, 69, 255), rgb(0, 191, 255))',
  color: 'white',
  padding: '15px 30px',
  textDecoration: 'none',
  borderRadius: '6px',
  fontWeight: 'bold',
  margin: '20px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  fontSize: '18px',
};

const hrStyle = {
  borderTop: '1px solid rgb(192, 192, 192)',
  margin: '36px 0 24px',
};

const footerStyle = {
  fontSize: '16px',
  color: 'rgb(210, 210, 210)',
};

const unsubscribeStyle = {
  fontSize: '12px',
  color: 'rgb(150, 150, 150)',
  marginTop: '20px',
};

const linkStyle = {
  color: 'rgb(150, 150, 150)',
  textDecoration: 'underline',
};

export default WaitlistEmail;
