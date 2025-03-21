import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export function PaymentTracker() {
  const payments = [
    {
      client: "Acme Corp",
      amount: 1200,
      dueDate: new Date("2023-12-20"),
      status: "pending",
      daysLeft: 5
    },
    {
      client: "TechStart Inc",
      amount: 850,
      dueDate: new Date("2023-12-15"),
      status: "overdue",
      daysOverdue: 2
    },
    {
      client: "Design Masters",
      amount: 2400,
      dueDate: new Date("2023-12-10"),
      status: "paid",
      paidDate: new Date("2023-12-08")
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (payment: any) => {
    switch (payment.status) {
      case 'pending':
        return `Due in ${payment.daysLeft} days`;
      case 'paid':
        return `Paid on ${payment.paidDate.toLocaleDateString()}`;
      case 'overdue':
        return `${payment.daysOverdue} days overdue`;
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payment Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.map((payment, index) => (
            <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-medium">{payment.client}</p>
                  <p className="text-sm text-muted-foreground">${payment.amount}</p>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(payment.status)}
                  <span className={`text-xs ml-1 ${
                    payment.status === 'paid' ? 'text-green-500' : 
                    payment.status === 'overdue' ? 'text-red-500' : 
                    'text-yellow-500'
                  }`}>
                    {payment.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Due: {payment.dueDate.toLocaleDateString()}</span>
                <span>{getStatusText(payment)}</span>
              </div>
              {payment.status === 'pending' && (
                <div className="mt-2">
                  <Progress value={100 - (payment.daysLeft * 10)} className="h-1" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
