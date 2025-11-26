import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ConfusionMatrixProps {
  truePositive: number;
  trueNegative: number;
  falsePositive: number;
  falseNegative: number;
}

export function ConfusionMatrix({
  truePositive,
  trueNegative,
  falsePositive,
  falseNegative,
}: ConfusionMatrixProps) {
  const total = truePositive + trueNegative + falsePositive + falseNegative;
  const accuracy = total > 0 ? ((truePositive + trueNegative) / total * 100).toFixed(2) : "0.00";
  const precision = (truePositive + falsePositive) > 0 
    ? (truePositive / (truePositive + falsePositive) * 100).toFixed(2) 
    : "0.00";
  const recall = (truePositive + falseNegative) > 0 
    ? (truePositive / (truePositive + falseNegative) * 100).toFixed(2) 
    : "0.00";
  const f1Score = (parseFloat(precision) + parseFloat(recall)) > 0
    ? (2 * (parseFloat(precision) * parseFloat(recall)) / (parseFloat(precision) + parseFloat(recall))).toFixed(2)
    : "0.00";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluation Results</CardTitle>
        <CardDescription>Confusion matrix and performance metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Confusion Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-border p-4 bg-muted" rowSpan={2} colSpan={2}>
                  <div className="text-sm font-semibold">Confusion Matrix</div>
                </th>
                <th className="border border-border p-4 bg-muted text-center" colSpan={2}>
                  Predicted
                </th>
              </tr>
              <tr>
                <th className="border border-border p-4 bg-muted text-center font-semibold">
                  Diseased
                </th>
                <th className="border border-border p-4 bg-muted text-center font-semibold">
                  Healthy
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th className="border border-border p-4 bg-muted text-center" rowSpan={2}>
                  <div className="writing-mode-vertical">Actual</div>
                </th>
                <th className="border border-border p-4 bg-muted text-right font-semibold">
                  Diseased
                </th>
                <td className="border border-border p-6 text-center bg-green-50 dark:bg-green-950">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {truePositive}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">True Positive</div>
                </td>
                <td className="border border-border p-6 text-center bg-red-50 dark:bg-red-950">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {falseNegative}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">False Negative</div>
                </td>
              </tr>
              <tr>
                <th className="border border-border p-4 bg-muted text-right font-semibold">
                  Healthy
                </th>
                <td className="border border-border p-6 text-center bg-red-50 dark:bg-red-950">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {falsePositive}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">False Positive</div>
                </td>
                <td className="border border-border p-6 text-center bg-green-50 dark:bg-green-950">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {trueNegative}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">True Negative</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{accuracy}%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{precision}%</div>
              <div className="text-sm text-muted-foreground">Precision</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{recall}%</div>
              <div className="text-sm text-muted-foreground">Recall</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{f1Score}%</div>
              <div className="text-sm text-muted-foreground">F1 Score</div>
            </CardContent>
          </Card>
        </div>

        {/* Metrics Explanation */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>True Positive (TP):</strong> Correctly identified diseased plants</p>
          <p><strong>True Negative (TN):</strong> Correctly identified healthy plants</p>
          <p><strong>False Positive (FP):</strong> Healthy plants incorrectly identified as diseased</p>
          <p><strong>False Negative (FN):</strong> Diseased plants incorrectly identified as healthy</p>
        </div>
      </CardContent>
    </Card>
  );
}
