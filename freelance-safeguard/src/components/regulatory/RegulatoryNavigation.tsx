import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  Divider,
  Alert
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Public as PublicIcon,
  Security as SecurityIcon,
  Gavel as GavelIcon,
  Science as ScienceIcon,
  ChevronRight as ChevronRightIcon,
  VerifiedUser as VerifiedUserIcon
} from '@mui/icons-material';

import { useRegulatoryCompliance } from '../../hooks/useRegulatoryCompliance';

const RegulatoryNavigation: React.FC = () => {
  const location = useLocation();
  const { publicKey } = useWallet();
  const { userJurisdiction } = useRegulatoryCompliance();
  
  const navigationItems = [
    {
      name: 'Regulatory Dashboard',
      icon: <PublicIcon />,
      path: '/regulatory-compliance',
      description: 'Overview of your regulatory compliance status and jurisdiction settings'
    },
    {
      name: 'Data Sovereignty',
      icon: <SecurityIcon />,
      path: '/regulatory-compliance?tab=1',
      description: 'Manage your personal data in compliance with jurisdictional requirements'
    },
    {
      name: 'Dispute Resolution',
      icon: <GavelIcon />,
      path: '/regulatory-compliance?tab=2',
      description: 'Create and manage disputes within the regulatory framework'
    },
    {
      name: 'Regulatory Sandbox',
      icon: <ScienceIcon />,
      path: '/regulatory-compliance?tab=3',
      description: 'Participate in regulatory sandboxes for innovative insurance products'
    },
    {
      name: 'KYC/AML Verification',
      icon: <VerifiedUserIcon />,
      path: '/regulatory-compliance?tab=4',
      description: 'Complete identity verification based on your jurisdiction and coverage amount'
    }
  ];

  if (!publicKey) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Regulatory Compliance
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Alert severity="info">
          Please connect your wallet to access regulatory compliance features.
        </Alert>
      </Paper>
    );
  }

  if (!userJurisdiction) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Regulatory Compliance
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Alert severity="warning">
          Please set your jurisdiction to access regulatory compliance features.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Regulatory Compliance
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Manage all regulatory compliance aspects of your FreelanceShield insurance policies.
      </Typography>
      
      <List sx={{ width: '100%' }}>
        {navigationItems.map((item) => {
          // Check if this item's path matches the current location
          const isActive = location.pathname === item.path.split('?')[0] && 
                          (item.path.includes('?') ? 
                            location.search === item.path.substring(item.path.indexOf('?')) : 
                            true);
          
          return (
            <ListItem key={item.name} disablePadding>
              <ListItemButton 
                component={Link} 
                to={item.path}
                selected={isActive}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    },
                  },
                }}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.name} 
                  secondary={item.description}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 'bold' : 'normal',
                  }}
                />
                <ChevronRightIcon />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      <Box mt={2}>
        <Typography variant="caption" color="text.secondary">
          Current Jurisdiction: {userJurisdiction.isEU ? 'European Union' : userJurisdiction.countryCode}
          {userJurisdiction.stateOrProvince ? ` (${userJurisdiction.stateOrProvince})` : ''}
        </Typography>
      </Box>
    </Paper>
  );
};

export default RegulatoryNavigation;
