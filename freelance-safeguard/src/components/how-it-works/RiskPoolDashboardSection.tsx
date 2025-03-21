import React from "react";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { 
  BarChart4, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RiskPoolDashboardSectionProps {
  className?: string;
}

export function RiskPoolDashboardSection({ className }: RiskPoolDashboardSectionProps) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  // Sample data for charts
  const riskData = [40, 35, 50, 45, 60, 55, 70, 65, 80];
  const reserveData = [60, 65, 70, 75, 80, 75, 85, 90, 95];

  return (
    <div 
      ref={ref}
      className={cn("w-full py-12 bg-muted/30", className)}
    >
      <div className="container mx-auto">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
          <h2 
            className={cn(
              "text-3xl md:text-4xl font-bold tracking-tight opacity-0 translate-y-4 transition-all duration-500",
              inView && "opacity-100 translate-y-0"
            )}
            style={{ transitionDelay: "100ms" }}
          >
            Risk Pool & Reserve <span className="text-blue-600 dark:text-blue-400">Metrics</span>
          </h2>
          <p 
            className={cn(
              "text-lg text-muted-foreground opacity-0 translate-y-4 transition-all duration-500",
              inView && "opacity-100 translate-y-0"
            )}
            style={{ transitionDelay: "200ms" }}
          >
            Monitor the health of our insurance pool with real-time metrics and visualizations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Premiums Card */}
          <Card 
            className={cn(
              "opacity-0 translate-y-4 transition-all duration-500",
              inView && "opacity-100 translate-y-0"
            )}
            style={{ transitionDelay: "300ms" }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Premiums
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">523,520 USDC</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500 inline-flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +12.5%
                </span>{" "}
                from last month
              </p>
            </CardContent>
          </Card>

          {/* Active Policies Card */}
          <Card 
            className={cn(
              "opacity-0 translate-y-4 transition-all duration-500",
              inView && "opacity-100 translate-y-0"
            )}
            style={{ transitionDelay: "400ms" }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Active Policies
              </CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,250</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500 inline-flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +8.3%
                </span>{" "}
                from last month
              </p>
            </CardContent>
          </Card>

          {/* Reserve Ratio Card */}
          <Card 
            className={cn(
              "opacity-0 translate-y-4 transition-all duration-500",
              inView && "opacity-100 translate-y-0"
            )}
            style={{ transitionDelay: "500ms" }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Reserve Ratio
              </CardTitle>
              <BarChart4 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32.5%</div>
              <div className="w-full h-2 bg-muted rounded-full mt-2">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Target: 50% buffer
              </p>
            </CardContent>
          </Card>

          {/* Claim-to-Premium Ratio Card */}
          <Card 
            className={cn(
              "opacity-0 translate-y-4 transition-all duration-500",
              inView && "opacity-100 translate-y-0"
            )}
            style={{ transitionDelay: "600ms" }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Claim-to-Premium Ratio
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18.2%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-500 inline-flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +2.1%
                </span>{" "}
                from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          {/* Risk Buffer Chart */}
          <Card 
            className={cn(
              "opacity-0 translate-y-4 transition-all duration-500",
              inView && "opacity-100 translate-y-0"
            )}
            style={{ transitionDelay: "700ms" }}
          >
            <CardHeader>
              <CardTitle>Risk Buffer Percentage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex items-end justify-between gap-2">
                {riskData.map((value, index) => (
                  <div key={index} className="relative h-full flex-1 flex flex-col justify-end">
                    <div 
                      className={`w-full rounded-t-sm ${
                        value < 50 ? "bg-red-500" : value < 70 ? "bg-yellow-500" : "bg-green-500"
                      }`} 
                      style={{ height: `${value}%` }}
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium">
                      {value}%
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-6 text-xs text-muted-foreground">
                <div>Jan</div>
                <div>Feb</div>
                <div>Mar</div>
                <div>Apr</div>
                <div>May</div>
                <div>Jun</div>
                <div>Jul</div>
                <div>Aug</div>
                <div>Sep</div>
              </div>
              <div className="flex justify-between items-center mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs">Risky (&lt;50%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-xs">Medium (50-70%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs">Safe (&gt;70%)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Premium vs Claims Chart */}
          <Card 
            className={cn(
              "opacity-0 translate-y-4 transition-all duration-500",
              inView && "opacity-100 translate-y-0"
            )}
            style={{ transitionDelay: "800ms" }}
          >
            <CardHeader>
              <CardTitle>Premium Inflow vs. Claim Outflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex items-end justify-between gap-2">
                {reserveData.map((value, index) => (
                  <div key={index} className="relative h-full flex-1 flex flex-col justify-end gap-1">
                    <div 
                      className="w-full rounded-t-sm bg-blue-500" 
                      style={{ height: `${value}%` }}
                    />
                    <div 
                      className="w-full rounded-t-sm bg-red-400" 
                      style={{ height: `${riskData[index]}%` }}
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium">
                      {value - riskData[index]}%
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-6 text-xs text-muted-foreground">
                <div>Jan</div>
                <div>Feb</div>
                <div>Mar</div>
                <div>Apr</div>
                <div>May</div>
                <div>Jun</div>
                <div>Jul</div>
                <div>Aug</div>
                <div>Sep</div>
              </div>
              <div className="flex justify-between items-center mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs">Premium Inflow</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <span className="text-xs">Claim Outflow</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs">Net Reserve</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default RiskPoolDashboardSection;
