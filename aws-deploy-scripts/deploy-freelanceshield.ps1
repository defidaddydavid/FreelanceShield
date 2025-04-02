# PowerShell script to deploy FreelanceShield to AWS
# Ensures consistent deployment to AWS EC2 and related services

# Configuration
$AWS_REGION = "us-east-1" # Change to your preferred region
$EC2_INSTANCE_NAME = "FreelanceShield-Dev"
$EC2_KEY_NAME = "freelanceshield-key" # Name for your EC2 key pair
$S3_BUCKET_NAME = "freelanceshield-artifacts"
$CODECOMMIT_REPO_NAME = "freelanceshield-repo"
$PROJECT_DIR = "C:\Projects\FreelanceShield"

# Check for AWS CLI installation
function Check-AWSCLI {
    try {
        $awsVersion = aws --version
        Write-Host "AWS CLI is installed: $awsVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "AWS CLI is not installed. Please install it from: https://aws.amazon.com/cli/" -ForegroundColor Red
        exit 1
    }
}

# Configure AWS CLI if not already configured
function Configure-AWS {
    try {
        $awsConfig = aws configure list
        if ($awsConfig -match "access_key") {
            Write-Host "AWS CLI is already configured." -ForegroundColor Green
        }
    }
    catch {
        Write-Host "Configuring AWS CLI..." -ForegroundColor Yellow
        aws configure
    }
}

# Create CodeCommit repository
function Create-CodeCommitRepo {
    try {
        $repoExists = aws codecommit get-repository --repository-name $CODECOMMIT_REPO_NAME 2>$null
        Write-Host "Repository $CODECOMMIT_REPO_NAME already exists." -ForegroundColor Green
    }
    catch {
        Write-Host "Creating CodeCommit repository: $CODECOMMIT_REPO_NAME" -ForegroundColor Yellow
        aws codecommit create-repository --repository-name $CODECOMMIT_REPO_NAME --repository-description "FreelanceShield Solana contracts and frontend"
        
        # Get HTTPS Git credentials
        Write-Host "You need Git credentials for CodeCommit. Please go to:" -ForegroundColor Yellow
        Write-Host "AWS Console -> IAM -> Users -> YourUser -> Security credentials -> HTTPS Git credentials for AWS CodeCommit -> Generate" -ForegroundColor Cyan
        Write-Host "Press any key after you've generated and saved these credentials..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
}

# Create S3 bucket for artifacts
function Create-S3Bucket {
    try {
        $bucketExists = aws s3api head-bucket --bucket $S3_BUCKET_NAME 2>$null
        Write-Host "S3 bucket $S3_BUCKET_NAME already exists." -ForegroundColor Green
    }
    catch {
        Write-Host "Creating S3 bucket: $S3_BUCKET_NAME" -ForegroundColor Yellow
        aws s3api create-bucket --bucket $S3_BUCKET_NAME --region $AWS_REGION
        
        # Block public access
        aws s3api put-public-access-block --bucket $S3_BUCKET_NAME --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
    }
}

# Create EC2 key pair if it doesn't exist
function Create-EC2KeyPair {
    try {
        $keyExists = aws ec2 describe-key-pairs --key-names $EC2_KEY_NAME 2>$null
        Write-Host "EC2 key pair $EC2_KEY_NAME already exists." -ForegroundColor Green
    }
    catch {
        Write-Host "Creating EC2 key pair: $EC2_KEY_NAME" -ForegroundColor Yellow
        $keyPair = aws ec2 create-key-pair --key-name $EC2_KEY_NAME --query "KeyMaterial" --output text
        
        # Save key to file
        $keyPath = "$env:USERPROFILE\.ssh\$EC2_KEY_NAME.pem"
        $keyPair | Out-File -Encoding ascii -FilePath $keyPath
        
        # Set appropriate permissions
        if (Test-Path $keyPath) {
            icacls $keyPath /inheritance:r
            icacls $keyPath /grant:r "$($env:USERNAME):(R)"
            Write-Host "Key pair saved to: $keyPath" -ForegroundColor Green
        }
    }
}

# Launch EC2 instance with user data script
function Launch-EC2Instance {
    # Check if instance already exists
    $instanceId = aws ec2 describe-instances --filters "Name=tag:Name,Values=$EC2_INSTANCE_NAME" "Name=instance-state-name,Values=running,stopped,pending" --query "Reservations[*].Instances[*].InstanceId" --output text
    
    if ($instanceId) {
        Write-Host "EC2 instance $EC2_INSTANCE_NAME already exists with ID: $instanceId" -ForegroundColor Green
        return $instanceId
    }
    
    # Create security group
    $sgName = "FreelanceShield-SG"
    try {
        $sgId = aws ec2 describe-security-groups --group-names $sgName --query "SecurityGroups[0].GroupId" --output text 2>$null
        Write-Host "Security group $sgName already exists with ID: $sgId" -ForegroundColor Green
    }
    catch {
        Write-Host "Creating security group: $sgName" -ForegroundColor Yellow
        $sgId = aws ec2 create-security-group --group-name $sgName --description "Security group for FreelanceShield" --query "GroupId" --output text
        
        # Add rules for SSH, HTTP, HTTPS, and Solana RPC
        $sgCmd1 = "aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 22 --cidr 0.0.0.0/0"
        $sgCmd2 = "aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 80 --cidr 0.0.0.0/0"
        $sgCmd3 = "aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 443 --cidr 0.0.0.0/0"
        $sgCmd4 = "aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 8899 --cidr 0.0.0.0/0"
        Invoke-Expression $sgCmd1
        Invoke-Expression $sgCmd2
        Invoke-Expression $sgCmd3
        Invoke-Expression $sgCmd4
    }
    
    # Prepare user data script (base64 encoded)
    $userDataScript = @"
#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
echo "Starting FreelanceShield setup..."
apt-get update && apt-get upgrade -y
apt-get install -y git build-essential pkg-config libudev-dev libssl-dev clang cmake jq unzip curl ntp python3-pip nodejs npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source ~/.cargo/env
mkdir -p /var/www/freelanceshield
"@
    $userDataBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($userDataScript))
    
    # Launch instance
    Write-Host "Launching EC2 instance: $EC2_INSTANCE_NAME" -ForegroundColor Yellow
    $launchCmd = "aws ec2 run-instances " + 
                 "--image-id ami-0c7217cdde317cfec " +  # Ubuntu 22.04 LTS - Change if needed for your region
                 "--instance-type t2.micro " +
                 "--key-name $EC2_KEY_NAME " +
                 "--security-group-ids $sgId " +
                 "--user-data $userDataBase64 " +
                 "--tag-specifications ""ResourceType=instance,Tags=[{Key=Name,Value=$EC2_INSTANCE_NAME}]"" " +
                 "--query ""Instances[0].InstanceId"" " +
                 "--output text"
    
    $instanceId = Invoke-Expression $launchCmd
    
    # Wait for instance to be running
    Write-Host "Waiting for instance to initialize (this may take a few minutes)..." -ForegroundColor Yellow
    $waitCmd = "aws ec2 wait instance-running --instance-ids $instanceId"
    Invoke-Expression $waitCmd
    
    # Get public DNS name
    $publicDnsCmd = "aws ec2 describe-instances --instance-ids $instanceId --query ""Reservations[0].Instances[0].PublicDnsName"" --output text"
    $publicDns = Invoke-Expression $publicDnsCmd
    Write-Host "Instance launched with ID: $instanceId" -ForegroundColor Green
    Write-Host "Public DNS: $publicDns" -ForegroundColor Green
    
    return $instanceId
}

