import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, ArrowLeft } from "lucide-react";
import { ConfusionMatrix } from "@/components/ConfusionMatrix";

interface TestImage {
  file: File;
  preview: string;
  groundTruth: "healthy" | "diseased";
  prediction?: "healthy" | "diseased";
  confidence?: number;
}

export default function Evaluation() {
  const navigate = useNavigate();
  const [images, setImages] = useState<TestImage[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [results, setResults] = useState<{
    truePositive: number;
    trueNegative: number;
    falsePositive: number;
    falseNegative: number;
  } | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      groundTruth: "diseased" as const,
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const updateGroundTruth = (index: number, value: "healthy" | "diseased") => {
    setImages(prev => prev.map((img, i) => 
      i === index ? { ...img, groundTruth: value } : img
    ));
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const runEvaluation = async () => {
    if (images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setIsEvaluating(true);
    const predictions: TestImage[] = [];

    try {
      for (const img of images) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(img.file);
        });

        const base64Image = await base64Promise;

        const { data, error } = await supabase.functions.invoke("detect-disease", {
          body: { image: base64Image },
        });

        if (error) throw error;

        // Determine prediction based on disease name
        const isHealthy = data.disease?.toLowerCase().includes("healthy") || 
                         data.disease?.toLowerCase().includes("no disease");
        
        predictions.push({
          ...img,
          prediction: isHealthy ? "healthy" : "diseased",
          confidence: data.confidence || 0,
        });
      }

      setImages(predictions);

      // Calculate confusion matrix
      let tp = 0, tn = 0, fp = 0, fn = 0;

      predictions.forEach(img => {
        if (img.groundTruth === "diseased" && img.prediction === "diseased") tp++;
        else if (img.groundTruth === "healthy" && img.prediction === "healthy") tn++;
        else if (img.groundTruth === "healthy" && img.prediction === "diseased") fp++;
        else if (img.groundTruth === "diseased" && img.prediction === "healthy") fn++;
      });

      setResults({
        truePositive: tp,
        trueNegative: tn,
        falsePositive: fp,
        falseNegative: fn,
      });

      // Save results to database if user is logged in
      if (userId) {
        const accuracy = ((tp + tn) / images.length) * 100;
        const precision = tp > 0 ? (tp / (tp + fp)) * 100 : 0;
        const recall = tp > 0 ? (tp / (tp + fn)) * 100 : 0;
        const f1 = precision + recall > 0 ? (2 * (precision * recall) / (precision + recall)) : 0;

        const { error: insertError } = await supabase
          .from('evaluation_results')
          .insert({
            user_id: userId,
            true_positive: tp,
            true_negative: tn,
            false_positive: fp,
            false_negative: fn,
            total_images: images.length,
            accuracy: accuracy,
            precision_score: precision,
            recall_score: recall,
            f1_score: f1,
          });

        if (insertError) {
          console.error('Error saving results:', insertError);
          toast.error('Failed to save results to database');
        } else {
          toast.success('Evaluation complete! Results saved to database.');
        }
      } else {
        toast.success("Evaluation complete!");
      }
    } catch (error) {
      console.error("Evaluation error:", error);
      toast.error("Failed to evaluate images");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Model Evaluation</h1>
            <p className="text-muted-foreground">Upload images to generate confusion matrix</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Test Images</CardTitle>
            <CardDescription>
              Upload plant images and label them as healthy or diseased
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="images" className="cursor-pointer">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload images (multiple selection supported)
                  </p>
                </div>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </Label>
            </div>

            {images.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {images.length} image(s) uploaded
                  </p>
                  <Button onClick={runEvaluation} disabled={isEvaluating}>
                    {isEvaluating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Evaluating...
                      </>
                    ) : (
                      "Run Evaluation"
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((img, index) => (
                    <Card key={index}>
                      <CardContent className="p-4 space-y-3">
                        <img
                          src={img.preview}
                          alt={`Test ${index + 1}`}
                          className="w-full h-48 object-cover rounded-md"
                        />
                        <div className="space-y-2">
                          <Label>Ground Truth</Label>
                          <RadioGroup
                            value={img.groundTruth}
                            onValueChange={(value) => updateGroundTruth(index, value as "healthy" | "diseased")}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="healthy" id={`healthy-${index}`} />
                              <Label htmlFor={`healthy-${index}`}>Healthy</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="diseased" id={`diseased-${index}`} />
                              <Label htmlFor={`diseased-${index}`}>Diseased</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        {img.prediction && (
                          <div className="text-sm space-y-1">
                            <p className="font-semibold">
                              Prediction: <span className={img.prediction === img.groundTruth ? "text-green-500" : "text-red-500"}>
                                {img.prediction}
                              </span>
                            </p>
                            <p className="text-muted-foreground">
                              Confidence: {(img.confidence || 0).toFixed(2)}%
                            </p>
                          </div>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeImage(index)}
                          className="w-full"
                        >
                          Remove
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {results && (
          <ConfusionMatrix
            truePositive={results.truePositive}
            trueNegative={results.trueNegative}
            falsePositive={results.falsePositive}
            falseNegative={results.falseNegative}
          />
        )}
      </div>
    </div>
  );
}
