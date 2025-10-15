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
        <Link to="/magazines">
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
          {/* 📱 MOBILE VIEW - Rectangular cards exactly like the image */}
          <div className="space-y-4 sm:hidden">
            {magazines.map((magazine) => (
              <div
                key={magazine.id}
                className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleMagazineClick(magazine)}
              >
                {/* Magazine Cover - Square aspect ratio */}
                <div className="relative w-20 h-24 flex-shrink-0">
                  <img
                    src={getHighQualityImage(magazine.image) || "/placeholder-magazine.jpg"}
                    alt={magazine.title}
                    className="w-full h-full object-cover rounded-md"
                  />
                  {/* <Badge className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {magazine.category}
                  </Badge> */}
                </div>

                {/* Content - Takes remaining space */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Title with 2-line clamp */}
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-gray-900">
                    {magazine.title}
                  </h3>
                  
                  {/* Description/Subtitle */}
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {magazine.description || "Latest issue featuring exclusive content and insights"}
                  </p>
                  
                  {/* Author/Publisher */}
                  <p className="text-xs text-gray-500">
                    by {magazine.author || "Various Authors"}
                  </p>

                  {/* Read Button */}
                  <Button 
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 px-3 mt-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMagazineClick(magazine);
                    }}
                  >
                    Read Now
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* 💻 DESKTOP VIEW - Keep your existing grid layout */}
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
                    {/* <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-xs">
                      {magazine.category}
                    </Badge> */}
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