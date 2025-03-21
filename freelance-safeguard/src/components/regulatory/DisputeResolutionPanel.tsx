import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Gavel as GavelIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  AttachMoney as AttachMoneyIcon,
  Public as PublicIcon
} from '@mui/icons-material';

import { useRegulatoryCompliance } from '../../hooks/useRegulatoryCompliance';
import { DisputeStatus, ResolutionMechanism } from '../../lib/regulatory/disputeResolution';
import { SUPPORTED_JURISDICTIONS } from '../../lib/regulatory/constants';

interface DisputeResolutionPanelProps {
  policyId?: string;
  claimId?: string;
  respondentAddress?: string;
}

const DisputeResolutionPanel: React.FC<DisputeResolutionPanelProps> = ({
  policyId,
  claimId,
  respondentAddress
}) => {
  const { publicKey } = useWallet();
  const {
    userJurisdiction,
    createDispute,
    getUserDisputes,
    checkDisputeCreationCompliance
  } = useRegulatoryCompliance();

  // State for dispute creation
  const [activeStep, setActiveStep] = useState(0);
  const [disputeAmount, setDisputeAmount] = useState<number>(0);
  const [disputeCurrency, setDisputeCurrency] = useState<string>('SOL');
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([]);
  const [disputeDescription, setDisputeDescription] = useState<string>('');
  const [isCreatingDispute, setIsCreatingDispute] = useState<boolean>(false);
  const [createDisputeError, setCreateDisputeError] = useState<string | null>(null);
  const [createDisputeSuccess, setCreateDisputeSuccess] = useState<boolean>(false);
  
  // State for dispute listing
  const [disputes, setDisputes] = useState<any[]>([]);
  const [isLoadingDisputes, setIsLoadingDisputes] = useState<boolean>(false);
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [disputeDetailOpen, setDisputeDetailOpen] = useState<boolean>(false);
  
  // Load user disputes
  useEffect(() => {
    if (publicKey) {
      loadUserDisputes();
    }
  }, [publicKey]);
  
  const loadUserDisputes = async () => {
    if (!publicKey) return;
    
    setIsLoadingDisputes(true);
    try {
      const userDisputes = getUserDisputes();
      setDisputes(userDisputes);
    } catch (error) {
      console.error('Failed to load disputes:', error);
    } finally {
      setIsLoadingDisputes(false);
    }
  };
  
  // Initialize with provided props
  useEffect(() => {
    if (policyId && userJurisdiction) {
      // Pre-select user's jurisdiction
      const jurisdictions = [userJurisdiction.isEU ? 'EU' : userJurisdiction.countryCode];
      setSelectedJurisdictions(jurisdictions);
    }
  }, [policyId, userJurisdiction]);
  
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  const handleDisputeAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseFloat(event.target.value);
    setDisputeAmount(isNaN(amount) ? 0 : amount);
  };
  
  const handleDisputeCurrencyChange = (event: any) => {
    setDisputeCurrency(event.target.value);
  };
  
  const handleJurisdictionChange = (event: any) => {
    setSelectedJurisdictions(event.target.value);
  };
  
  const handleDisputeDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDisputeDescription(event.target.value);
  };
  
  const handleCreateDispute = async () => {
    if (!publicKey || !policyId || !claimId || !respondentAddress) {
      setCreateDisputeError('Missing required information for dispute creation');
      return;
    }
    
    setIsCreatingDispute(true);
    setCreateDisputeError(null);
    
    try {
      // Check compliance first
      const complianceResult = checkDisputeCreationCompliance(
        policyId,
        claimId,
        disputeAmount
      );
      
      if (!complianceResult.approved) {
        setCreateDisputeError(`Regulatory compliance check failed: ${complianceResult.reason}`);
        return;
      }
      
      // Create the dispute
      const respondentPublicKey = new PublicKey(respondentAddress);
      
      await createDispute(
        policyId,
        claimId,
        respondentPublicKey,
        disputeAmount,
        disputeCurrency,
        selectedJurisdictions
      );
      
      setCreateDisputeSuccess(true);
      loadUserDisputes(); // Refresh disputes list
    } catch (error: any) {
      console.error('Failed to create dispute:', error);
      setCreateDisputeError(error.message || 'Failed to create dispute');
    } finally {
      setIsCreatingDispute(false);
    }
  };
  
  const handleOpenDisputeDetail = (dispute: any) => {
    setSelectedDispute(dispute);
    setDisputeDetailOpen(true);
  };
  
  const handleCloseDisputeDetail = () => {
    setDisputeDetailOpen(false);
  };
  
  const getDisputeStatusChip = (status: DisputeStatus) => {
    switch (status) {
      case DisputeStatus.PENDING:
        return <Chip label="Pending" color="warning" size="small" />;
      case DisputeStatus.IN_PROGRESS:
        return <Chip label="In Progress" color="info" size="small" />;
      case DisputeStatus.RESOLVED:
        return <Chip label="Resolved" color="success" size="small" />;
      case DisputeStatus.REJECTED:
        return <Chip label="Rejected" color="error" size="small" />;
      case DisputeStatus.APPEALED:
        return <Chip label="Appealed" color="secondary" size="small" />;
      default:
        return <Chip label="Unknown" color="default" size="small" />;
    }
  };
  
  const getResolutionMechanismText = (mechanism: ResolutionMechanism) => {
    switch (mechanism) {
      case ResolutionMechanism.ON_CHAIN_ARBITRATION:
        return 'On-Chain Arbitration';
      case ResolutionMechanism.LICENSED_ADJUSTER:
        return 'Licensed Insurance Adjuster';
      case ResolutionMechanism.HYBRID:
        return 'Hybrid Resolution';
      case ResolutionMechanism.JUDICIAL_REVIEW:
        return 'Judicial Review';
      default:
        return 'Unknown';
    }
  };
  
  const steps = ['Dispute Details', 'Jurisdiction Selection', 'Review & Submit'];
  
  if (!publicKey) {
    return (
      <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          <GavelIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Dispute Resolution
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Alert severity="info">
          Please connect your wallet to access dispute resolution features.
        </Alert>
      </Paper>
    );
  }
  
  return (
    <Box>
      {/* Dispute Creation Form */}
      {(policyId && claimId && respondentAddress && !createDisputeSuccess) && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            <GavelIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Create Dispute
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {createDisputeError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createDisputeError}
            </Alert>
          )}
          
          {activeStep === 0 && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Dispute Description"
                    multiline
                    rows={4}
                    value={disputeDescription}
                    onChange={handleDisputeDescriptionChange}
                    helperText="Describe the reason for your dispute in detail"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Dispute Amount"
                    type="number"
                    value={disputeAmount || ''}
                    onChange={handleDisputeAmountChange}
                    InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="currency-select-label">Currency</InputLabel>
                    <Select
                      labelId="currency-select-label"
                      value={disputeCurrency}
                      label="Currency"
                      onChange={handleDisputeCurrencyChange}
                    >
                      <MenuItem value="SOL">SOL</MenuItem>
                      <MenuItem value="USDC">USDC</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!disputeDescription || disputeAmount <= 0}
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}
          
          {activeStep === 1 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Select Applicable Jurisdictions
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select all jurisdictions that should be considered for this dispute.
                This will determine which regulatory frameworks apply to the resolution process.
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="jurisdictions-select-label">Jurisdictions</InputLabel>
                <Select
                  labelId="jurisdictions-select-label"
                  multiple
                  value={selectedJurisdictions}
                  label="Jurisdictions"
                  onChange={handleJurisdictionChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={SUPPORTED_JURISDICTIONS[value as keyof typeof SUPPORTED_JURISDICTIONS]?.name || value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {Object.entries(SUPPORTED_JURISDICTIONS).map(([code, info]) => (
                    <MenuItem key={code} value={code}>
                      {info.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  For cross-border disputes, selecting multiple jurisdictions will activate our hybrid
                  dispute resolution mechanism, which combines on-chain arbitration with licensed adjusters
                  and potential judicial review.
                </Typography>
              </Alert>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button onClick={handleBack}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={selectedJurisdictions.length === 0}
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}
          
          {activeStep === 2 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Review Dispute Details
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      <DescriptionIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Dispute Information
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Policy ID"
                          secondary={policyId}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Claim ID"
                          secondary={claimId}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Description"
                          secondary={disputeDescription}
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      <AttachMoneyIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Financial Details
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Dispute Amount"
                          secondary={`${disputeAmount} ${disputeCurrency}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Respondent"
                          secondary={respondentAddress.substring(0, 8) + '...' + respondentAddress.substring(respondentAddress.length - 8)}
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      <PublicIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Jurisdictional Information
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Selected Jurisdictions"
                          secondary={selectedJurisdictions.map(code => 
                            SUPPORTED_JURISDICTIONS[code as keyof typeof SUPPORTED_JURISDICTIONS]?.name || code
                          ).join(', ')}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Resolution Mechanism"
                          secondary={selectedJurisdictions.length > 1 ? 'Hybrid Resolution (Cross-Border)' : 'Standard Resolution'}
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
              </Grid>
              
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  By submitting this dispute, you agree to abide by the dispute resolution process
                  as defined by the selected jurisdictions. This may include on-chain arbitration,
                  licensed adjuster review, and potential judicial proceedings.
                </Typography>
              </Alert>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={handleBack}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleCreateDispute}
                  disabled={isCreatingDispute}
                  startIcon={isCreatingDispute ? <CircularProgress size={20} /> : undefined}
                >
                  {isCreatingDispute ? 'Submitting...' : 'Submit Dispute'}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      )}
      
      {/* Success Message */}
      {createDisputeSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <AlertTitle>Dispute Created Successfully</AlertTitle>
          Your dispute has been submitted and is now pending review. You can track its status in the list below.
        </Alert>
      )}
      
      {/* Disputes List */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            <GavelIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            My Disputes
          </Typography>
          <Button 
            size="small" 
            startIcon={<AddIcon />}
            onClick={() => setCreateDisputeSuccess(false)}
            disabled={!policyId || !claimId || !respondentAddress || !createDisputeSuccess}
          >
            New Dispute
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        {isLoadingDisputes ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : disputes.length === 0 ? (
          <Alert severity="info">
            You don't have any disputes yet.
          </Alert>
        ) : (
          <Box>
            {disputes.map((dispute, index) => (
              <Accordion key={index} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" pr={2}>
                    <Typography variant="subtitle2">
                      Dispute #{dispute.id.substring(0, 8)}
                    </Typography>
                    <Box>
                      {getDisputeStatusChip(dispute.status)}
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Amount:</strong> {dispute.amount} {dispute.currency}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Created:</strong> {new Date(dispute.createdAt).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Resolution Method:</strong> {getResolutionMechanismText(dispute.resolutionMechanism)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Jurisdictions:</strong> {dispute.jurisdictions.join(', ')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Box display="flex" justifyContent="flex-end">
                        <Button size="small" onClick={() => handleOpenDisputeDetail(dispute)}>
                          View Details
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Paper>
      
      {/* Dispute Detail Dialog */}
      <Dialog open={disputeDetailOpen} onClose={handleCloseDisputeDetail} maxWidth="md" fullWidth>
        {selectedDispute && (
          <>
            <DialogTitle>
              Dispute Details
              <Typography variant="subtitle2" color="text.secondary">
                ID: {selectedDispute.id}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <DescriptionIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Dispute Information
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText
                            primary="Policy ID"
                            secondary={selectedDispute.policyId}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Claim ID"
                            secondary={selectedDispute.claimId}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Status"
                            secondary={
                              <Box sx={{ mt: 0.5 }}>
                                {getDisputeStatusChip(selectedDispute.status)}
                              </Box>
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Created"
                            secondary={new Date(selectedDispute.createdAt).toLocaleString()}
                          />
                        </ListItem>
                        {selectedDispute.resolvedAt && (
                          <ListItem>
                            <ListItemText
                              primary="Resolved"
                              secondary={new Date(selectedDispute.resolvedAt).toLocaleString()}
                            />
                          </ListItem>
                        )}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <PersonIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Parties
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText
                            primary="Claimant"
                            secondary={selectedDispute.claimant.toString()}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Respondent"
                            secondary={selectedDispute.respondent.toString()}
                          />
                        </ListItem>
                        {selectedDispute.arbitrator && (
                          <ListItem>
                            <ListItemText
                              primary="Arbitrator"
                              secondary={selectedDispute.arbitrator.toString()}
                            />
                          </ListItem>
                        )}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <AttachMoneyIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Financial Details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <List dense>
                            <ListItem>
                              <ListItemText
                                primary="Dispute Amount"
                                secondary={`${selectedDispute.amount} ${selectedDispute.currency}`}
                              />
                            </ListItem>
                            {selectedDispute.awardedAmount !== undefined && (
                              <ListItem>
                                <ListItemText
                                  primary="Awarded Amount"
                                  secondary={`${selectedDispute.awardedAmount} ${selectedDispute.currency}`}
                                />
                              </ListItem>
                            )}
                          </List>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <List dense>
                            <ListItem>
                              <ListItemText
                                primary="Escrow Amount"
                                secondary={selectedDispute.escrowAmount ? `${selectedDispute.escrowAmount} ${selectedDispute.currency}` : 'N/A'}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText
                                primary="Fees"
                                secondary={selectedDispute.fees ? `${selectedDispute.fees} ${selectedDispute.currency}` : 'N/A'}
                              />
                            </ListItem>
                          </List>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <PublicIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Resolution Details
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText
                            primary="Resolution Mechanism"
                            secondary={getResolutionMechanismText(selectedDispute.resolutionMechanism)}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Applicable Jurisdictions"
                            secondary={selectedDispute.jurisdictions.map((code: string) => 
                              SUPPORTED_JURISDICTIONS[code as keyof typeof SUPPORTED_JURISDICTIONS]?.name || code
                            ).join(', ')}
                          />
                        </ListItem>
                        {selectedDispute.appealDeadline && (
                          <ListItem>
                            <ListItemText
                              primary="Appeal Deadline"
                              secondary={new Date(selectedDispute.appealDeadline).toLocaleString()}
                            />
                          </ListItem>
                        )}
                      </List>
                      
                      {selectedDispute.resolution && (
                        <Box mt={2}>
                          <Typography variant="subtitle2" gutterBottom>
                            Resolution Summary
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                            <Typography variant="body2">
                              {selectedDispute.resolution}
                            </Typography>
                          </Paper>
                        </Box>
                      )}
                    </CardContent>
                    
                    {selectedDispute.status === DisputeStatus.RESOLVED && selectedDispute.appealDeadline && new Date(selectedDispute.appealDeadline) > new Date() && (
                      <CardActions>
                        <Button size="small" color="warning">
                          Appeal Resolution
                        </Button>
                      </CardActions>
                    )}
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDisputeDetail}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default DisputeResolutionPanel;
