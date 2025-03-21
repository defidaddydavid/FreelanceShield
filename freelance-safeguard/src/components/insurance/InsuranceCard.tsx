import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, CoinsIcon } from "lucide-react";

export interface InsuranceCardProps {
  title: string;
  description: string;
  premium: string;
  coverage: string;
  status: "active" | "expired" | "pending";
  expiryDate: string;
}

const InsuranceCard = ({
  title,
  description,
  premium,
  coverage,
  status,
  expiryDate,
}: InsuranceCardProps) => {
  const statusColors = {
    active: "bg-green-500",
    expired: "bg-red-500",
    pending: "bg-yellow-500",
  };

  const formattedDate = new Date(expiryDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge
          variant="secondary"
          className={`${statusColors[status]} text-white capitalize`}
        >
          {status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <CoinsIcon className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Premium</p>
            <p className="font-medium">{premium} SOL</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Coverage</p>
            <p className="font-medium">{coverage} SOL</p>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Expires: {formattedDate}
      </div>
    </Card>
  );
};

export default InsuranceCard;
