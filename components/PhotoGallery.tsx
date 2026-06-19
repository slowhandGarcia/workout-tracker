import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

interface PhotoGalleryProps {
  images: string[];
  onPressPhoto: (index: number) => void;
  onLongPressPhoto: (index: number) => void;
  onAddPhoto: () => void;
}

export function PhotoGallery({
  images,
  onPressPhoto,
  onLongPressPhoto,
  onAddPhoto,
}: PhotoGalleryProps) {
  return (
    <View>
      <Text className="text-sm font-semibold text-gray-500 mb-2">Photos</Text>
      <FlatList
        data={images}
        keyExtractor={(uri, index) => `${uri}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item: uri, index }) => (
          <TouchableOpacity
            onPress={() => onPressPhoto(index)}
            onLongPress={() => onLongPressPhoto(index)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
              contentFit="cover"
            />
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <TouchableOpacity
            onPress={onAddPhoto}
            className="w-20 h-20 rounded-xl border border-dashed border-gray-300 bg-gray-50 items-center justify-center"
          >
            <Ionicons name="camera" size={22} color="#2563eb" />
            <Text className="text-blue-600 text-xs mt-1">Add</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}
