export interface HelplineConfig {
  name: string;
  phone: string;
  description: string;
}

export const helplines: Record<string, HelplineConfig> = {
  IN: {
    name: 'iCall',
    phone: '9152987821',
    description: 'India mental health helpline',
  },
  IN_NIMHANS: {
    name: 'NIMHANS',
    phone: '08046110007',
    description: 'National Institute of Mental Health and Neurosciences',
  },
  US: {
    name: '988 Suicide & Crisis Lifeline',
    phone: '988',
    description: 'US nationwide suicide and crisis line',
  },
  GB: {
    name: 'Samaritans',
    phone: '116123',
    description: 'United Kingdom suicide prevention helpline',
  },
  GLOBAL: {
    name: 'Crisis Text Line',
    phone: '741741',
    description: 'Text HOME to 741741 for crisis support',
  },
};

export const defaultHelpline = helplines.GLOBAL;
