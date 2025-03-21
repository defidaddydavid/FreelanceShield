import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Tab,
  Tabs
} from '@mui/material';
import {
  Security as SecurityIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

import { useRegulatoryCompliance } from '../../hooks/useRegulatoryCompliance';

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
      id={`data-sovereignty-tabpanel-${index}`}
      aria-labelledby={`data-sovereignty-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DataSovereigntyManager: React.FC = () => {
  const { publicKey } = useWallet();
  const {
    userJurisdiction,
    storePersonalData,
    retrievePersonalData
  } = useRegulatoryCompliance();

  const [tabValue, setTabValue] = useState(0);
  const [storedData, setStoredData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // New data storage
  const [showAddDataDialog, setShowAddDataDialog] = useState(false);
  const [dataType, setDataType] = useState('');
  const [dataContent, setDataContent] = useState('');
  const [isStoringData, setIsStoringData] = useState(false);
  
  // Data retrieval
  const [selectedData, setSelectedData] = useState<any | null>(null);
  const [showDataDialog, setShowDataDialog] = useState(false);
  const [isRetrievingData, setIsRetrievingData] = useState(false);
  const [retrievedData, setRetrievedData] = useState<any | null>(null);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  
  // Mock data for demonstration
  useEffect(() => {
    if (publicKey) {
      // In a real implementation, this would fetch data from the blockchain/off-chain storage
      const mockStoredData = [
        {
          id: 'data-1',
          type: 'KYC',
          hash: '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
          createdAt: new Date().toISOString(),
          jurisdiction: userJurisdiction?.countryCode || 'GLOBAL',
          size: '2.4 KB',
          lastAccessed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'data-2',
          type: 'Insurance Documentation',
          hash: '0xae4f281df5a5d0ff3cad6371f76d5c29b6d953ec48e28bf671c91b764f2fdce1',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          jurisdiction: userJurisdiction?.countryCode || 'GLOBAL',
          size: '1.7 KB',
          lastAccessed: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      setStoredData(mockStoredData);
    }
  }, [publicKey, userJurisdiction]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleAddDataClick = () => {
    setShowAddDataDialog(true);
  };
  
  const handleCloseAddDataDialog = () => {
    setShowAddDataDialog(false);
    setDataType('');
    setDataContent('');
  };
  
  const handleDataTypeChange = (event: any) => {
    setDataType(event.target.value);
  };
  
  const handleDataContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDataContent(event.target.value);
  };
  
  const handleStoreData = async () => {
    if (!publicKey) return;
    
    setIsStoringData(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Store the data
      const result = await storePersonalData(dataType, dataContent);
      
      if (result.success) {
        // Add the new data to the list
        const newData = {
          id: `data-${storedData.length + 1}`,
          type: dataType,
          hash: result.dataHash,
          createdAt: new Date().toISOString(),
          jurisdiction: userJurisdiction?.countryCode || 'GLOBAL',
          size: `${(dataContent.length / 1024).toFixed(1)} KB`,
          lastAccessed: new Date().toISOString()
        };
        
        setStoredData([...storedData, newData]);
        setSuccess(`Data stored successfully with hash: ${result.dataHash}`);
        handleCloseAddDataDialog();
      }
    } catch (err: any) {
      console.error('Failed to store data:', err);
      setError(err.message || 'Failed to store data');
    } finally {
      setIsStoringData(false);
    }
  };
  
  const handleViewData = async (data: any) => {
    setSelectedData(data);
    setRetrievedData(null);
    setShowSensitiveData(false);
    setShowDataDialog(true);
    setIsRetrievingData(true);
    setError(null);
    
    try {
      // Retrieve the data
      const result = await retrievePersonalData(data.hash);
      
      if (result.success) {
        setRetrievedData(result.data);
        
        // Update last accessed timestamp
        const updatedData = storedData.map(item => 
          item.id === data.id 
            ? { ...item, lastAccessed: new Date().toISOString() }
            : item
        );
        
        setStoredData(updatedData);
      }
    } catch (err: any) {
      console.error('Failed to retrieve data:', err);
      setError(err.message || 'Failed to retrieve data');
    } finally {
      setIsRetrievingData(false);
    }
  };
  
  const handleCloseDataDialog = () => {
    setShowDataDialog(false);
    setSelectedData(null);
    setRetrievedData(null);
  };
  
  const handleDeleteData = (data: any) => {
    // In a real implementation, this would call a service to delete the data
    const updatedData = storedData.filter(item => item.id !== data.id);
    setStoredData(updatedData);
    setSuccess(`Data with hash ${data.hash.substring(0, 10)}... has been deleted`);
    
    // Auto-clear success message after 3 seconds
    setTimeout(() => {
      setSuccess(null);
    }, 3000);
  };
  
  const handleDownloadData = (data: any) => {
    // In a real implementation, this would download the data
    alert(`Downloading data with hash: ${data.hash}`);
  };
  
  const getJurisdictionDataProtectionInfo = () => {
    if (!userJurisdiction) return null;
    
    if (userJurisdiction.isEU) {
      return {
        framework: 'GDPR (General Data Protection Regulation)',
        rights: [
          'Right to access',
          'Right to rectification',
          'Right to erasure',
          'Right to restrict processing',
          'Right to data portability',
          'Right to object',
          'Rights related to automated decision making and profiling'
        ],
        retentionPeriod: '5 years after policy expiration',
        dataController: 'FreelanceShield EU Operations',
        dpo: 'privacy@freelanceshield.eu'
      };
    } else if (userJurisdiction.countryCode === 'US') {
      const californiaStates = ['CA'];
      if (californiaStates.includes(userJurisdiction.stateOrProvince)) {
        return {
          framework: 'CCPA (California Consumer Privacy Act)',
          rights: [
            'Right to know',
            'Right to delete',
            'Right to opt-out of sale',
            'Right to non-discrimination'
          ],
          retentionPeriod: '7 years after policy expiration',
          dataController: 'FreelanceShield US Operations',
          dpo: 'privacy@freelanceshield.com'
        };
      } else {
        return {
          framework: 'State-specific regulations',
          rights: [
            'Right to access personal information',
            'Right to correct inaccuracies',
            'Right to delete personal information (where applicable)'
          ],
          retentionPeriod: '7 years after policy expiration',
          dataController: 'FreelanceShield US Operations',
          dpo: 'privacy@freelanceshield.com'
        };
      }
    } else {
      return {
        framework: 'Global Data Protection Standards',
        rights: [
          'Right to access personal information',
          'Right to correct inaccuracies',
          'Right to delete personal information (where applicable)'
        ],
        retentionPeriod: '7 years after policy expiration',
        dataController: 'FreelanceShield Global Operations',
        dpo: 'privacy@freelanceshield.com'
      };
    }
  };
  
  if (!publicKey) {
    return (
      <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Data Sovereignty Manager
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Alert severity="info">
          Please connect your wallet to access data sovereignty features.
        </Alert>
      </Paper>
    );
  }
  
  const dataProtectionInfo = getJurisdictionDataProtectionInfo();
  
  return (
    <Box>
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="data sovereignty tabs">
            <Tab label="My Data" id="data-sovereignty-tab-0" aria-controls="data-sovereignty-tabpanel-0" />
            <Tab label="Data Rights" id="data-sovereignty-tab-1" aria-controls="data-sovereignty-tabpanel-1" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Personal Data Storage
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />}
              onClick={handleAddDataClick}
            >
              Store New Data
            </Button>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          {isLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : storedData.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              You don't have any stored personal data yet.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {storedData.map((data) => (
                <Grid item xs={12} sm={6} md={4} key={data.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="subtitle1" gutterBottom>
                          {data.type}
                        </Typography>
                        <Chip 
                          label={data.jurisdiction} 
                          size="small" 
                          color={data.jurisdiction === 'EU' ? 'primary' : 'default'} 
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Hash: {data.hash.substring(0, 10)}...{data.hash.substring(data.hash.length - 6)}
                      </Typography>
                      
                      <List dense>
                        <ListItem>
                          <ListItemText 
                            primary="Created" 
                            secondary={new Date(data.createdAt).toLocaleDateString()} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Last Accessed" 
                            secondary={new Date(data.lastAccessed).toLocaleDateString()} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Size" 
                            secondary={data.size} 
                          />
                        </ListItem>
                      </List>
                      
                      <Box display="flex" justifyContent="flex-end" mt={1}>
                        <Tooltip title="View Data">
                          <IconButton size="small" onClick={() => handleViewData(data)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download Data">
                          <IconButton size="small" onClick={() => handleDownloadData(data)}>
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Data">
                          <IconButton size="small" color="error" onClick={() => handleDeleteData(data)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Your Data Protection Rights
          </Typography>
          
          {dataProtectionInfo ? (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Your data is protected under {dataProtectionInfo.framework}
                </Typography>
                <Typography variant="body2">
                  FreelanceShield is committed to protecting your personal data in accordance with applicable laws and regulations.
                </Typography>
              </Alert>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Your Rights
                      </Typography>
                      <List dense>
                        {dataProtectionInfo.rights.map((right, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={right} />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Data Management Information
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText 
                            primary="Data Controller" 
                            secondary={dataProtectionInfo.dataController} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Data Protection Officer" 
                            secondary={dataProtectionInfo.dpo} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Data Retention Period" 
                            secondary={dataProtectionInfo.retentionPeriod} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Storage Location" 
                            secondary={userJurisdiction?.isEU ? "EU-based secure storage" : "Region-specific secure storage"} 
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        FreelanceShield Data Protection Approach
                      </Typography>
                      <Typography variant="body2" paragraph>
                        FreelanceShield uses a hybrid data storage approach that combines blockchain technology with traditional secure storage:
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText 
                            primary="On-Chain Data" 
                            secondary="Policy metadata, transaction records, and claim status are stored on the Solana blockchain for transparency and immutability." 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Off-Chain Data" 
                            secondary="Personal information and sensitive documents are stored off-chain in secure, jurisdiction-compliant storage with cryptographic links to on-chain records." 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Data Sovereignty" 
                            secondary="Your personal data is stored in compliance with your jurisdiction's data protection laws, ensuring data sovereignty requirements are met." 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Right to Erasure" 
                            secondary="While blockchain transactions are immutable, all personal identifiable information is stored off-chain and can be deleted upon request in accordance with applicable laws." 
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Alert severity="warning">
              Please set your jurisdiction to view applicable data protection information.
            </Alert>
          )}
        </TabPanel>
      </Paper>
      
      {/* Add Data Dialog */}
      <Dialog open={showAddDataDialog} onClose={handleCloseAddDataDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Store Personal Data</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Your personal data will be stored securely off-chain in compliance with your jurisdiction's data protection laws.
            Only a cryptographic hash of your data will be stored on the blockchain.
          </Typography>
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="data-type-select-label">Data Type</InputLabel>
            <Select
              labelId="data-type-select-label"
              value={dataType}
              label="Data Type"
              onChange={handleDataTypeChange}
            >
              <MenuItem value="KYC">KYC Information</MenuItem>
              <MenuItem value="Insurance Documentation">Insurance Documentation</MenuItem>
              <MenuItem value="Identity Verification">Identity Verification</MenuItem>
              <MenuItem value="Financial Information">Financial Information</MenuItem>
              <MenuItem value="Contact Information">Contact Information</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Data Content"
            multiline
            rows={4}
            value={dataContent}
            onChange={handleDataContentChange}
            margin="normal"
          />
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              By storing your data, you consent to its processing in accordance with our Privacy Policy
              and the applicable data protection laws in your jurisdiction.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDataDialog}>Cancel</Button>
          <Button 
            onClick={handleStoreData} 
            variant="contained" 
            disabled={!dataType || !dataContent || isStoringData}
            startIcon={isStoringData ? <CircularProgress size={20} /> : undefined}
          >
            {isStoringData ? 'Storing...' : 'Store Data'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* View Data Dialog */}
      <Dialog open={showDataDialog} onClose={handleCloseDataDialog} maxWidth="sm" fullWidth>
        {selectedData && (
          <>
            <DialogTitle>{selectedData.type}</DialogTitle>
            <DialogContent>
              <Typography variant="subtitle2" gutterBottom>
                Data Hash
              </Typography>
              <Typography variant="body2" paragraph>
                {selectedData.hash}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Data Content
              </Typography>
              
              {isRetrievingData ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : retrievedData ? (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Sensitive information
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => setShowSensitiveData(!showSensitiveData)}
                      aria-label={showSensitiveData ? 'Hide sensitive data' : 'Show sensitive data'}
                    >
                      {showSensitiveData ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </Box>
                  
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'background.default',
                      filter: showSensitiveData ? 'none' : 'blur(5px)',
                      userSelect: showSensitiveData ? 'auto' : 'none'
                    }}
                  >
                    <Typography variant="body2">
                      {retrievedData}
                    </Typography>
                  </Paper>
                  
                  {!showSensitiveData && (
                    <Box textAlign="center" mt={1}>
                      <Typography variant="caption" color="text.secondary">
                        Click the eye icon to view sensitive data
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Alert severity="info">
                  No data content available. This could be due to data expiration or access restrictions.
                </Alert>
              )}
              
              <Alert severity="warning" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  This data is stored in accordance with {selectedData.jurisdiction} data protection regulations.
                  Access to this data is logged and may be subject to regulatory oversight.
                </Typography>
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDataDialog}>Close</Button>
              <Button 
                onClick={() => handleDownloadData(selectedData)} 
                startIcon={<DownloadIcon />}
                disabled={!retrievedData}
              >
                Download
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default DataSovereigntyManager;
