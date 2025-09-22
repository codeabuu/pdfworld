// components/DebugResetPage.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DebugResetPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [urlInfo, setUrlInfo] = useState<any>({});

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const search = window.location.search.substring(1);
    
    const info = {
      fullUrl: window.location.href,
      hash: window.location.hash,
      hashWithoutPrefix: hash,
      search: window.location.search,
      searchWithoutPrefix: search,
      hashParams: Object.fromEntries(new URLSearchParams(hash)),
      searchParams: Object.fromEntries(new URLSearchParams(search)),
    };
    
    setUrlInfo(info);
    console.log("DEBUG - URL Information:", info);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>URL Debug Information</CardTitle>
          <CardDescription>
            This page shows what parameters are received from Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Full URL:</h3>
            <code className="bg-muted p-2 rounded text-sm block overflow-x-auto">
              {urlInfo.fullUrl}
            </code>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Hash Parameters:</h3>
            <pre className="bg-muted p-2 rounded text-sm overflow-x-auto">
              {JSON.stringify(urlInfo.hashParams, null, 2)}
            </pre>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Search Parameters:</h3>
            <pre className="bg-muted p-2 rounded text-sm overflow-x-auto">
              {JSON.stringify(urlInfo.searchParams, null, 2)}
            </pre>
          </div>
          
          <Button onClick={() => navigate('/login')} className="w-full">
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugResetPage;