import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, Leaf, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

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
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [username, setUsername] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchUsername(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchUsername(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUsername = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", userId)
      .single();

    if (data && !error) {
      setUsername(data.username);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

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
    };
    reader.readAsDataURL(file);
  };

  const takePhoto = async () => {
    try {
      setIsAnalyzing(true);
      
      // Get the Pi camera server URL from environment
      const cameraServerUrl = import.meta.env.VITE_CAMERA_SERVER_URL;
      
      if (!cameraServerUrl) {
        toast.error('Camera server not configured. Please set VITE_CAMERA_SERVER_URL in .env.local');
        return;
      }
      
      toast.info('Connecting to Raspberry Pi camera...');
      
      // First, check if the camera server is reachable
      try {
        const healthCheck = await fetch(`${cameraServerUrl}/api/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        
        if (!healthCheck.ok) {
          throw new Error('Camera server is not responding');
        }
      } catch (healthError) {
        console.error('Health check failed:', healthError);
        toast.error(`Cannot reach camera server at ${cameraServerUrl}. Make sure:\n1. Camera server is running\n2. You're on the same WiFi network\n3. URL is correct in .env.local`);
        return;
      }
      
      toast.info('Capturing photo...');
      
      const response = await fetch(`${cameraServerUrl}/api/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout for capture
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to capture photo from Pi camera');
      }

      const data = await response.json();
      
      if (data.success && data.image) {
        setSelectedImage(data.image);
        toast.success('Photo captured successfully!');
      } else {
        throw new Error(data.message || 'Failed to capture photo');
      }
    } catch (error) {
      console.error('Camera error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          toast.error('Camera timeout. The camera may be busy or not responding.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Failed to access Pi camera. Check console for details.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    setIsAnalyzing(true);

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

      toast.success('Analysis complete!');
      navigate("/results", { state: { result: data, image: selectedImage } });
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">PlantGuard</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{username}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Detect Plant Diseases Instantly
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload an image from your gallery or capture live from your camera/drone feed
          </p>
        </div>

        {/* Detection Mode Selection */}
        {!selectedImage ? (
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Gallery Upload Mode */}
              <Card className="backdrop-blur-sm bg-card/50 border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="p-8 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Upload from Gallery</h3>
                    <p className="text-muted-foreground text-sm">
                      Select a stored image from your device to analyze
                    </p>
                  </div>
                  <Button size="lg" className="w-full">
                    Choose Image
                  </Button>
                </div>
              </Card>

              {/* Live Camera Mode */}
              <Card className="backdrop-blur-sm bg-card/50 border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={takePhoto}>
                <div className="p-8 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Live Camera/Drone Feed</h3>
                    <p className="text-muted-foreground text-sm">
                      Capture a photo directly from your camera or drone
                    </p>
                  </div>
                  <Button size="lg" variant="outline" className="w-full">
                    Capture Photo
                  </Button>
                </div>
              </Card>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
        ) : (

          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden backdrop-blur-sm bg-card/50 border-2">
              <div className="p-8">
                <div className="space-y-6">
                  <div className="aspect-video relative rounded-lg overflow-hidden bg-muted">
                    <img
                      src={selectedImage}
                      alt="Selected plant"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <Button
                      onClick={analyzeImage}
                      disabled={isAnalyzing}
                      size="lg"
                      className="flex-1 h-14 text-lg"
                    >
                      {isAnalyzing ? (
                        <>
                          <Leaf className="mr-2 h-5 w-5 animate-pulse" />
                          Analyzing...
                        </>
                      ) : (
                        "Analyze Plant"
                      )}
                    </Button>
                    <Button
                      onClick={reset}
                      variant="outline"
                      size="lg"
                      disabled={isAnalyzing}
                      className="h-14"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
};

export default Index;