# Create deployment package for the server
function Create-DeploymentPackage {
    $deploymentZip = "$PROJECT_DIR\freelanceshield-deploy.zip"
    
    Write-Host "Creating deployment package..." -ForegroundColor Yellow
    
    # Create temp directory
    $tempDir = "$PROJECT_DIR\deploy-temp"
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force
    }
    New-Item -Path $tempDir -ItemType Directory | Out-Null
    
    # Copy files to temp directory
    Copy-Item -Path "$PROJECT_DIR\freelance-safeguard-contracts" -Destination "$tempDir\" -Recurse
    Copy-Item -Path "$PROJECT_DIR\aws-deploy-scripts\ec2-solana-setup.sh" -Destination "$tempDir\"
    
    # Create README
    @"
# FreelanceShield Deployment Package

This package contains the FreelanceShield Solana smart contracts and deployment scripts.

## Setup Instructions
1. Run 'ec2-solana-setup.sh' to set up the Solana development environment
2. Navigate to 'freelance-safeguard-contracts' directory
3. Run 'anchor build' to build the contracts
4. Run 'anchor deploy' to deploy to devnet

For more detailed instructions, refer to the AWS deployment guide.
"@ | Out-File -FilePath "$tempDir\README.md" -Encoding utf8
    
    # Create the zip file
    Compress-Archive -Path "$tempDir\*" -DestinationPath $deploymentZip -Force
    
    # Clean up
    Remove-Item -Path $tempDir -Recurse -Force
    
    Write-Host "Deployment package created at: $deploymentZip" -ForegroundColor Green
    return $deploymentZip
}

