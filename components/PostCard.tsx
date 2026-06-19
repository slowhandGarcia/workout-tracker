import { View, Text, Pressable, FlatList } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import type { Post } from "@/types";

interface PostCardProps {
  post: Post;
  onPressPhoto: (index: number) => void;
  onToggleLike: () => void;
  onPressComment: () => void;
  onLongPress: () => void;
}

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function PostCard({
  post,
  onPressPhoto,
  onToggleLike,
  onPressComment,
  onLongPress,
}: PostCardProps) {
  return (
    <Pressable
      onLongPress={onLongPress}
      className="bg-gray-800 rounded-2xl p-4 mb-4 mx-4"
    >
      <View className="flex-row items-center mb-3">
        <View className="w-9 h-9 rounded-full bg-blue-600 items-center justify-center mr-3">
          <Text className="text-white font-bold">{post.username.charAt(0)}</Text>
        </View>
        <View>
          <Text className="text-white font-semibold">{post.username}</Text>
          <Text className="text-gray-400 text-xs">{formatRelativeTime(post.createdAt)}</Text>
        </View>
      </View>

      {post.text.length > 0 && (
        <Text className="text-gray-100 mb-3 leading-relaxed">{post.text}</Text>
      )}

      {post.images.length > 0 && (
        <FlatList
          data={post.images}
          keyExtractor={(uri, index) => `${uri}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          className="mb-3"
          renderItem={({ item: uri, index }) => (
            <Pressable onPress={() => onPressPhoto(index)}>
              <Image
                source={{ uri }}
                style={{ width: 140, height: 140, borderRadius: 12 }}
                contentFit="cover"
              />
            </Pressable>
          )}
        />
      )}

      <View className="flex-row items-center gap-5 pt-1">
        <Pressable onPress={onToggleLike} className="flex-row items-center gap-1.5">
          <Ionicons
            name={post.likedByMe ? "heart" : "heart-outline"}
            size={20}
            color={post.likedByMe ? "#ef4444" : "#9ca3af"}
          />
          <Text className="text-gray-400 text-sm">{post.likeCount}</Text>
        </Pressable>
        <Pressable onPress={onPressComment} className="flex-row items-center gap-1.5">
          <Ionicons name="chatbubble-outline" size={18} color="#9ca3af" />
          <Text className="text-gray-400 text-sm">{post.comments.length}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
