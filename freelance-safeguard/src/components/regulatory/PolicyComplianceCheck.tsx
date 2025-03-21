import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Alert, 
  AlertTitle, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Collapse, 
  Button,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon, 
  Error as ErrorIcon, 
  Warning as WarningIcon, 
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

import { useRegulatoryCompliance } from '../../hooks/useRegulatoryCompliance';
import { RegulatoryCheckResult } from '../../lib/regulatory/regulatoryIntegration';

interface PolicyComplianceCheckProps {
  coverageAmount: number;
  periodDays: number;
  jobType: string;
  industry: string;
  onComplianceResult?: (result: RegulatoryCheckResult) => void;
}

const PolicyComplianceCheck: React.FC<PolicyComplianceCheckProps> = ({
  coverageAmount,
  periodDays,
  jobType,
  industry,
  onComplianceResult
}) => {
  const { 
    userJurisdiction, 
    checkPolicyCreationCompliance, 
    inSandbox, 
    requiredDisclosures 
  } = useRegulatoryCompliance();

  const [complianceResult, setComplianceResult] = useState<RegulatoryCheckResult | null>(null);
  const [showDisclosures, setShowDisclosures] = useState(false);
  const [showRequirements, setShowRequirements] = useState(true);

  // Check compliance whenever inputs change
  useEffect(() => {
    if (coverageAmount > 0 && periodDays > 0) {
      const result = checkPolicyCreationCompliance(
        coverageAmount,
        periodDays,
        jobType,
        industry
      );
      
      setComplianceResult(result);
      
      if (onComplianceResult) {
        onComplianceResult(result);
      }
    }
  }, [coverageAmount, periodDays, jobType, industry, userJurisdiction, checkPolicyCreationCompliance, onComplianceResult]);

  if (!complianceResult) {
    return null;
  }

  const renderComplianceStatus = () => {
    if (complianceResult.approved && !complianceResult.requiresAdditionalVerification) {
      return (
        <Alert severity="success" sx={{ mb: 2 }}>
          <AlertTitle>Compliant</AlertTitle>
          This policy meets all regulatory requirements for your jurisdiction.
        </Alert>
      );
    } else if (complianceResult.approved && complianceResult.requiresAdditionalVerification) {
      return (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Additional Verification Required</AlertTitle>
          This policy is compliant but requires additional verification steps before it can be finalized.
        </Alert>
      );
    } else {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Compliance Issue</AlertTitle>
          {complianceResult.reason || 'This policy does not meet regulatory requirements for your jurisdiction.'}
        </Alert>
      );
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mt: 2, mb: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Regulatory Compliance Check
        </Typography>
        <Divider />
      </Box>

      {renderComplianceStatus()}

      {userJurisdiction && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Jurisdiction: {userJurisdiction.isEU ? 'European Union' : userJurisdiction.countryCode}
            {userJurisdiction.stateOrProvince && ` (${userJurisdiction.stateOrProvince})`}
          </Typography>
          
          {inSandbox && (
            <Chip 
              icon={<InfoIcon />} 
              label="Operating in Regulatory Sandbox" 
              color="warning" 
              size="small" 
              sx={{ mr: 1 }} 
            />
          )}
        </Box>
      )}

      {complianceResult.additionalRequirements && complianceResult.additionalRequirements.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={() => setShowRequirements(!showRequirements)}
          >
            <Typography variant="subtitle1">
              Additional Requirements
            </Typography>
            {showRequirements ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>
          
          <Collapse in={showRequirements}>
            <List dense>
              {complianceResult.additionalRequirements.map((requirement, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <InfoIcon color="info" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={requirement} />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </Box>
      )}

      {(complianceResult.regulatoryDisclosures || requiredDisclosures.length > 0) && (
        <Box>
          <Button 
            size="small" 
            onClick={() => setShowDisclosures(!showDisclosures)}
            endIcon={showDisclosures ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ mb: 1 }}
          >
            {showDisclosures ? 'Hide Regulatory Disclosures' : 'View Regulatory Disclosures'}
          </Button>
          
          <Collapse in={showDisclosures}>
            <Alert severity="info" sx={{ mt: 1 }}>
              <AlertTitle>Required Regulatory Disclosures</AlertTitle>
              {complianceResult.regulatoryDisclosures && complianceResult.regulatoryDisclosures.map((disclosure, index) => (
                <Typography key={`result-${index}`} variant="body2" paragraph>
                  {disclosure}
                </Typography>
              ))}
              
              {!complianceResult.regulatoryDisclosures && requiredDisclosures.map((disclosure, index) => (
                <Typography key={`general-${index}`} variant="body2" paragraph>
                  {disclosure}
                </Typography>
              ))}
            </Alert>
          </Collapse>
        </Box>
      )}
    </Paper>
  );
};

export default PolicyComplianceCheck;
