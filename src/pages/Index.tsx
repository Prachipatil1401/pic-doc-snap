import { useState, useRef } from "react";
import { Camera, Upload, Leaf, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-image.jpg";
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';

interface DetectionResult {
  disease: string;
  confidence: string;
  severity: string;
  symptoms: string[];
  treatment: {
    organic: string[];
    chemical: string[];
  };
  prevention: string[];
}

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const takePhoto = async () => {
    try {
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (image.dataUrl) {
        setSelectedImage(image.dataUrl);
        setResult(null);
        toast.success('Photo captured successfully!');
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Failed to access camera. Please try uploading an image instead.');
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('detect-disease', {
        body: { image: selectedImage }
      });

      if (error) {
        console.error('Detection error:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to analyze image. Please try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'severe':
        return 'text-destructive';
      case 'moderate':
        return 'text-warning';
      case 'mild':
        return 'text-success';
      default:
        return 'text-success';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <img 
          src={heroImage} 
          alt="Plant health monitoring"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
        />
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Detection</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              PlantGuard
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Detect plant diseases instantly with advanced AI. Upload or capture leaf images for accurate diagnosis and expert treatment recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Image Upload/Capture */}
          {!selectedImage && (
            <Card className="p-8 md:p-12 bg-gradient-card border-border/50 shadow-medium">
              <div className="text-center space-y-6">
                <Leaf className="w-16 h-16 mx-auto text-primary" />
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-3">
                    Start Your Analysis
                  </h2>
                  <p className="text-muted-foreground">
                    Capture or upload a clear image of the plant leaf
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 max-w-md mx-auto pt-4">
                  <Button
                    size="lg"
                    onClick={takePhoto}
                    className="h-auto py-6 flex-col gap-3"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="font-semibold">Take Photo</span>
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-auto py-6 flex-col gap-3"
                  >
                    <Upload className="w-6 h-6" />
                    <span className="font-semibold">Upload Image</span>
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </Card>
          )}

          {/* Image Preview & Analysis */}
          {selectedImage && (
            <div className="space-y-6">
              <Card className="overflow-hidden bg-gradient-card border-border/50 shadow-medium">
                <div className="aspect-video relative bg-muted">
                  <img
                    src={selectedImage}
                    alt="Selected plant"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-6 space-y-4">
                  {!result && (
                    <div className="flex gap-3">
                      <Button
                        onClick={analyzeImage}
                        disabled={isAnalyzing}
                        className="flex-1"
                        size="lg"
                      >
                        {isAnalyzing ? (
                          <>
                            <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Analyze Image
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={reset}
                        variant="outline"
                        size="lg"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              {/* Results */}
              {result && (
                <Card className="p-6 md:p-8 bg-gradient-card border-border/50 shadow-medium">
                  <div className="space-y-6">
                    {/* Disease Info */}
                    <div>
                      <div className="flex items-start gap-4 mb-4">
                        {result.disease.toLowerCase() === 'healthy' ? (
                          <div className="p-3 bg-success/10 rounded-full">
                            <CheckCircle2 className="w-8 h-8 text-success" />
                          </div>
                        ) : (
                          <div className="p-3 bg-warning/10 rounded-full">
                            <AlertCircle className="w-8 h-8 text-warning" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold mb-2">
                            {result.disease}
                          </h3>
                          <div className="flex flex-wrap gap-3 text-sm">
                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                              {result.confidence} confidence
                            </span>
                            {result.severity !== 'none' && (
                              <span className={`px-3 py-1 rounded-full font-medium ${
                                result.severity === 'severe' 
                                  ? 'bg-destructive/10 text-destructive'
                                  : result.severity === 'moderate'
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-success/10 text-success'
                              }`}>
                                {result.severity} severity
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Symptoms */}
                    {result.symptoms.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-accent" />
                          Symptoms Observed
                        </h4>
                        <ul className="space-y-2">
                          {result.symptoms.map((symptom, index) => (
                            <li key={index} className="flex items-start gap-2 text-muted-foreground">
                              <span className="text-primary mt-1">•</span>
                              <span>{symptom}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Treatment */}
                    {(result.treatment.organic.length > 0 || result.treatment.chemical.length > 0) && (
                      <div className="grid md:grid-cols-2 gap-6">
                        {result.treatment.organic.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-success">
                              🌿 Organic Treatment
                            </h4>
                            <ul className="space-y-2">
                              {result.treatment.organic.map((treatment, index) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                                  <span>{treatment}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {result.treatment.chemical.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-primary">
                              🧪 Chemical Treatment
                            </h4>
                            <ul className="space-y-2">
                              {result.treatment.chemical.map((treatment, index) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                  <span>{treatment}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Prevention */}
                    {result.prevention.length > 0 && (
                      <div className="pt-4 border-t border-border">
                        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <Leaf className="w-5 h-5 text-success" />
                          Prevention Tips
                        </h4>
                        <ul className="space-y-2">
                          {result.prevention.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2 text-muted-foreground">
                              <span className="text-success mt-1">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button
                      onClick={reset}
                      variant="outline"
                      size="lg"
                      className="w-full"
                    >
                      Analyze Another Image
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Index;
