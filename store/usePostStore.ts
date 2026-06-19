import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Post } from "@/types";

interface PostStore {
  posts: Post[];
  addPost: (text: string, images: string[]) => void;
  likePost: (postId: string) => void;
  deletePost: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
}

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const usePostStore = create<PostStore>()(
  persist(
    (set) => ({
      posts: [],

      addPost: (text, images) =>
        set((state) => ({
          posts: [
            {
              id: newId(),
              username: "You",
              text,
              images,
              createdAt: new Date().toISOString(),
              likedByMe: false,
              likeCount: 0,
              comments: [],
            },
            ...state.posts,
          ],
        })),

      likePost: (postId) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id !== postId
              ? p
              : {
                  ...p,
                  likedByMe: !p.likedByMe,
                  likeCount: p.likeCount + (p.likedByMe ? -1 : 1),
                }
          ),
        })),

      deletePost: (postId) =>
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== postId),
        })),

      addComment: (postId, text) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id !== postId
              ? p
              : {
                  ...p,
                  comments: [
                    ...p.comments,
                    {
                      id: newId(),
                      username: "You",
                      text,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                }
          ),
        })),
    }),
    {
      name: "post-storage",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as PostStore;
        return {
          ...state,
          posts: state.posts.map((p) => ({ ...p, comments: p.comments ?? [] })),
        };
      },
    }
  )
);
