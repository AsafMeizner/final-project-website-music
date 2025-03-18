import React, { useState, useEffect } from "react";
import { IconType } from "react-icons";

interface MusicNoteProps {
  id: string;
  angle: number;
  color: string;
  type: IconType;
  onAnimationEnd: (id: string) => void;
}

const MusicNote: React.FC<MusicNoteProps> = ({ id, angle, color, type: Icon, onAnimationEnd }) => {
  const [style, setStyle] = useState<React.CSSProperties>({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    opacity: 1,
    transition: "transform 3s ease-out, opacity 3s ease-out",
    pointerEvents: "none",
    fontSize: "24px",
  });

  useEffect(() => {
    const distance = 150;
    const radians = (angle * Math.PI) / 180;
    const x = distance * Math.cos(radians);
    const y = distance * Math.sin(radians);
    const timer = setTimeout(() => {
      setStyle({
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
        opacity: 0,
        transition: "transform 3s ease-out, opacity 3s ease-out",
        pointerEvents: "none",
        fontSize: "24px",
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [angle]);

  return (
    <Icon
      style={style}
      className={color}
      onTransitionEnd={() => onAnimationEnd(id)}
      aria-hidden="true"
    />
  );
};

export default MusicNote;
