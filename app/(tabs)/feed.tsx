import { useState } from "react";
import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { usePostStore } from "@/store/usePostStore";
import { PostCard } from "@/components/PostCard";
import { NewPostModal } from "@/components/NewPostModal";
import { CommentModal } from "@/components/CommentModal";
import { FullScreenImageViewer } from "@/components/FullScreenImageViewer";

export default function FeedScreen() {
  const posts = usePostStore((s) => s.posts);
  const addPost = usePostStore((s) => s.addPost);
  const likePost = usePostStore((s) => s.likePost);
  const deletePost = usePostStore((s) => s.deletePost);
  const addComment = usePostStore((s) => s.addComment);

  const [isComposerVisible, setIsComposerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  const activeCommentPost = posts.find((p) => p.id === activeCommentPostId);

  const openViewer = (images: string[], index: number) => {
    setViewerImages(images);
    setViewerIndex(index);
    setIsViewerVisible(true);
  };

  const handleLongPressPost = (postId: string) => {
    Alert.alert("Delete this post?", undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deletePost(postId) },
    ]);
  };

  return (
    <View className="flex-1 bg-gray-900">
      <FlatList
        data={posts}
        keyExtractor={(post) => post.id}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPressPhoto={(index) => openViewer(item.images, index)}
            onToggleLike={() => likePost(item.id)}
            onPressComment={() => setActiveCommentPostId(item.id)}
            onLongPress={() => handleLongPressPost(item.id)}
          />
        )}
        ListEmptyComponent={
          <View className="items-center mt-20 px-8">
            <Ionicons name="people-outline" size={40} color="#4b5563" />
            <Text className="text-gray-400 text-center mt-3">
              No posts yet. Share something with the community!
            </Text>
          </View>
        }
      />

      <Pressable
        onPress={() => setIsComposerVisible(true)}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </Pressable>

      <NewPostModal
        visible={isComposerVisible}
        onClose={() => setIsComposerVisible(false)}
        onPost={(text, images) => addPost(text, images)}
      />

      <FullScreenImageViewer
        visible={isViewerVisible}
        images={viewerImages}
        initialIndex={viewerIndex}
        onClose={() => setIsViewerVisible(false)}
      />

      <CommentModal
        visible={activeCommentPostId !== null}
        comments={activeCommentPost?.comments ?? []}
        onClose={() => setActiveCommentPostId(null)}
        onSendComment={(text) => {
          if (activeCommentPostId) addComment(activeCommentPostId, text);
        }}
      />
    </View>
  );
}
