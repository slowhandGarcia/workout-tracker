from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Comment, CommunityPost
from .serializers import CommentSerializer, CommunityPostSerializer


class IsAuthorOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author_id == request.user.id


class CommunityPostViewSet(viewsets.ModelViewSet):
    """Full CRUD at /api/posts/, plus POST /api/posts/{id}/like/ to toggle
    a like. Reads are public; writes require auth and ownership."""

    queryset = CommunityPost.objects.all().prefetch_related("comments__author", "likes")
    serializer_class = CommunityPostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        if post.likes.filter(pk=request.user.pk).exists():
            post.likes.remove(request.user)
            liked = False
        else:
            post.likes.add(request.user)
            liked = True
        return Response({"liked": liked, "like_count": post.likes.count()})


class CommentViewSet(viewsets.ModelViewSet):
    """Full CRUD at /api/comments/?post={id}."""

    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    def get_queryset(self):
        queryset = Comment.objects.all().select_related("author")
        post_id = self.request.query_params.get("post")
        if post_id:
            queryset = queryset.filter(post_id=post_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
