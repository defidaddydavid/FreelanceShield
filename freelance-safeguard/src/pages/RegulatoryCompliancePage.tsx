import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
  Button,
  Divider,
  Grid
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Security as SecurityIcon,
  Gavel as GavelIcon,
  Science as ScienceIcon,
  Public as PublicIcon,
  VerifiedUser as VerifiedUserIcon
} from '@mui/icons-material';

import RegulatoryDashboard from '../components/regulatory/RegulatoryDashboard';
import DataSovereigntyManager from '../components/regulatory/DataSovereigntyManager';
import DisputeResolutionPanel from '../components/regulatory/DisputeResolutionPanel';
import RegulatorySandboxPanel from '../components/regulatory/RegulatorySandboxPanel';
import RegulatoryNavigation from '../components/regulatory/RegulatoryNavigation';
import RegulatoryRoadmap from '../components/regulatory/RegulatoryRoadmap';
import KycAmlVerification from '../components/regulatory/KycAmlVerification';
import { useRegulatoryCompliance } from '../hooks/useRegulatoryCompliance';
import { useLocation } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`regulatory-tabpanel-${index}`}
      aria-labelledby={`regulatory-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `regulatory-tab-${index}`,
    'aria-controls': `regulatory-tabpanel-${index}`,
  };
}

const RegulatoryCompliancePage: React.FC = () => {
  const { publicKey } = useWallet();
  const { userJurisdiction, detectJurisdiction, isLoading } = useRegulatoryCompliance();
  const location = useLocation();
  
  // Extract tab value from URL query parameter if present
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');
  const initialTab = tabParam ? parseInt(tabParam, 10) : 0;
  
  const [tabValue, setTabValue] = useState(initialTab);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <AccountBalanceIcon sx={{ fontSize: 32, mr: 2 }} />
          <Typography variant="h4">Regulatory Compliance Center</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="body1" paragraph>
          Manage all regulatory compliance aspects of your FreelanceShield insurance policies, including
          jurisdiction-specific requirements, data sovereignty, dispute resolution, and sandbox participation.
        </Typography>
        
        {!publicKey ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Please connect your wallet to access regulatory compliance features.
          </Alert>
        ) : !userJurisdiction ? (
          <Box sx={{ mb: 3 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Please set your jurisdiction to access regulatory compliance features.
            </Alert>
            <Button 
              variant="contained" 
              onClick={detectJurisdiction}
              disabled={isLoading}
            >
              {isLoading ? 'Detecting...' : 'Auto-Detect Jurisdiction'}
            </Button>
          </Box>
        ) : null}
      </Paper>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4} lg={3}>
          <RegulatoryNavigation />
        </Grid>
        
        <Grid item xs={12} md={8} lg={9}>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="regulatory compliance tabs"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab 
                  icon={<PublicIcon />} 
                  label="Dashboard" 
                  {...a11yProps(0)} 
                />
                <Tab 
                  icon={<SecurityIcon />} 
                  label="Data Sovereignty" 
                  {...a11yProps(1)} 
                />
                <Tab 
                  icon={<GavelIcon />} 
                  label="Dispute Resolution" 
                  {...a11yProps(2)} 
                />
                <Tab 
                  icon={<ScienceIcon />} 
                  label="Regulatory Sandbox" 
                  {...a11yProps(3)} 
                />
                <Tab 
                  icon={<VerifiedUserIcon />} 
                  label="KYC/AML" 
                  {...a11yProps(4)} 
                />
              </Tabs>
            </Box>
            
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <RegulatoryDashboard />
                </Grid>
                <Grid item xs={12}>
                  <RegulatoryRoadmap />
                </Grid>
              </Grid>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <DataSovereigntyManager />
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <DisputeResolutionPanel />
            </TabPanel>
            
            <TabPanel value={tabValue} index={3}>
              <RegulatorySandboxPanel />
            </TabPanel>
            
            <TabPanel value={tabValue} index={4}>
              <KycAmlVerification coverageAmount={500} />
            </TabPanel>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default RegulatoryCompliancePage;
