import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Divider, 
  Chip, 
  Button, 
  Alert, 
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon, 
  Warning as WarningIcon, 
  Info as InfoIcon,
  Public as PublicIcon,
  Security as SecurityIcon,
  Gavel as GavelIcon,
  SyncAlt as SyncAltIcon
} from '@mui/icons-material';

import { useRegulatoryCompliance } from '../../hooks/useRegulatoryCompliance';
import { SUPPORTED_JURISDICTIONS } from '../../lib/regulatory/constants';

const RegulatoryDashboard: React.FC = () => {
  const { publicKey } = useWallet();
  const { 
    userJurisdiction, 
    isLoading, 
    error, 
    inSandbox, 
    requiredDisclosures,
    setManualJurisdiction,
    getSupportedJurisdictions,
    getRequiredDisclosures
  } = useRegulatoryCompliance();

  const [jurisdictionDialogOpen, setJurisdictionDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [complianceStatus, setComplianceStatus] = useState<'compliant' | 'partial' | 'non-compliant'>('compliant');
  const [showDisclosures, setShowDisclosures] = useState(false);

  // Set initial compliance status based on sandbox and jurisdiction
  useEffect(() => {
    if (userJurisdiction) {
      // For demonstration purposes, we'll set the compliance status based on the jurisdiction
      if (inSandbox) {
        setComplianceStatus('partial');
      } else if (userJurisdiction.countryCode === 'GLOBAL') {
        setComplianceStatus('partial');
      } else {
        setComplianceStatus('compliant');
      }
    } else {
      setComplianceStatus('non-compliant');
    }
  }, [userJurisdiction, inSandbox]);

  const handleJurisdictionDialogOpen = () => {
    setJurisdictionDialogOpen(true);
    if (userJurisdiction) {
      setSelectedCountry(userJurisdiction.countryCode);
      setSelectedState(userJurisdiction.stateOrProvince);
    }
  };

  const handleJurisdictionDialogClose = () => {
    setJurisdictionDialogOpen(false);
  };

  const handleCountryChange = (event: SelectChangeEvent) => {
    setSelectedCountry(event.target.value);
  };

  const handleStateChange = (event: SelectChangeEvent) => {
    setSelectedState(event.target.value);
  };

  const handleJurisdictionSave = () => {
    setManualJurisdiction(selectedCountry, selectedState);
    setJurisdictionDialogOpen(false);
  };

  const renderComplianceStatus = () => {
    switch (complianceStatus) {
      case 'compliant':
        return (
          <Box display="flex" alignItems="center" mb={2}>
            <CheckCircleIcon color="success" sx={{ mr: 1 }} />
            <Typography variant="h6" color="success.main">Fully Compliant</Typography>
          </Box>
        );
      case 'partial':
        return (
          <Box display="flex" alignItems="center" mb={2}>
            <WarningIcon color="warning" sx={{ mr: 1 }} />
            <Typography variant="h6" color="warning.main">Partially Compliant (Sandbox Mode)</Typography>
          </Box>
        );
      case 'non-compliant':
        return (
          <Box display="flex" alignItems="center" mb={2}>
            <WarningIcon color="error" sx={{ mr: 1 }} />
            <Typography variant="h6" color="error.main">Jurisdiction Not Set</Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  if (!publicKey) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>Regulatory Compliance Dashboard</Typography>
          <Alert severity="info">Please connect your wallet to view regulatory compliance information.</Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>Regulatory Compliance Dashboard</Typography>
          <Box display="flex" justifyContent="center" alignItems="center" p={3}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">Regulatory Compliance Dashboard</Typography>
            <Button 
              variant="outlined" 
              onClick={handleJurisdictionDialogOpen}
            >
              Change Jurisdiction
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {renderComplianceStatus()}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  <PublicIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Jurisdiction Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {userJurisdiction ? (
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Country/Region" 
                        secondary={SUPPORTED_JURISDICTIONS[userJurisdiction.countryCode as keyof typeof SUPPORTED_JURISDICTIONS]?.name || userJurisdiction.countryCode} 
                      />
                    </ListItem>
                    {userJurisdiction.stateOrProvince && (
                      <ListItem>
                        <ListItemText 
                          primary="State/Province" 
                          secondary={userJurisdiction.stateOrProvince} 
                        />
                      </ListItem>
                    )}
                    <ListItem>
                      <ListItemText 
                        primary="Detection Method" 
                        secondary={userJurisdiction.detectionMethod === 'ip-geolocation' ? 'Automatic (IP Geolocation)' : 'Manually Set'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="EU Member State" 
                        secondary={userJurisdiction.isEU ? 'Yes' : 'No'} 
                      />
                    </ListItem>
                  </List>
                ) : (
                  <Typography color="text.secondary">
                    No jurisdiction information available. Please set your jurisdiction.
                  </Typography>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Regulatory Framework
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {userJurisdiction ? (
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Applicable Frameworks" 
                        secondary={
                          userJurisdiction.isEU 
                            ? SUPPORTED_JURISDICTIONS.EU.regulatoryFrameworks.join(', ')
                            : SUPPORTED_JURISDICTIONS[userJurisdiction.countryCode as keyof typeof SUPPORTED_JURISDICTIONS]?.regulatoryFrameworks.join(', ') || 'Global Standards'
                        } 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Sandbox Status" 
                        secondary={inSandbox ? 'Operating in Regulatory Sandbox' : 'Standard Regulatory Compliance'} 
                      />
                    </ListItem>
                    {inSandbox && (
                      <ListItem>
                        <ListItemText 
                          primary="Sandbox Limitations" 
                          secondary="Coverage limits and user count restrictions apply" 
                        />
                      </ListItem>
                    )}
                    <ListItem>
                      <ListItemIcon>
                        <Button 
                          size="small" 
                          onClick={() => setShowDisclosures(!showDisclosures)}
                          endIcon={<InfoIcon />}
                        >
                          {showDisclosures ? 'Hide Disclosures' : 'View Required Disclosures'}
                        </Button>
                      </ListItemIcon>
                    </ListItem>
                  </List>
                ) : (
                  <Typography color="text.secondary">
                    No regulatory framework information available. Please set your jurisdiction.
                  </Typography>
                )}
              </Paper>
            </Grid>

            {showDisclosures && requiredDisclosures.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Required Regulatory Disclosures:</Typography>
                  {requiredDisclosures.map((disclosure, index) => (
                    <Typography key={index} variant="body2" paragraph>
                      {disclosure}
                    </Typography>
                  ))}
                </Alert>
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  <GavelIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Dispute Resolution
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {userJurisdiction ? (
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Primary Resolution Mechanism" 
                        secondary={
                          userJurisdiction.isEU 
                            ? "On-Chain Arbitration with EU Regulatory Oversight"
                            : userJurisdiction.countryCode === "US"
                              ? "Hybrid Arbitration with State Insurance Commission Oversight"
                              : "On-Chain Arbitration with Regulatory Oversight"
                        } 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Cross-Border Resolution" 
                        secondary="Hybrid Arbitration with Multi-Jurisdictional Framework" 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Appeal Process" 
                        secondary="Available with escalation path to judicial review if needed" 
                      />
                    </ListItem>
                  </List>
                ) : (
                  <Typography color="text.secondary">
                    No dispute resolution information available. Please set your jurisdiction.
                  </Typography>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  <SyncAltIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Data Sovereignty
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {userJurisdiction ? (
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Data Storage Location" 
                        secondary={
                          userJurisdiction.isEU 
                            ? "EU-based storage with GDPR compliance"
                            : userJurisdiction.countryCode === "US"
                              ? "US-based storage with CCPA compliance (where applicable)"
                              : "Region-specific storage with local data protection compliance"
                        } 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Data Subject Rights" 
                        secondary={
                          userJurisdiction.isEU 
                            ? "Access, Rectification, Erasure, Restriction, Portability, Objection"
                            : userJurisdiction.countryCode === "US"
                              ? "Access, Deletion, Opt-out of Sale, Non-discrimination"
                              : "Access, Correction, Basic Data Rights"
                        } 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Blockchain Data" 
                        secondary="Policy metadata on-chain, personal data off-chain with hash verification" 
                      />
                    </ListItem>
                  </List>
                ) : (
                  <Typography color="text.secondary">
                    No data sovereignty information available. Please set your jurisdiction.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Jurisdiction Selection Dialog */}
      <Dialog open={jurisdictionDialogOpen} onClose={handleJurisdictionDialogClose}>
        <DialogTitle>Set Your Jurisdiction</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Your jurisdiction determines which regulatory frameworks apply to your insurance policies.
            Please select your country and state/province (if applicable).
          </Typography>
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="country-select-label">Country/Region</InputLabel>
            <Select
              labelId="country-select-label"
              id="country-select"
              value={selectedCountry}
              label="Country/Region"
              onChange={handleCountryChange}
            >
              {getSupportedJurisdictions().map((jurisdiction) => (
                <MenuItem key={jurisdiction.code} value={jurisdiction.code}>
                  {jurisdiction.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {selectedCountry === 'US' && (
            <FormControl fullWidth margin="normal">
              <InputLabel id="state-select-label">State</InputLabel>
              <Select
                labelId="state-select-label"
                id="state-select"
                value={selectedState}
                label="State"
                onChange={handleStateChange}
              >
                {/* US States */}
                {['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'].map((state) => (
                  <MenuItem key={state} value={state}>
                    {state}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              By setting your jurisdiction, you confirm that you are physically located in this region
              and subject to its regulatory framework. This information will be used to determine
              applicable insurance regulations and data protection requirements.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleJurisdictionDialogClose}>Cancel</Button>
          <Button onClick={handleJurisdictionSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RegulatoryDashboard;