# Upload deployment package to S3
function Upload-DeploymentPackage {
    param (
        [string]$packagePath
    )
    
    Write-Host "Uploading deployment package to S3..." -ForegroundColor Yellow
    $uploadCmd = "aws s3 cp $packagePath ""s3://$S3_BUCKET_NAME/deployments/"""
    Invoke-Expression $uploadCmd
    
    $s3Url = "s3://$S3_BUCKET_NAME/deployments/$(Split-Path $packagePath -Leaf)"
    Write-Host "Package uploaded to: $s3Url" -ForegroundColor Green
    return $s3Url
}

# Deploy code to EC2 instance
function Deploy-ToEC2 {
    param (
        [string]$instanceId,
        [string]$s3Url
    )
    
    $s3Key = $s3Url.Replace("s3://$S3_BUCKET_NAME/", "")
    $publicDnsCmd = "aws ec2 describe-instances --instance-ids $instanceId --query ""Reservations[0].Instances[0].PublicDnsName"" --output text"
    $publicDns = Invoke-Expression $publicDnsCmd
    
    Write-Host "Deploying code to EC2 instance..." -ForegroundColor Yellow
    
    # Create a helper script to download from S3 and set up the environment
    $deployScript = @"
#!/bin/bash
# Install AWS CLI if not already installed
if ! command -v aws &> /dev/null; then
    echo "Installing AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
fi

# Download deployment package from S3
echo "Downloading deployment package..."
aws s3 cp s3://$S3_BUCKET_NAME/$s3Key ~/freelanceshield-deploy.zip

# Unzip the package
echo "Extracting deployment package..."
mkdir -p ~/freelanceshield
unzip -o ~/freelanceshield-deploy.zip -d ~/freelanceshield

# Run setup script
echo "Running setup script..."
cd ~/freelanceshield
chmod +x ec2-solana-setup.sh
./ec2-solana-setup.sh

echo "Deployment complete!"
"@
    
    $deployScriptPath = "$PROJECT_DIR\aws-deploy-scripts\ec2-deploy-helper.sh"
    $deployScript | Out-File -FilePath $deployScriptPath -Encoding ascii
    
    # Connect via SSH and perform installation
    Write-Host "Please use the following commands to deploy to your EC2 instance:" -ForegroundColor Cyan
    Write-Host "--------------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "1. Connect to your EC2 instance:" -ForegroundColor Yellow
    Write-Host "   ssh -i ~/.ssh/$EC2_KEY_NAME.pem ubuntu@$publicDns" -ForegroundColor White
    Write-Host "2. Create and run the deployment script:" -ForegroundColor Yellow
    Write-Host "   1. Create a file named deploy.sh" -ForegroundColor White
    Write-Host "   2. Copy the contents from: $deployScriptPath" -ForegroundColor White
    Write-Host "   3. Run: chmod +x deploy.sh && ./deploy.sh" -ForegroundColor White
    Write-Host "--------------------------------------------------------------------" -ForegroundColor Cyan
    
    Write-Host "Note: You'll need to set up AWS credentials on the EC2 instance or use an IAM role" -ForegroundColor Yellow
}

# Set up a CloudWatch alarm to monitor EC2 usage
function Setup-UsageAlarm {
    param (
        [string]$instanceId
    )
    
    Write-Host "Setting up CloudWatch alarm to monitor EC2 usage..." -ForegroundColor Yellow
    
    # Create an alarm for 80% CPU utilization
    $alarmCmd = "aws cloudwatch put-metric-alarm " +
                "--alarm-name ""FreelanceShield-HighCPU"" " +
                "--alarm-description ""Alarm when CPU exceeds 80% utilization"" " +
                "--metric-name CPUUtilization " +
                "--namespace AWS/EC2 " +
                "--statistic Average " +
                "--period 300 " +
                "--threshold 80 " +
                "--comparison-operator GreaterThanThreshold " +
                "--dimensions ""Name=InstanceId,Value=$instanceId"" " +
                "--evaluation-periods 2 " +
                "--alarm-actions ""arn:aws:automate:$AWS_REGION:ec2:stop"""
    
    Invoke-Expression $alarmCmd
    
    Write-Host "CloudWatch alarm created successfully" -ForegroundColor Green
}

# Main function
function Main {
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host "  FreelanceShield AWS Deployment Tool" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
    
    # Check and configure prerequisites
    Check-AWSCLI
    Configure-AWS
    
    # Create AWS resources
    Create-CodeCommitRepo
    Create-S3Bucket
    Create-EC2KeyPair
    $instanceId = Launch-EC2Instance
    
    # Create and upload deployment package
    $packagePath = Create-DeploymentPackage
    $s3Url = Upload-DeploymentPackage -packagePath $packagePath
    
    # Deploy to EC2
    Deploy-ToEC2 -instanceId $instanceId -s3Url $s3Url
    
    # Setup usage monitoring
    Setup-UsageAlarm -instanceId $instanceId
    
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host "  Deployment process completed!" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
}

# Run the main function
Main
