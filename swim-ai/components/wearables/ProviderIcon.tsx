import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { SvgUri } from "react-native-svg";

interface ProviderIconProps {
  iconUrl: string | null;
  size?: number;
}

export function ProviderIcon({ iconUrl, size = 24 }: ProviderIconProps) {
  const [failed, setFailed] = useState(false);

  if (iconUrl != null && !failed) {
    return (
      <SvgUri
        uri={iconUrl}
        width={size}
        height={size}
        onError={() => setFailed(true)}
      />
    );
  }

  return <Ionicons name="watch-outline" size={size} color="#1C1C1E" />;
}
