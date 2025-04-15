export interface Rule {
  id: string;
  category: 'GDPR' | 'CCPA' | 'DPDPA' | 'General';
  title: string;
  description: string;
  keywords: string[];
  weight: number;
  riskLevel: 'High' | 'Medium' | 'Low';
  required: boolean;
}

export const privacyRules: Rule[] = [
  // GDPR Rules
  {
    id: 'gdpr-1',
    category: 'GDPR',
    title: 'Data Collection Purpose',
    description: 'Clear statement of data collection purposes',
    keywords: ['purpose', 'collect', 'data', 'information', 'use', 'processing'],
    weight: 1.0,
    riskLevel: 'High',
    required: true
  },
  {
    id: 'gdpr-2',
    category: 'GDPR',
    title: 'Legal Basis for Processing',
    description: 'Specification of legal basis for data processing',
    keywords: ['legal basis', 'consent', 'contract', 'legitimate interest', 'legal obligation'],
    weight: 1.0,
    riskLevel: 'High',
    required: true
  },
  {
    id: 'gdpr-3',
    category: 'GDPR',
    title: 'Data Subject Rights',
    description: 'Description of data subject rights',
    keywords: ['right to access', 'right to rectification', 'right to erasure', 'right to restrict', 'right to data portability', 'right to object'],
    weight: 1.0,
    riskLevel: 'High',
    required: true
  },
  {
    id: 'gdpr-4',
    category: 'GDPR',
    title: 'Data Retention Period',
    description: 'Clear statement of data retention periods',
    keywords: ['retention', 'storage', 'period', 'duration', 'keep', 'delete'],
    weight: 0.8,
    riskLevel: 'High',
    required: true
  },
  {
    id: 'gdpr-5',
    category: 'GDPR',
    title: 'Data Transfer Outside EU',
    description: 'Information about international data transfers',
    keywords: ['transfer', 'international', 'outside EU', 'third country', 'adequacy decision', 'standard contractual clauses'],
    weight: 0.8,
    riskLevel: 'High',
    required: true
  },
  {
    id: 'gdpr-6',
    category: 'GDPR',
    title: 'Data Protection Officer',
    description: 'Contact information for DPO',
    keywords: ['data protection officer', 'DPO', 'contact', 'representative'],
    weight: 0.6,
    riskLevel: 'Medium',
    required: false
  },
  {
    id: 'gdpr-7',
    category: 'GDPR',
    title: 'Automated Decision Making',
    description: 'Information about automated decision making',
    keywords: ['automated decision', 'profiling', 'algorithm', 'machine learning'],
    weight: 0.7,
    riskLevel: 'High',
    required: true
  },
  {
    id: 'gdpr-8',
    category: 'GDPR',
    title: 'Data Breach Notification',
    description: 'Information about data breach procedures',
    keywords: ['data breach', 'security incident', 'notification', 'report'],
    weight: 0.8,
    riskLevel: 'High',
    required: true
  },

  // CCPA Rules
  {
    id: 'ccpa-1',
    category: 'CCPA',
    title: 'Right to Know',
    description: 'Information about right to know',
    keywords: ['right to know', 'access', 'disclosure', 'information collected'],
    weight: 1.0,
    riskLevel: 'High',
    required: true
  },
  {
    id: 'ccpa-2',
    category: 'CCPA',
    title: 'Right to Delete',
    description: 'Information about right to delete',
    keywords: ['right to delete', 'erasure', 'removal', 'deletion'],
    weight: 1.0,
    riskLevel: 'High',
    required: true
  },
  {
    id: 'ccpa-3',
    category: 'CCPA',
    title: 'Right to Opt-Out',
    description: 'Information about right to opt-out',
    keywords: ['right to opt-out', 'do not sell', 'opt out', 'preference'],
    weight: 1.0,
    riskLevel: 'High',
    required: true
  },
  {
    id: 'ccpa-4',
    category: 'CCPA',
    title: 'Non-Discrimination',
    description: 'Information about non-discrimination',
    keywords: ['non-discrimination', 'equal service', 'price', 'quality'],
    weight: 0.8,
    riskLevel: 'High',
    required: true
  },
  {
    id: 'ccpa-5',
    category: 'CCPA',
    title: 'Financial Incentives',
    description: 'Information about financial incentives',
    keywords: ['financial incentive', 'price', 'discount', 'benefit'],
    weight: 0.6,
    riskLevel: 'Medium',
    required: true
  },

  // DPDPA Rules
  {
    id: 'dpdpa-1',
    category: 'DPDPA',
    title: 'Consent Requirements',
    description: 'Clear consent requirements',
    keywords: ['consent', 'permission', 'authorization', 'agreement'],
    weight: 1.0,
    riskLevel: 'High',
    required: true
  },
  {
    id: 'dpdpa-2',
    category: 'DPDPA',
    title: 'Purpose Limitation',
    description: 'Clear purpose limitation',
    keywords: ['purpose', 'use', 'collection', 'processing'],
    weight: 1.0,
    riskLevel: 'High',
    required: true
  },
  {
    id: 'dpdpa-3',
    category: 'DPDPA',
    title: 'Data Accuracy',
    description: 'Data accuracy requirements',
    keywords: ['accuracy', 'correct', 'update', 'maintain'],
    weight: 0.8,
    riskLevel: 'Medium',
    required: true
  },
  {
    id: 'dpdpa-4',
    category: 'DPDPA',
    title: 'Data Protection',
    description: 'Data protection measures',
    keywords: ['protection', 'security', 'safeguard', 'measure'],
    weight: 1.0,
    riskLevel: 'High',
    required: true
  },
  {
    id: 'dpdpa-5',
    category: 'DPDPA',
    title: 'Data Retention',
    description: 'Data retention requirements',
    keywords: ['retention', 'storage', 'period', 'duration'],
    weight: 0.8,
    riskLevel: 'High',
    required: true
  },

  // General Rules
  {
    id: 'gen-1',
    category: 'General',
    title: 'Contact Information',
    description: 'Clear contact information',
    keywords: ['contact', 'email', 'address', 'phone', 'support'],
    weight: 0.8,
    riskLevel: 'Medium',
    required: true
  },
  {
    id: 'gen-2',
    category: 'General',
    title: 'Policy Updates',
    description: 'Information about policy updates',
    keywords: ['update', 'change', 'modify', 'version', 'date'],
    weight: 0.6,
    riskLevel: 'Medium',
    required: true
  },
  {
    id: 'gen-3',
    category: 'General',
    title: 'Cookie Policy',
    description: 'Information about cookie usage',
    keywords: ['cookie', 'tracking', 'analytics', 'preference'],
    weight: 0.8,
    riskLevel: 'Medium',
    required: true
  },
  {
    id: 'gen-4',
    category: 'General',
    title: 'Third-Party Sharing',
    description: 'Information about third-party data sharing',
    keywords: ['third party', 'share', 'partner', 'service provider'],
    weight: 0.9,
    riskLevel: 'High',
    required: true
  },
  {
    id: 'gen-5',
    category: 'General',
    title: 'Children\'s Privacy',
    description: 'Information about children\'s data protection',
    keywords: ['children', 'minor', 'age', 'parental consent'],
    weight: 0.9,
    riskLevel: 'High',
    required: true
  }
];

