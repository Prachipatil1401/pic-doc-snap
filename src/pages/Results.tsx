import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertCircle, CheckCircle, Leaf, Sprout } from "lucide-react";

interface DetectionResult {
  disease: string;
  confidence: number;
  severity: string;
  symptoms: string[];
  treatment: {
    organic: string[];
    chemical: string[];
  };
  prevention: string[];
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, image } = location.state || {};

  if (!result || !image) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">No results to display</p>
            <Button onClick={() => navigate("/")} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "text-destructive";
      case "medium":
        return "text-warning";
      case "low":
        return "text-success";
      default:
        return "text-muted-foreground";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
        return <AlertCircle className="h-5 w-5" />;
      case "low":
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Detection
        </Button>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Image Card */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" />
                Analyzed Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={image}
                alt="Analyzed plant"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </CardContent>
          </Card>

          {/* Results Card */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sprout className="h-5 w-5 text-primary" />
                    Detection Results
                  </span>
                  <Badge variant="secondary">{result.confidence}% confident</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-primary mb-2">{result.disease}</h3>
                  <div className={`flex items-center gap-2 ${getSeverityColor(result.severity)}`}>
                    {getSeverityIcon(result.severity)}
                    <span className="font-medium">Severity: {result.severity}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Symptoms</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.symptoms.map((symptom: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{symptom}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Treatment Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-success mb-2">Organic Solutions</h4>
                  <ul className="space-y-2">
                    {result.treatment.organic.map((treatment: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-success mt-1">✓</span>
                        <span>{treatment}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-2">Chemical Solutions</h4>
                  <ul className="space-y-2">
                    {result.treatment.chemical.map((treatment: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{treatment}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prevention Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.prevention.map((tip: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">→</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
