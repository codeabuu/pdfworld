import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowRight, Eye } from "lucide-react";
import { getHighQualityImage } from "@/lib/utils";
import { Magazine } from "@/types/types";

interface MagazinesSectionProps {
  magazines: Magazine[];
  loading: boolean;
  handleMagazineClick: (magazine: Magazine) => void;
  renderLoadingSkeleton: (count: number, type: 'book' | 'genre' | 'magazine') => JSX.Element;
}

export const MagazinesSection = ({ 
  magazines, 
  loading, 
  handleMagazineClick, 
  renderLoadingSkeleton 
}: MagazinesSectionProps) => {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-amber-600" />
          <h2 className="text-2xl font-semibold text-foreground">Latest Magazines</h2>
        </div>
        <Link to="/dashboard/magazines">
          <Button variant="outline" className="gap-1 text-sm" size="sm">
            View All
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      {loading ? (
        renderLoadingSkeleton(4, 'magazine')
      ) : (
        <>
          {/* Mobile view */}
          <div className="space-y-5 sm:hidden px-3">
            {magazines.map((magazine) => (
              <Card 
                key={magazine.id} 
                className="group cursor-pointer hover:shadow-md transition-shadow border border-gray-200 rounded-xl overflow-hidden"
              >
                <CardHeader className="p-0">
                  <div className="relative w-full h-56 overflow-hidden">
                    <img
                      src={getHighQualityImage(magazine.image) || "/placeholder-magazine.jpg"}
                      alt={magazine.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-md">
                      {magazine.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-amber-700 transition-colors">
                    {magazine.title}
                  </h3>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Issue: {magazine.issue}</p>
                    <p>{new Date(magazine.date).toLocaleDateString()}</p>
                  </div>
                </CardContent>
                <CardFooter className="p-3 pt-0">
                  <Button 
                    className="w-full gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs h-9 rounded-lg"
                    onClick={() => handleMagazineClick(magazine)}
                  >
                    <Eye className="h-4 w-4" />
                    Read Now
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Desktop view */}
          <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {magazines.map((magazine) => (
              <Card key={magazine.id} className="group cursor-pointer hover:shadow-md transition-shadow border border-gray-200">
                <CardHeader className="p-0">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
                    <img
                      src={getHighQualityImage(magazine.image) || "/placeholder-magazine.jpg"}
                      alt={magazine.title}
                      className="object-cover w-full h-full group-hover:scale-102 transition-transform duration-300"
                    />
                    <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-xs">
                      {magazine.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-amber-700 transition-colors text-sm">
                    {magazine.title}
                  </h3>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Issue: {magazine.issue}</p>
                    <p>Date: {new Date(magazine.date).toLocaleDateString()}</p>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button 
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-xs h-8"
                    onClick={() => handleMagazineClick(magazine)}
                  >
                    <Eye className="h-3 w-3" />
                    Read Now
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}
    </section>
  );
};