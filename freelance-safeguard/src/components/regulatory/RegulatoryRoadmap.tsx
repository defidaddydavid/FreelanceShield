import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  useTheme,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Flag as FlagIcon,
  EmojiPeople as EmojiPeopleIcon,
  Public as PublicIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Construction as ConstructionIcon,
  Security as SecurityIcon,
  Gavel as GavelIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';

interface RoadmapStage {
  stage: string;
  keyFocus: string;
  regulatoryApproach: string;
  icon: React.ReactNode;
  status: 'current' | 'completed' | 'upcoming';
  details: string[];
  statusIcon: React.ReactNode;
}

const RegulatoryRoadmap: React.FC = () => {
  const theme = useTheme();

  const roadmapStages: RoadmapStage[] = [
    {
      stage: 'MVP & Beta Testing',
      keyFocus: 'Testing smart contracts, risk models, onboarding early users',
      regulatoryApproach: 'Minimal legal structure but ensure clear disclaimers & risk warnings',
      icon: <FlagIcon />,
      status: 'completed',
      statusIcon: <CheckCircleIcon color="success" />,
      details: [
        'Implement clear disclaimers and risk warnings',
        'Focus on testing smart contracts and risk models',
        'Establish basic terms of service',
        'Maintain minimal legal structure'
      ]
    },
    {
      stage: 'Early Traction (First 1,000 Users)',
      keyFocus: 'Refining insurance pools, payouts, and governance',
      regulatoryApproach: 'Start legal entity setup (Wyoming DAO LLC or offshore registration in crypto-friendly jurisdictions)',
      icon: <EmojiPeopleIcon />,
      status: 'current',
      statusIcon: <ConstructionIcon color="primary" />,
      details: [
        'Begin legal entity formation process',
        'Explore Wyoming DAO LLC structure',
        'Consider offshore registration options',
        'Refine insurance pools and governance mechanisms',
        'Implement basic KYC procedures'
      ]
    },
    {
      stage: 'Scaling to Multiple Markets',
      keyFocus: 'Expanding coverage, raising funds, larger payouts',
      regulatoryApproach: 'Implement tiered KYC/AML compliance, begin jurisdictional licensing discussions',
      icon: <PublicIcon />,
      status: 'upcoming',
      statusIcon: <SecurityIcon color="action" />,
      details: [
        'Develop comprehensive tiered KYC/AML system',
        'Initiate discussions with regulatory bodies',
        'Explore jurisdictional licensing requirements',
        'Implement cross-border compliance mechanisms',
        'Establish data sovereignty frameworks'
      ]
    },
    {
      stage: 'Mass Adoption (10K+ Users, Major Funds)',
      keyFocus: 'Partnerships with businesses, institutional investors',
      regulatoryApproach: 'Engage with regulators, obtain insurance licenses in key markets, establish global legal structures',
      icon: <BusinessIcon />,
      status: 'upcoming',
      statusIcon: <GavelIcon color="action" />,
      details: [
        'Obtain insurance licenses in key markets',
        'Establish global legal entity structure',
        'Implement full regulatory compliance framework',
        'Engage directly with regulatory bodies',
        'Develop institutional-grade compliance reporting',
        'Create regulatory sandbox participation program'
      ]
    }
  ];

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h5" component="h2">
            Regulatory Compliance Roadmap
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          FreelanceShield's approach to regulatory compliance evolves with our growth stages, ensuring appropriate measures at each phase of development.
        </Typography>
        
        <Divider sx={{ my: 3 }} />

        <Stepper orientation="vertical" nonLinear>
          {roadmapStages.map((stage, index) => (
            <Step key={index} active={stage.status !== 'upcoming'} completed={stage.status === 'completed'}>
              <StepLabel
                StepIconComponent={() => (
                  <Box sx={{ 
                    display: 'flex',
                    bgcolor: stage.status === 'current' ? theme.palette.primary.main : 
                           stage.status === 'completed' ? theme.palette.success.main : 
                           theme.palette.grey[300],
                    color: stage.status === 'upcoming' ? theme.palette.text.secondary : '#fff',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {stage.icon}
                  </Box>
                )}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" component="span">
                    {stage.stage}
                  </Typography>
                  <Chip 
                    icon={stage.statusIcon as React.ReactElement}
                    label={stage.status.charAt(0).toUpperCase() + stage.status.slice(1)} 
                    size="small"
                    color={
                      stage.status === 'current' ? 'primary' : 
                      stage.status === 'completed' ? 'success' : 
                      'default'
                    }
                    variant={stage.status === 'upcoming' ? 'outlined' : 'filled'}
                  />
                </Box>
              </StepLabel>
              <StepContent>
                <Paper elevation={0} sx={{ p: 2, bgcolor: theme.palette.background.default, mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Key Focus:
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {stage.keyFocus}
                      </Typography>
                      
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Regulatory Approach:
                      </Typography>
                      <Typography variant="body2">
                        {stage.regulatoryApproach}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Implementation Details:
                      </Typography>
                      <List dense disablePadding>
                        {stage.details.map((detail, idx) => (
                          <ListItem key={idx} disablePadding sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 28 }}>
                              <CheckCircleIcon fontSize="small" color={stage.status === 'upcoming' ? 'disabled' : 'primary'} />
                            </ListItemIcon>
                            <ListItemText 
                              primary={detail} 
                              primaryTypographyProps={{ 
                                variant: 'body2',
                                color: stage.status === 'upcoming' ? 'text.secondary' : 'text.primary'
                              }} 
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  </Grid>
                </Paper>
              </StepContent>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ mt: 3, p: 2, bgcolor: theme.palette.primary.light, borderRadius: 1 }}>
          <Typography variant="subtitle2" color="primary.contrastText">
            Current Status:
          </Typography>
          <Typography variant="body2" color="primary.contrastText">
            FreelanceShield is currently in the Early Traction phase, establishing legal entities and refining our governance structure while preparing for multi-jurisdictional expansion.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RegulatoryRoadmap;
