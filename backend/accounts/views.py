from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import CustomTokenObtainPairSerializer, RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — create an account and log in immediately."""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — body: { email, password }."""

    serializer_class = CustomTokenObtainPairSerializer


class MeView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/me/ — the authenticated user's own profile."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    """POST /api/auth/logout/ — body: { refresh }. Blacklists the refresh
    token so it can no longer be used to mint new access tokens."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            RefreshToken(refresh_token).blacklist()
        except TokenError:
            return Response(
                {"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)
