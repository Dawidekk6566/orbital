export interface RemediationRequest {
  issueId: string;
  title: string;
  category: string;
  severity: string;
  problem: string;
  fix: string;
  targetUrl?: string;
  evidence?: string;
  codeSnippet?: {
    bad?: string;
    good?: string;
  };
  framework?: string;
}

export interface RemediationResult {
  issueId: string;
  title: string;
  filePath: string;
  framework: string;
  explanation: string;
  cwbImpact: string;
  diff: string;
  beforeCode: string;
  afterCode: string;
  instructions: string[];
}
