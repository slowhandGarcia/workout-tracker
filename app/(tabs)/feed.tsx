import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { usePostStore } from "@/store/usePostStore";
import { useThemeColors } from "@/store/useThemeStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { PostCard } from "@/components/PostCard";
import { NewPostModal } from "@/components/NewPostModal";
import { CommentModal } from "@/components/CommentModal";
import { FullScreenImageViewer } from "@/components/FullScreenImageViewer";

export default function FeedScreen() {
  const posts = usePostStore((s) => s.posts);
  const isLoading = usePostStore((s) => s.isLoading);
  const fetchPosts = usePostStore((s) => s.fetchPosts);
  const createPost = usePostStore((s) => s.createPost);
  const toggleLike = usePostStore((s) => s.toggleLike);
  const deletePost = usePostStore((s) => s.deletePost);
  const addComment = usePostStore((s) => s.addComment);
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const { isLoggedIn, requireAuth } = useRequireAuth();

  const [isComposerVisible, setIsComposerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPosts();
    setIsRefreshing(false);
  };

  const activeCommentPost = posts.find((p) => p.id === activeCommentPostId);
  const authorUsername = user?.username ?? "You";

  const openViewer = (images: string[], index: number) => {
    setViewerImages(images);
    setViewerIndex(index);
    setIsViewerVisible(true);
  };

  const confirmDeletePost = (postId: string) => {
    Alert.alert("Delete this post?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const result = await deletePost(postId);
          if (!result.success) {
            Alert.alert("Couldn't delete post", result.error);
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <FlatList
        data={posts}
        keyExtractor={(post) => post.id}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.muted}
            colors={["#2563eb"]}
          />
        }
        ListHeaderComponent={
          <View>
            <Text className="text-sm px-4 pt-2 pb-3" style={{ color: colors.muted }}>
              Show everyone the awesome progress you are making!
            </Text>
            {!isLoggedIn && (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/auth/login",
                    params: { message: "Log in to share your progress" },
                  })
                }
                className="mx-4 mb-4 rounded-xl py-3.5 items-center"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-base font-semibold text-blue-600">Log in to post!</Text>
              </Pressable>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={user?.id}
            onPressPhoto={(index) => openViewer(item.images, index)}
            onToggleLike={() =>
              requireAuth(() => toggleLike(item.id), "Log in to like posts")
            }
            onPressComment={() =>
              requireAuth(() => setActiveCommentPostId(item.id), "Log in to comment")
            }
            onLongPress={() => confirmDeletePost(item.id)}
            onPressDelete={() => confirmDeletePost(item.id)}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator className="mt-20" color={colors.muted} />
          ) : (
            <View className="items-center mt-20 px-8">
              <Ionicons name="people-outline" size={40} color={colors.muted} />
              <Text className="text-center mt-3" style={{ color: colors.muted }}>
                No posts yet. Share something with the community!
              </Text>
            </View>
          )
        }
      />

      {isLoggedIn && (
        <Pressable
          onPress={() =>
            requireAuth(() => setIsComposerVisible(true), "Log in to share your progress")
          }
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 items-center justify-center shadow-lg"
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </Pressable>
      )}

      <NewPostModal
        visible={isComposerVisible && isLoggedIn}
        onClose={() => setIsComposerVisible(false)}
        onPost={(text, images) => createPost(text, images, user?.id ?? 0, authorUsername)}
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
        onSendComment={async (text) => {
          if (!activeCommentPostId) return;
          const result = await addComment(activeCommentPostId, text, authorUsername);
          if (!result.success) {
            Alert.alert("Couldn't add comment", result.error);
          }
        }}
      />
    </View>
  );
}
