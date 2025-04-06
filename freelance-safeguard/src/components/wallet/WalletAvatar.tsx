import React from "react";
import { Avatar as AvatarComponent, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWallet } from "@solana/wallet-adapter-react";
import { createAvatar } from "@dicebear/core";
import { identicon } from "@dicebear/collection";

interface AvatarProps {
  publicKey?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Avatar component that displays a user's avatar based on their public key
 * Uses DiceBear identicon as a fallback if no image is provided
 */
const WalletAvatar: React.FC<AvatarProps> = ({ 
  publicKey, 
  size = "md", 
  className = "" 
}) => {
  const { publicKey: connectedPublicKey } = useWallet();
  const walletPublicKey = publicKey || connectedPublicKey?.toBase58();
  
  // Size mapping
  const sizeClass = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  // Generate identicon avatar based on public key
  const generateAvatar = (seed: string) => {
    const avatar = createAvatar(identicon, {
      seed,
      backgroundColor: ["#5e35b1", "#2979ff"],
    });
    
    return avatar.toDataUriSync();
  };

  // Get initials from public key
  const getInitials = (key: string) => {
    return key ? `${key.slice(0, 2)}` : "??";
  };

  return (
    <AvatarComponent className={`${sizeClass[size]} ${className}`}>
      {walletPublicKey && (
        <AvatarImage 
          src={generateAvatar(walletPublicKey)} 
          alt="Wallet Avatar" 
        />
      )}
      <AvatarFallback className="bg-shield-purple text-white">
        {walletPublicKey ? getInitials(walletPublicKey) : "??"}
      </AvatarFallback>
    </AvatarComponent>
  );
};

export default WalletAvatar;
