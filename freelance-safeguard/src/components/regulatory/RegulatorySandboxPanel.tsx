import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Grid,
  Alert,
  AlertTitle,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Checkbox,
  TextField
} from '@mui/material';
import {
  Science as ScienceIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';

import { useRegulatoryCompliance } from '../../hooks/useRegulatoryCompliance';
import { REGULATORY_SANDBOXES } from '../../lib/regulatory/constants';

const RegulatorySandboxPanel: React.FC = () => {
  const { publicKey } = useWallet();
  const {
    userJurisdiction,
    inSandbox,
    requiredDisclosures
  } = useRegulatoryCompliance();

  const [activeStep, setActiveStep] = useState(0);
  const [sandboxRegistrationOpen, setSandboxRegistrationOpen] = useState(false);
  const [selectedSandbox, setSelectedSandbox] = useState<string | null>(null);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [businessModel, setBusinessModel] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  // Get available sandboxes based on user jurisdiction
  const getAvailableSandboxes = () => {
    if (!userJurisdiction) return [];
    
    const availableSandboxes = [];
    
    if (userJurisdiction.isEU) {
      availableSandboxes.push({
        id: 'EU_DLT_PILOT',
        name: 'EU DLT Pilot Regime',
        description: 'European regulatory sandbox for distributed ledger technology in insurance.',
        eligibility: 'Open to EU-based insurance providers and platforms using DLT.',
        maxCoverageAmount: REGULATORY_SANDBOXES.EU_DLT_PILOT.maxCoverageAmount,
        maxUserCount: REGULATORY_SANDBOXES.EU_DLT_PILOT.maxUserCount,
        reportingFrequency: 'Quarterly',
        duration: '24 months',
        authority: 'European Insurance and Occupational Pensions Authority (EIOPA)'
      });
    }
    
    if (userJurisdiction.countryCode === 'US') {
      if (userJurisdiction.stateOrProvince === 'WY') {
        availableSandboxes.push({
          id: 'WYOMING_DAO_LLC',
          name: 'Wyoming DAO LLC Insurance Sandbox',
          description: 'Regulatory sandbox for DAO-based insurance products in Wyoming.',
          eligibility: 'Open to Wyoming-registered DAOs and blockchain insurance providers.',
          maxCoverageAmount: REGULATORY_SANDBOXES.WYOMING_DAO_LLC.maxCoverageAmount,
          maxUserCount: REGULATORY_SANDBOXES.WYOMING_DAO_LLC.maxUserCount,
          reportingFrequency: 'Monthly',
          duration: '36 months',
          authority: 'Wyoming Division of Insurance'
        });
      }
      
      availableSandboxes.push({
        id: 'US_INSURTECH_SANDBOX',
        name: 'US InsurTech Regulatory Sandbox',
        description: 'Multi-state regulatory sandbox for innovative insurance technology solutions.',
        eligibility: 'Open to US-based insurance technology providers.',
        maxCoverageAmount: REGULATORY_SANDBOXES.US_INSURTECH_SANDBOX.maxCoverageAmount,
        maxUserCount: REGULATORY_SANDBOXES.US_INSURTECH_SANDBOX.maxUserCount,
        reportingFrequency: 'Bi-monthly',
        duration: '18 months',
        authority: 'National Association of Insurance Commissioners (NAIC)'
      });
    }
    
    if (userJurisdiction.countryCode === 'SG') {
      availableSandboxes.push({
        id: 'SINGAPORE_FINTECH_SANDBOX',
        name: 'Singapore FinTech Regulatory Sandbox',
        description: 'Regulatory sandbox for financial technology innovations in Singapore.',
        eligibility: 'Open to Singapore-based financial technology providers.',
        maxCoverageAmount: REGULATORY_SANDBOXES.SINGAPORE_FINTECH_SANDBOX.maxCoverageAmount,
        maxUserCount: REGULATORY_SANDBOXES.SINGAPORE_FINTECH_SANDBOX.maxUserCount,
        reportingFrequency: 'Monthly',
        duration: '12 months',
        authority: 'Monetary Authority of Singapore (MAS)'
      });
    }
    
    // Global sandbox available to all jurisdictions
    availableSandboxes.push({
      id: 'GLOBAL_BLOCKCHAIN_INSURANCE',
      name: 'Global Blockchain Insurance Sandbox',
      description: 'International regulatory sandbox for blockchain-based insurance products.',
      eligibility: 'Open to all blockchain insurance providers with limited coverage amounts.',
      maxCoverageAmount: REGULATORY_SANDBOXES.GLOBAL_BLOCKCHAIN_INSURANCE.maxCoverageAmount,
      maxUserCount: REGULATORY_SANDBOXES.GLOBAL_BLOCKCHAIN_INSURANCE.maxUserCount,
      reportingFrequency: 'Quarterly',
      duration: '12 months',
      authority: 'International Association of Insurance Supervisors (IAIS)'
    });
    
    return availableSandboxes;
  };
  
  const availableSandboxes = getAvailableSandboxes();
  
  const handleOpenSandboxRegistration = () => {
    setSandboxRegistrationOpen(true);
    setActiveStep(0);
    setSelectedSandbox(null);
    setAgreeToTerms(false);
    setCompanyName('');
    setBusinessModel('');
    setRegistrationSuccess(false);
  };
  
  const handleCloseSandboxRegistration = () => {
    setSandboxRegistrationOpen(false);
  };
  
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  const handleSelectSandbox = (sandboxId: string) => {
    setSelectedSandbox(sandboxId);
  };
  
  const handleAgreeToTermsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAgreeToTerms(event.target.checked);
  };
  
  const handleCompanyNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyName(event.target.value);
  };
  
  const handleBusinessModelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBusinessModel(event.target.value);
  };
  
  const handleRegisterForSandbox = async () => {
    if (!publicKey || !selectedSandbox) return;
    
    setIsRegistering(true);
    
    try {
      // In a real implementation, this would call the regulatory sandbox service
      // to register the user for the selected sandbox
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      setRegistrationSuccess(true);
    } catch (error) {
      console.error('Failed to register for sandbox:', error);
    } finally {
      setIsRegistering(false);
    }
  };
  
  const steps = ['Select Sandbox', 'Company Information', 'Review & Submit'];
  
  if (!publicKey) {
    return (
      <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          <ScienceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Regulatory Sandbox
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Alert severity="info">
          Please connect your wallet to access regulatory sandbox features.
        </Alert>
      </Paper>
    );
  }
  
  if (!userJurisdiction) {
    return (
      <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          <ScienceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Regulatory Sandbox
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Alert severity="warning">
          Please set your jurisdiction to view available regulatory sandboxes.
        </Alert>
      </Paper>
    );
  }
  
  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            <ScienceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Regulatory Sandbox
          </Typography>
          {!inSandbox && (
            <Button 
              variant="outlined" 
              onClick={handleOpenSandboxRegistration}
            >
              Register for Sandbox
            </Button>
          )}
        </Box>
        <Divider sx={{ mb: 3 }} />
        
        {inSandbox ? (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle>Operating in Regulatory Sandbox</AlertTitle>
              <Typography variant="body2">
                Your FreelanceShield account is currently operating under a regulatory sandbox framework.
                This means certain limitations and special conditions apply to your insurance policies.
              </Typography>
            </Alert>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      <BarChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Sandbox Limitations
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <InfoIcon color="info" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Maximum Coverage Amount" 
                          secondary={`${REGULATORY_SANDBOXES.GLOBAL_BLOCKCHAIN_INSURANCE.maxCoverageAmount} SOL per policy`} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <InfoIcon color="info" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Maximum User Count" 
                          secondary={`${REGULATORY_SANDBOXES.GLOBAL_BLOCKCHAIN_INSURANCE.maxUserCount} users`} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <InfoIcon color="info" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Geographic Restrictions" 
                          secondary="Limited to approved jurisdictions" 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Reporting Requirements
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <AssignmentIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Reporting Frequency" 
                          secondary="Quarterly reports required" 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <AssignmentIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Next Report Due" 
                          secondary={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <AssignmentIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Required Metrics" 
                          secondary="User count, transaction volume, claim ratio" 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Alert severity="warning">
                  <AlertTitle>Required Disclosures</AlertTitle>
                  {requiredDisclosures.map((disclosure, index) => (
                    <Typography key={index} variant="body2" paragraph>
                      {disclosure}
                    </Typography>
                  ))}
                </Alert>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Regulatory Sandbox Benefits
            </Typography>
            <Typography variant="body2" paragraph>
              Participating in a regulatory sandbox allows innovative insurance products to operate
              with modified regulatory requirements while maintaining consumer protection.
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Regulatory Flexibility
                    </Typography>
                    <Typography variant="body2">
                      Operate under modified regulatory requirements designed for blockchain insurance.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Reduced Capital Requirements
                    </Typography>
                    <Typography variant="body2">
                      Lower initial capital requirements compared to traditional insurance providers.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Regulatory Guidance
                    </Typography>
                    <Typography variant="body2">
                      Direct access to regulatory authorities for guidance and feedback.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Market Testing
                    </Typography>
                    <Typography variant="body2">
                      Test innovative insurance products in a controlled environment with real users.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Typography variant="subtitle1" gutterBottom>
              Available Sandboxes
            </Typography>
            
            {availableSandboxes.length === 0 ? (
              <Alert severity="info">
                No regulatory sandboxes are currently available for your jurisdiction.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {availableSandboxes.map((sandbox) => (
                  <Grid item xs={12} md={6} key={sandbox.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          {sandbox.name}
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {sandbox.description}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <List dense>
                          <ListItem>
                            <ListItemText 
                              primary="Eligibility" 
                              secondary={sandbox.eligibility} 
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="Maximum Coverage" 
                              secondary={`${sandbox.maxCoverageAmount} SOL per policy`} 
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="Duration" 
                              secondary={sandbox.duration} 
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="Regulatory Authority" 
                              secondary={sandbox.authority} 
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Paper>
      
      {/* Sandbox Registration Dialog */}
      <Dialog open={sandboxRegistrationOpen} onClose={handleCloseSandboxRegistration} maxWidth="md" fullWidth>
        <DialogTitle>
          Register for Regulatory Sandbox
        </DialogTitle>
        <DialogContent dividers>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {activeStep === 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Select a Regulatory Sandbox
              </Typography>
              <Typography variant="body2" paragraph>
                Choose the regulatory sandbox that best fits your needs and jurisdiction.
              </Typography>
              
              <Grid container spacing={2}>
                {availableSandboxes.map((sandbox) => (
                  <Grid item xs={12} key={sandbox.id}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        border: selectedSandbox === sandbox.id ? '2px solid #1976d2' : undefined,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleSelectSandbox(sandbox.id)}
                    >
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle1">
                            {sandbox.name}
                          </Typography>
                          {selectedSandbox === sandbox.id && (
                            <CheckCircleIcon color="primary" />
                          )}
                        </Box>
                        <Typography variant="body2" paragraph>
                          {sandbox.description}
                        </Typography>
                        <Chip 
                          label={`Max Coverage: ${sandbox.maxCoverageAmount} SOL`} 
                          size="small" 
                          sx={{ mr: 1, mb: 1 }} 
                        />
                        <Chip 
                          label={`Duration: ${sandbox.duration}`} 
                          size="small" 
                          sx={{ mr: 1, mb: 1 }} 
                        />
                        <Chip 
                          label={`Reporting: ${sandbox.reportingFrequency}`} 
                          size="small" 
                          sx={{ mb: 1 }} 
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!selectedSandbox}
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}
          
          {activeStep === 1 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Company Information
              </Typography>
              <Typography variant="body2" paragraph>
                Please provide information about your company and business model.
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={companyName}
                    onChange={handleCompanyNameChange}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Business Model Description"
                    multiline
                    rows={4}
                    value={businessModel}
                    onChange={handleBusinessModelChange}
                    margin="normal"
                    helperText="Describe how your blockchain insurance product works and why it requires sandbox participation"
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button onClick={handleBack}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!companyName || !businessModel}
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}
          
          {activeStep === 2 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Review & Submit
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Selected Sandbox
                      </Typography>
                      {selectedSandbox && (
                        <List dense>
                          <ListItem>
                            <ListItemText 
                              primary="Sandbox Name" 
                              secondary={availableSandboxes.find(s => s.id === selectedSandbox)?.name} 
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="Maximum Coverage" 
                              secondary={`${availableSandboxes.find(s => s.id === selectedSandbox)?.maxCoverageAmount} SOL`} 
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="Duration" 
                              secondary={availableSandboxes.find(s => s.id === selectedSandbox)?.duration} 
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="Reporting Frequency" 
                              secondary={availableSandboxes.find(s => s.id === selectedSandbox)?.reportingFrequency} 
                            />
                          </ListItem>
                        </List>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Company Information
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText 
                            primary="Company Name" 
                            secondary={companyName} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Wallet Address" 
                            secondary={publicKey.toString()} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Jurisdiction" 
                            secondary={userJurisdiction.isEU ? 'European Union' : userJurisdiction.countryCode} 
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Alert severity="warning" sx={{ mb: 2 }}>
                <AlertTitle>Sandbox Participation Terms</AlertTitle>
                <Typography variant="body2" paragraph>
                  By registering for this regulatory sandbox, you agree to:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText primary="Comply with all sandbox-specific regulations and limitations" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText primary="Submit required reports according to the specified frequency" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText primary="Maintain clear disclosures to all users about sandbox participation" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText primary="Exit the sandbox in an orderly manner at the end of the participation period" />
                  </ListItem>
                </List>
              </Alert>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreeToTerms}
                    onChange={handleAgreeToTermsChange}
                  />
                }
                label="I agree to the terms and conditions of sandbox participation"
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button onClick={handleBack}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleRegisterForSandbox}
                  disabled={!agreeToTerms || isRegistering}
                  startIcon={isRegistering ? <CircularProgress size={20} /> : undefined}
                >
                  {isRegistering ? 'Submitting...' : 'Submit Application'}
                </Button>
              </Box>
            </Box>
          )}
          
          {registrationSuccess && (
            <Alert severity="success" sx={{ mt: 3 }}>
              <AlertTitle>Application Submitted Successfully</AlertTitle>
              <Typography variant="body2">
                Your application for the regulatory sandbox has been submitted.
                You will receive a notification when your application is reviewed.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSandboxRegistration}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RegulatorySandboxPanel;
