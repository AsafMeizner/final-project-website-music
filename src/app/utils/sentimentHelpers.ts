export const shuffleArray = <T,>(array: T[]): T[] => {
    return array.sort(() => Math.random() - 0.5);
  };
  
  export const getRGB = (sentiment: "valence" | "arousal" | "dominance"): string => {
    switch (sentiment) {
      case "valence":
        return "136, 132, 216";
      case "arousal":
        return "130, 202, 157";
      case "dominance":
        return "255, 198, 88";
      default:
        return "0,0,0";
    }
  };
  
  export const getStrokeColor = (sentiment: "valence" | "arousal" | "dominance"): string => {
    switch (sentiment) {
      case "valence":
        return "#8884d8";
      case "arousal":
        return "#82ca9d";
      case "dominance":
        return "#ffc658";
      default:
        return "#000000";
    }
  };
  
  export const generateSmoothPath = (points: { x: number; y: number }[]): string => {
    if (points.length < 2) return "";
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length; i++) {
      const p0 = points[i === 0 ? points.length - 1 : i - 1];
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const p3 = points[(i + 2) % points.length];
      const cp1x = p1.x + (p2.x - p0.x) * 0.2;
      const cp1y = p1.y + (p2.y - p0.y) * 0.2;
      const cp2x = p2.x - (p3.x - p1.x) * 0.2;
      const cp2y = p2.y - (p3.y - p1.y) * 0.2;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    path += " Z";
    return path;
  };
  