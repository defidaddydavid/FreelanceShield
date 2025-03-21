import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Alert,
  Chip,
  Paper
} from '@mui/material';
import {
  VerifiedUser as VerifiedUserIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRegulatoryCompliance } from '../../hooks/useRegulatoryCompliance';
import { useRegulatorySolana } from '../../hooks/useRegulatorySolana';
import { KYC_AML_REQUIREMENTS } from '../../lib/regulatory/constants';

// Helper function to create a SHA-256 hash using the Web Crypto API
async function createSHA256Hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  
  // Convert hash to hex string
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

interface KycAmlVerificationProps {
  coverageAmount?: number;
  onVerificationComplete?: (success: boolean) => void;
}

const KycAmlVerification: React.FC<KycAmlVerificationProps> = ({
  coverageAmount = 100,
  onVerificationComplete
}) => {
  const { publicKey } = useWallet();
  const { userJurisdiction } = useRegulatoryCompliance();
  const { getKycRequirements, checkAmlScreeningRequired, storeDataHash, isLoading } = useRegulatorySolana();
  
  const [activeStep, setActiveStep] = useState(0);
  const [kycLevel, setKycLevel] = useState<'basic' | 'enhanced' | 'full'>('basic');
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isAmlRequired, setIsAmlRequired] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);

  // Steps for the KYC/AML verification process
  const steps = ['Requirements Check', 'Identity Verification', 'Document Upload', 'Verification'];

  // Determine required KYC fields based on coverage amount and jurisdiction
  useEffect(() => {
    if (userJurisdiction && coverageAmount) {
      const requirements = getKycRequirements(coverageAmount);
      setRequiredFields(requirements);
      
      // Determine KYC level based on requirements
      if (requirements.includes('source_of_funds')) {
        setKycLevel('full');
      } else if (requirements.includes('id_document')) {
        setKycLevel('enhanced');
      } else {
        setKycLevel('basic');
      }
      
      // Check if AML screening is required
      setIsAmlRequired(checkAmlScreeningRequired(coverageAmount));
      
      // Initialize form data with empty strings for all required fields
      const initialFormData: Record<string, string> = {};
      requirements.forEach(field => {
        initialFormData[field] = '';
      });
      setFormData(initialFormData);
    }
  }, [userJurisdiction, coverageAmount, getKycRequirements, checkAmlScreeningRequired]);

  // Handle form field changes
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate the current step
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (activeStep === 1) {
      // Validate identity fields
      const identityFields = ['email', 'name', 'address'];
      identityFields.forEach(field => {
        if (requiredFields.includes(field) && !formData[field]) {
          newErrors[field] = 'This field is required';
        }
      });
      
      if (requiredFields.includes('ssn') && !formData.ssn) {
        newErrors.ssn = 'SSN is required';
      } else if (requiredFields.includes('ssn_last_4') && !formData.ssn_last_4) {
        newErrors.ssn_last_4 = 'Last 4 digits of SSN are required';
      }
    } else if (activeStep === 2) {
      // Validate document uploads
      const documentFields = ['id_document', 'selfie', 'proof_of_address', 'source_of_funds'];
      documentFields.forEach(field => {
        if (requiredFields.includes(field) && !formData[field]) {
          newErrors[field] = 'This document is required';
        }
      });
    }
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep(prevStep => prevStep + 1);
      
      // If moving to the final step, submit verification
      if (activeStep === steps.length - 2) {
        submitVerification();
      }
    }
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };

  // Submit verification to the blockchain
  const submitVerification = async () => {
    if (!publicKey) return;
    
    try {
      // Create a hash of the KYC data
      const dataString = JSON.stringify(formData);
      const dataHash = await createSHA256Hash(dataString);
      
      // Calculate expiry timestamp (1 year from now)
      const expiryTimestamp = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);
      
      // Store the data hash on the blockchain
      const result = await storeDataHash(dataHash, `KYC_${kycLevel.toUpperCase()}`, expiryTimestamp);
      
      if (result.success) {
        setVerificationStatus('success');
        setTransactionSignature(result.transactionSignature || null);
        if (onVerificationComplete) {
          onVerificationComplete(true);
        }
      } else {
        setVerificationStatus('failed');
        if (onVerificationComplete) {
          onVerificationComplete(false);
        }
      }
    } catch (error) {
      console.error('Verification submission error:', error);
      setVerificationStatus('failed');
      if (onVerificationComplete) {
        onVerificationComplete(false);
      }
    }
  };

  // Render the appropriate step content
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Based on your jurisdiction and the requested coverage amount, the following verification level is required:
            </Alert>
            
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <SecurityIcon color="primary" fontSize="large" />
                <Typography variant="h6">
                  {kycLevel === 'basic' ? 'Basic KYC' : kycLevel === 'enhanced' ? 'Enhanced KYC' : 'Full KYC/AML'}
                </Typography>
                <Chip 
                  label={`Level ${kycLevel === 'basic' ? '1' : kycLevel === 'enhanced' ? '2' : '3'}`} 
                  color={kycLevel === 'basic' ? 'success' : kycLevel === 'enhanced' ? 'warning' : 'error'}
                />
              </Stack>
              
              <Typography variant="body2" paragraph>
                This verification level is required for insurance coverage of {coverageAmount} SOL in your jurisdiction 
                ({userJurisdiction?.isEU ? 'European Union' : userJurisdiction?.countryCode}).
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Required Information:
              </Typography>
              
              <Grid container spacing={1}>
                {requiredFields.map(field => (
                  <Grid item xs={6} key={field}>
                    <Chip 
                      icon={<CheckCircleIcon fontSize="small" />} 
                      label={field.replace('_', ' ')} 
                      variant="outlined"
                      sx={{ textTransform: 'capitalize', m: 0.5 }}
                    />
                  </Grid>
                ))}
              </Grid>
              
              {isAmlRequired && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  AML screening will be performed for this transaction due to the coverage amount.
                </Alert>
              )}
            </Paper>
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Please provide your personal information:
            </Typography>
            
            <Grid container spacing={3}>
              {requiredFields.includes('email') && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Email Address"
                    fullWidth
                    value={formData.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    required
                  />
                </Grid>
              )}
              
              {requiredFields.includes('name') && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Full Name"
                    fullWidth
                    value={formData.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                    required
                  />
                </Grid>
              )}
              
              {requiredFields.includes('address') && (
                <Grid item xs={12}>
                  <TextField
                    label="Address"
                    fullWidth
                    multiline
                    rows={2}
                    value={formData.address || ''}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    error={!!formErrors.address}
                    helperText={formErrors.address}
                    required
                  />
                </Grid>
              )}
              
              {requiredFields.includes('ssn') && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Social Security Number"
                    fullWidth
                    value={formData.ssn || ''}
                    onChange={(e) => handleFieldChange('ssn', e.target.value)}
                    error={!!formErrors.ssn}
                    helperText={formErrors.ssn}
                    required
                  />
                </Grid>
              )}
              
              {requiredFields.includes('ssn_last_4') && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Last 4 Digits of SSN"
                    fullWidth
                    value={formData.ssn_last_4 || ''}
                    onChange={(e) => handleFieldChange('ssn_last_4', e.target.value)}
                    error={!!formErrors.ssn_last_4}
                    helperText={formErrors.ssn_last_4}
                    required
                    inputProps={{ maxLength: 4 }}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Please upload the required documents:
            </Typography>
            
            <Grid container spacing={3}>
              {requiredFields.includes('id_document') && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Government-issued ID
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                        <Button
                          variant="outlined"
                          startIcon={<UploadIcon />}
                          onClick={() => handleFieldChange('id_document', 'uploaded')}
                        >
                          Upload ID
                        </Button>
                      </Box>
                      {formData.id_document ? (
                        <Alert severity="success" icon={<CheckCircleIcon />}>
                          ID document uploaded successfully
                        </Alert>
                      ) : (
                        formErrors.id_document && (
                          <Alert severity="error">
                            {formErrors.id_document}
                          </Alert>
                        )
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              {requiredFields.includes('selfie') && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Selfie with ID
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                        <Button
                          variant="outlined"
                          startIcon={<UploadIcon />}
                          onClick={() => handleFieldChange('selfie', 'uploaded')}
                        >
                          Upload Selfie
                        </Button>
                      </Box>
                      {formData.selfie ? (
                        <Alert severity="success" icon={<CheckCircleIcon />}>
                          Selfie uploaded successfully
                        </Alert>
                      ) : (
                        formErrors.selfie && (
                          <Alert severity="error">
                            {formErrors.selfie}
                          </Alert>
                        )
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              {requiredFields.includes('proof_of_address') && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Proof of Address
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                        <Button
                          variant="outlined"
                          startIcon={<UploadIcon />}
                          onClick={() => handleFieldChange('proof_of_address', 'uploaded')}
                        >
                          Upload Document
                        </Button>
                      </Box>
                      {formData.proof_of_address ? (
                        <Alert severity="success" icon={<CheckCircleIcon />}>
                          Proof of address uploaded successfully
                        </Alert>
                      ) : (
                        formErrors.proof_of_address && (
                          <Alert severity="error">
                            {formErrors.proof_of_address}
                          </Alert>
                        )
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              {requiredFields.includes('source_of_funds') && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Source of Funds
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                        <Button
                          variant="outlined"
                          startIcon={<UploadIcon />}
                          onClick={() => handleFieldChange('source_of_funds', 'uploaded')}
                        >
                          Upload Document
                        </Button>
                      </Box>
                      {formData.source_of_funds ? (
                        <Alert severity="success" icon={<CheckCircleIcon />}>
                          Source of funds document uploaded successfully
                        </Alert>
                      ) : (
                        formErrors.source_of_funds && (
                          <Alert severity="error">
                            {formErrors.source_of_funds}
                          </Alert>
                        )
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        );
      
      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            {isLoading ? (
              <Box>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Verifying your information...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This may take a moment as we securely process your information on the Solana blockchain.
                </Typography>
              </Box>
            ) : verificationStatus === 'success' ? (
              <Box>
                <VerifiedUserIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Verification Successful!
                </Typography>
                <Typography variant="body2" paragraph>
                  Your KYC/AML verification has been completed successfully.
                </Typography>
                {transactionSignature && (
                  <Box mt={2}>
                    <Typography variant="caption" display="block">
                      Transaction Signature:
                    </Typography>
                    <Chip 
                      label={`${transactionSignature.substring(0, 8)}...${transactionSignature.substring(transactionSignature.length - 8)}`} 
                      color="primary" 
                      variant="outlined"
                    />
                  </Box>
                )}
              </Box>
            ) : (
              <Box>
                <WarningIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Verification Failed
                </Typography>
                <Typography variant="body2" paragraph>
                  There was an issue with your verification. Please try again or contact support.
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    setVerificationStatus('pending');
                    submitVerification();
                  }}
                >
                  Try Again
                </Button>
              </Box>
            )}
          </Box>
        );
      
      default:
        return 'Unknown step';
    }
  };

  if (!userJurisdiction || !publicKey) {
    return (
      <Alert severity="warning">
        Please connect your wallet and set your jurisdiction to proceed with KYC/AML verification.
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader 
        title="KYC/AML Verification" 
        subheader="Complete verification to comply with regulatory requirements"
        avatar={<SecurityIcon color="primary" />}
      />
      <Divider />
      <CardContent>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {getStepContent(activeStep)}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0 || activeStep === steps.length - 1}
            onClick={handleBack}
          >
            Back
          </Button>
          
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={activeStep === steps.length - 1 || isLoading}
          >
            {activeStep === steps.length - 2 ? 'Submit' : 'Next'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default KycAmlVerification;