export interface RuleMatch {
  rule: Rule;
  matches: number;
  score: number;
  foundKeywords: string[];
}

export function analyzeTextAgainstRules(text: string, rules: Rule[]): RuleMatch[] {
  const lowerText = text.toLowerCase();
  return rules.map(rule => {
    const foundKeywords = rule.keywords.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
    const matches = foundKeywords.length;
    const score = (matches / rule.keywords.length) * rule.weight;
    
    return {
      rule,
      matches,
      score,
      foundKeywords
    };
  });
}

export function calculateComplianceScore(ruleMatches: RuleMatch[]): {
  overallScore: number;
  gdprScore: number;
  ccpaScore: number;
  dpdpaScore: number;
  complianceBreakdown: {
    compliant: number;
    needsAttention: number;
    highRisk: number;
  };
  gaps: Array<{
    title: string;
    regulation: string;
    riskLevel: 'High Risk' | 'Medium Risk' | 'Low Risk';
  }>;
  insights: Array<{
    title: string;
    regulation: string;
    article: string;
    description: string;
    riskLevel: 'High Risk' | 'Medium Risk' | 'Low Risk';
  }>;
} {
  const gdprRules = ruleMatches.filter(match => match.rule.category === 'GDPR');
  const ccpaRules = ruleMatches.filter(match => match.rule.category === 'CCPA');
  const dpdpaRules = ruleMatches.filter(match => match.rule.category === 'DPDPA');

  const calculateCategoryScore = (matches: RuleMatch[]) => {
    if (matches.length === 0) return 0;
    const totalWeight = matches.reduce((sum, match) => sum + match.rule.weight, 0);
    const weightedScore = matches.reduce((sum, match) => sum + match.score, 0);
    return (weightedScore / totalWeight) * 100;
  };

  const gdprScore = calculateCategoryScore(gdprRules);
  const ccpaScore = calculateCategoryScore(ccpaRules);
  const dpdpaScore = calculateCategoryScore(dpdpaRules);
  const overallScore = (gdprScore + ccpaScore + dpdpaScore) / 3;

  const gaps = ruleMatches
    .filter(match => match.score < 0.5)
    .map(match => ({
      title: match.rule.title,
      regulation: match.rule.category,
      riskLevel: match.rule.riskLevel === 'High' ? 'High Risk' as const : 
                match.rule.riskLevel === 'Medium' ? 'Medium Risk' as const : 'Low Risk' as const
    }));

  const insights = ruleMatches
    .filter(match => match.score >= 0.8)
    .map(match => ({
      title: `Strong ${match.rule.title} Implementation`,
      regulation: match.rule.category,
      article: match.rule.id,
      description: `The policy demonstrates good compliance with ${match.rule.title} requirements.`,
      riskLevel: 'Low Risk' as const
    }));

  const complianceBreakdown = {
    compliant: ruleMatches.filter(match => match.score >= 0.8).length,
    needsAttention: ruleMatches.filter(match => match.score >= 0.5 && match.score < 0.8).length,
    highRisk: ruleMatches.filter(match => match.score < 0.5).length
  };

  return {
    overallScore,
    gdprScore,
    ccpaScore,
    dpdpaScore,
    complianceBreakdown,
    gaps,
    insights
  };
} 